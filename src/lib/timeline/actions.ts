"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { nodeFormSchema, parseTagNames, type NodeActionState } from "./schema";

type ParsedNodeForm =
  | { data: ReturnType<typeof nodeFormSchema.parse> }
  | { error: NodeActionState };

function formValues(formData: FormData) {
  let uploads: unknown = [];
  let checklistItems: unknown = [];
  try {
    uploads = JSON.parse(String(formData.get("uploads") ?? "[]"));
  } catch {
    uploads = null;
  }
  try {
    checklistItems = JSON.parse(String(formData.get("checklistItems") ?? "[]"));
  } catch {
    checklistItems = null;
  }

  return {
    id: formData.get("id") || undefined,
    eventId: formData.get("eventId"),
    title: formData.get("title"),
    eventDate: formData.get("eventDate"),
    eventTime: formData.get("eventTime") || undefined,
    content: formData.get("content") || undefined,
    linkUrl: formData.get("linkUrl") || undefined,
    tags: formData.get("tags") || undefined,
    isImportant: formData.get("isImportant") === "on",
    checklistItems,
    referenceTargetEventId: formData.get("referenceTargetEventId") || undefined,
    referenceTargetNodeId: formData.get("referenceTargetNodeId") || undefined,
    referenceNote: formData.get("referenceNote") || undefined,
    uploads,
  };
}

function validationError(formData: FormData): ParsedNodeForm {
  const result = nodeFormSchema.safeParse(formValues(formData));
  if (result.success) return { data: result.data };

  const fields = result.error.flatten().fieldErrors;
  return {
    error: {
      error: "请检查填写内容或附件。",
      fieldErrors: {
        title: fields.title?.[0],
        eventDate: fields.eventDate?.[0],
        eventTime: fields.eventTime?.[0],
        content: fields.content?.[0],
        linkUrl: fields.linkUrl?.[0],
        tags: fields.tags?.[0],
        checklistItems: fields.checklistItems?.[0],
        referenceTargetNodeId: fields.referenceTargetNodeId?.[0],
      },
    },
  };
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

async function userOwnsEvent(supabase: Awaited<ReturnType<typeof createClient>>, eventId: string) {
  const { data } = await supabase.from("events").select("id").eq("id", eventId).maybeSingle();
  return Boolean(data);
}

async function touchEvent(supabase: Awaited<ReturnType<typeof createClient>>, eventId: string) {
  const { error } = await supabase.from("events").update({ updated_at: new Date().toISOString() }).eq("id", eventId);
  if (error) throw new Error("更新事线时间失败，请稍后重试。");
}

async function clearStorageFiles(
  supabase: Awaited<ReturnType<typeof createClient>>,
  paths: string[],
) {
  if (paths.length) await supabase.storage.from("timeline-files").remove(paths);
}

async function replaceNodeTags(
  supabase: Awaited<ReturnType<typeof createClient>>,
  nodeId: string,
  userId: string,
  names: string[],
) {
  const { error: removeError } = await supabase.from("node_tags").delete().eq("node_id", nodeId);
  if (removeError) throw new Error("更新标签时出现问题，请重试。");
  if (!names.length) return;

  const { data: tags, error: tagError } = await supabase
    .from("tags")
    .upsert(names.map((name) => ({ user_id: userId, name })), { onConflict: "user_id,name" })
    .select("id");
  if (tagError || !tags) throw new Error("保存标签时出现问题，请重试。");

  const { error: linkError } = await supabase
    .from("node_tags")
    .insert(tags.map((tag) => ({ node_id: nodeId, tag_id: tag.id, user_id: userId })));
  if (linkError) throw new Error("关联标签时出现问题，请重试。");
}

async function replaceNodeChecklist(
  supabase: Awaited<ReturnType<typeof createClient>>,
  nodeId: string,
  eventId: string,
  userId: string,
  items: ReturnType<typeof nodeFormSchema.parse>["checklistItems"],
) {
  const { error: removeError } = await supabase.from("node_checklist_items").delete().eq("node_id", nodeId);
  if (removeError && !items.length && ["42P01", "PGRST205"].includes(removeError.code)) return;
  if (removeError) throw new Error("更新节点清单时出现问题，请重试。");
  if (!items.length) return;

  const { error } = await supabase.from("node_checklist_items").insert(
    items.map((item, position) => ({
      node_id: nodeId,
      event_id: eventId,
      user_id: userId,
      content: item.content,
      is_completed: item.isCompleted,
      position,
    })),
  );
  if (error) throw new Error("保存节点清单时出现问题，请重试。");
}

async function replaceNodeReference(
  supabase: Awaited<ReturnType<typeof createClient>>,
  nodeId: string,
  eventId: string,
  userId: string,
  targetEventId: string | undefined,
  targetNodeId: string | undefined,
  note: string | undefined,
) {
  const { error: removeError } = await supabase.from("event_references").delete().eq("source_node_id", nodeId);
  if (removeError) throw new Error("更新节点关联时出现问题，请重试。");
  if (!targetEventId || !targetNodeId) return;
  if (targetNodeId === nodeId) throw new Error("节点不能关联到自身。");

  const { data: target } = await supabase
    .from("event_nodes")
    .select("id")
    .eq("id", targetNodeId)
    .eq("event_id", targetEventId)
    .maybeSingle();
  if (!target) throw new Error("找不到要关联的节点。");

  const { error } = await supabase.from("event_references").insert({
    user_id: userId,
    source_event_id: eventId,
    source_node_id: nodeId,
    target_event_id: targetEventId,
    target_node_id: targetNodeId,
    note: note || null,
  });
  if (error) throw new Error("保存节点关联时出现问题，请重试。");
}

async function addAttachments(
  supabase: Awaited<ReturnType<typeof createClient>>,
  nodeId: string,
  userId: string,
  uploads: ReturnType<typeof nodeFormSchema.parse>["uploads"],
) {
  if (!uploads.length) return;

  const { error } = await supabase.from("attachments").insert(
    uploads.map((file) => ({
      node_id: nodeId,
      user_id: userId,
      file_name: file.fileName,
      file_url: file.filePath,
      storage_path: file.filePath,
      file_type: file.fileType,
      file_size: file.fileSize,
    })),
  );
  if (error) throw new Error("保存附件信息失败，请重试。");
}

function uploadsBelongToUser(
  uploads: ReturnType<typeof nodeFormSchema.parse>["uploads"],
  userId: string,
  eventId: string,
) {
  return uploads.every((file) => file.filePath.startsWith(`${userId}/${eventId}/`));
}

export async function createNode(
  _previousState: NodeActionState,
  formData: FormData,
): Promise<NodeActionState> {
  const parsed = validationError(formData);
  if ("error" in parsed) return parsed.error;

  const { supabase, user } = await requireUser();
  if (!(await userOwnsEvent(supabase, parsed.data.eventId))) return { error: "找不到对应事件，无法保存节点。" };
  if (!uploadsBelongToUser(parsed.data.uploads, user.id, parsed.data.eventId)) return { error: "附件路径无效，请重新选择文件。" };

  const { data: node, error } = await supabase
    .from("event_nodes")
    .insert({
      event_id: parsed.data.eventId,
      user_id: user.id,
      title: parsed.data.title,
      content: parsed.data.content || null,
      event_date: parsed.data.eventDate,
      event_time: parsed.data.eventTime || null,
      is_important: parsed.data.isImportant,
      link_url: parsed.data.linkUrl || null,
    })
    .select("id")
    .single();

  if (error || !node) {
    await clearStorageFiles(supabase, parsed.data.uploads.map((file) => file.filePath));
    return { error: "创建节点失败，请稍后重试。" };
  }

  try {
    await replaceNodeTags(supabase, node.id, user.id, parseTagNames(parsed.data.tags));
    await replaceNodeChecklist(supabase, node.id, parsed.data.eventId, user.id, parsed.data.checklistItems);
    await replaceNodeReference(supabase, node.id, parsed.data.eventId, user.id, parsed.data.referenceTargetEventId, parsed.data.referenceTargetNodeId, parsed.data.referenceNote);
    await addAttachments(supabase, node.id, user.id, parsed.data.uploads);
    await touchEvent(supabase, parsed.data.eventId);
  } catch {
    return { error: "节点已创建，但标签或附件保存失败。请打开编辑页后重试。" };
  }

  revalidatePath(`/events/${parsed.data.eventId}`);
  revalidatePath("/events");
  revalidatePath("/projects");
  redirect(`/events/${parsed.data.eventId}?notice=node-saved`);
}

export async function updateNode(
  _previousState: NodeActionState,
  formData: FormData,
): Promise<NodeActionState> {
  const parsed = validationError(formData);
  if ("error" in parsed) return parsed.error;
  if (!parsed.data.id) return { error: "节点信息无效。" };

  const { supabase, user } = await requireUser();
  if (!(await userOwnsEvent(supabase, parsed.data.eventId))) return { error: "找不到对应事件，无法保存节点。" };
  if (!uploadsBelongToUser(parsed.data.uploads, user.id, parsed.data.eventId)) return { error: "附件路径无效，请重新选择文件。" };

  const { data: existing } = await supabase
    .from("event_nodes")
    .select("id")
    .eq("id", parsed.data.id)
    .eq("event_id", parsed.data.eventId)
    .maybeSingle();
  if (!existing) return { error: "找不到该节点。" };

  const { error } = await supabase
    .from("event_nodes")
    .update({
      title: parsed.data.title,
      content: parsed.data.content || null,
      event_date: parsed.data.eventDate,
      event_time: parsed.data.eventTime || null,
      is_important: parsed.data.isImportant,
      link_url: parsed.data.linkUrl || null,
    })
    .eq("id", parsed.data.id);
  if (error) return { error: "保存节点失败，请稍后重试。" };

  try {
    await replaceNodeTags(supabase, parsed.data.id, user.id, parseTagNames(parsed.data.tags));
    await replaceNodeChecklist(supabase, parsed.data.id, parsed.data.eventId, user.id, parsed.data.checklistItems);
    await replaceNodeReference(supabase, parsed.data.id, parsed.data.eventId, user.id, parsed.data.referenceTargetEventId, parsed.data.referenceTargetNodeId, parsed.data.referenceNote);
    await addAttachments(supabase, parsed.data.id, user.id, parsed.data.uploads);
    await touchEvent(supabase, parsed.data.eventId);
  } catch {
    return { error: "节点已保存，但标签或附件保存失败。请重试。" };
  }

  revalidatePath(`/events/${parsed.data.eventId}`);
  revalidatePath("/events");
  revalidatePath("/projects");
  redirect(`/events/${parsed.data.eventId}?notice=node-saved`);
}

const deleteNodeSchema = z.object({ eventId: z.string().uuid(), nodeId: z.string().uuid() });

export async function deleteNode(formData: FormData) {
  const parsed = deleteNodeSchema.safeParse({ eventId: formData.get("eventId"), nodeId: formData.get("nodeId") });
  if (!parsed.success) return;

  const { supabase } = await requireUser();
  const { data: attachments } = await supabase
    .from("attachments")
    .select("storage_path")
    .eq("node_id", parsed.data.nodeId);
  await clearStorageFiles(supabase, (attachments ?? []).map((file) => file.storage_path));

  const { error } = await supabase
    .from("event_nodes")
    .delete()
    .eq("id", parsed.data.nodeId)
    .eq("event_id", parsed.data.eventId);
  if (error) throw new Error("删除节点失败，请稍后重试。");

  await touchEvent(supabase, parsed.data.eventId);

  revalidatePath(`/events/${parsed.data.eventId}`);
  revalidatePath("/events");
  revalidatePath("/projects");
  redirect(`/events/${parsed.data.eventId}?notice=node-deleted`);
}

const deleteAttachmentSchema = z.object({ eventId: z.string().uuid(), nodeId: z.string().uuid(), attachmentId: z.string().uuid() });

export async function deleteAttachment(formData: FormData) {
  const parsed = deleteAttachmentSchema.safeParse({
    eventId: formData.get("eventId"),
    nodeId: formData.get("nodeId"),
    attachmentId: formData.get("attachmentId"),
  });
  if (!parsed.success) return;

  const { supabase } = await requireUser();
  const { data: attachment } = await supabase
    .from("attachments")
    .select("storage_path")
    .eq("id", parsed.data.attachmentId)
    .eq("node_id", parsed.data.nodeId)
    .maybeSingle();
  if (!attachment) return;

  await clearStorageFiles(supabase, [attachment.storage_path]);
  const { error } = await supabase.from("attachments").delete().eq("id", parsed.data.attachmentId);
  if (error) throw new Error("删除附件失败，请稍后重试。");

  revalidatePath(`/events/${parsed.data.eventId}`);
  revalidatePath(`/events/${parsed.data.eventId}/nodes/${parsed.data.nodeId}/edit`);
}
