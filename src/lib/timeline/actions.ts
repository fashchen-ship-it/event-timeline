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
  try {
    uploads = JSON.parse(String(formData.get("uploads") ?? "[]"));
  } catch {
    uploads = null;
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
    await addAttachments(supabase, node.id, user.id, parsed.data.uploads);
  } catch {
    return { error: "节点已创建，但标签或附件保存失败。请打开编辑页后重试。" };
  }

  revalidatePath(`/events/${parsed.data.eventId}`);
  revalidatePath("/events");
  redirect(`/events/${parsed.data.eventId}`);
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
    await addAttachments(supabase, parsed.data.id, user.id, parsed.data.uploads);
  } catch {
    return { error: "节点已保存，但标签或附件保存失败。请重试。" };
  }

  revalidatePath(`/events/${parsed.data.eventId}`);
  revalidatePath("/events");
  redirect(`/events/${parsed.data.eventId}`);
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

  revalidatePath(`/events/${parsed.data.eventId}`);
  revalidatePath("/events");
  redirect(`/events/${parsed.data.eventId}`);
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
