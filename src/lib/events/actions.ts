"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { eventFormSchema, parseTagNames, type EventActionState } from "./schema";

type ParsedEventForm =
  | { data: ReturnType<typeof eventFormSchema.parse> }
  | { error: EventActionState };

function formValues(formData: FormData) {
  return {
    id: formData.get("id") || undefined,
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    startDate: formData.get("startDate"),
    status: formData.get("status"),
    icon: formData.get("icon") || undefined,
    collection: formData.get("collection") || undefined,
    tags: formData.get("tags") || undefined,
  };
}

function validationError(formData: FormData): ParsedEventForm {
  const result = eventFormSchema.safeParse(formValues(formData));
  if (result.success) return { data: result.data };

  const fields = result.error.flatten().fieldErrors;
  return {
    error: {
      error: "请检查填写内容。",
      fieldErrors: {
        title: fields.title?.[0],
        description: fields.description?.[0],
        startDate: fields.startDate?.[0],
        icon: fields.icon?.[0],
        collection: fields.collection?.[0],
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

async function replaceEventTags(eventId: string, userId: string, names: string[]) {
  const { supabase } = await requireUser();
  const { error: removeError } = await supabase.from("event_tags").delete().eq("event_id", eventId);
  if (removeError) throw new Error("更新标签时出现问题，请重试。");
  if (!names.length) return;

  const { data: tags, error: tagError } = await supabase
    .from("tags")
    .upsert(names.map((name) => ({ user_id: userId, name })), { onConflict: "user_id,name" })
    .select("id");
  if (tagError || !tags) throw new Error("保存标签时出现问题，请重试。");

  const { error: linkError } = await supabase
    .from("event_tags")
    .insert(tags.map((tag) => ({ event_id: eventId, tag_id: tag.id, user_id: userId })));
  if (linkError) throw new Error("关联标签时出现问题，请重试。");
}

async function resolveCollectionId(name: string | undefined, userId: string) {
  if (!name) return null;
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("event_collections")
    .upsert({ user_id: userId, name }, { onConflict: "user_id,name" })
    .select("id")
    .single();
  if (error || !data) throw new Error("保存分类时出现问题，请重试。");
  return data.id;
}

export async function createEvent(_previousState: EventActionState, formData: FormData): Promise<EventActionState> {
  const parsed = validationError(formData);
  if ("error" in parsed) return parsed.error;

  const { supabase, user } = await requireUser();
  let collectionId: string | null = null;
  try {
    collectionId = await resolveCollectionId(parsed.data.collection, user.id);
  } catch {
    return { error: "保存分类失败，请稍后重试。" };
  }

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      user_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      start_date: parsed.data.startDate,
      status: parsed.data.status,
      icon: parsed.data.icon || null,
      collection_id: collectionId,
    })
    .select("id")
    .single();
  if (error || !event) return { error: "创建事件失败，请稍后重试。" };

  try {
    await replaceEventTags(event.id, user.id, parseTagNames(parsed.data.tags));
  } catch {
    return { error: "事件已创建，但标签保存失败。请打开编辑页后重新保存标签。" };
  }
  revalidatePath("/events");
  redirect(`/events/${event.id}/edit`);
}

export async function updateEvent(_previousState: EventActionState, formData: FormData): Promise<EventActionState> {
  const parsed = validationError(formData);
  if ("error" in parsed) return parsed.error;
  if (!parsed.data.id) return { error: "事件信息无效。" };

  const { supabase, user } = await requireUser();
  let collectionId: string | null = null;
  try {
    collectionId = await resolveCollectionId(parsed.data.collection, user.id);
  } catch {
    return { error: "保存分类失败，请稍后重试。" };
  }
  const { error } = await supabase
    .from("events")
    .update({
      title: parsed.data.title,
      description: parsed.data.description || null,
      start_date: parsed.data.startDate,
      status: parsed.data.status,
      icon: parsed.data.icon || null,
      collection_id: collectionId,
    })
    .eq("id", parsed.data.id);
  if (error) return { error: "保存事件失败，请稍后重试。" };

  try {
    await replaceEventTags(parsed.data.id, user.id, parseTagNames(parsed.data.tags));
  } catch {
    return { error: "事件已保存，但标签保存失败。请重试。" };
  }
  revalidatePath("/events");
  revalidatePath(`/events/${parsed.data.id}`);
  redirect(`/events/${parsed.data.id}/edit`);
}

const eventIdSchema = z.string().uuid();
const pinEventSchema = z.object({ id: z.string().uuid(), isPinned: z.enum(["true", "false"]) });
const collectionSchema = z.object({ id: z.string().uuid(), name: z.string().trim().min(1).max(30) });
const referenceSchema = z.object({
  sourceEventId: z.string().uuid(),
  targetEventId: z.string().uuid(),
  note: z.string().trim().max(300, "关联说明不能超过 300 个字符。").optional(),
});

export type ReferenceActionState = { error?: string; success?: string };

export async function setEventPinned(formData: FormData) {
  const parsed = pinEventSchema.safeParse({ id: formData.get("id"), isPinned: formData.get("isPinned") });
  if (!parsed.success) return;
  const { supabase } = await requireUser();
  const { error } = await supabase.from("events").update({ is_pinned: parsed.data.isPinned === "true" }).eq("id", parsed.data.id);
  if (error) throw new Error("更新置顶状态失败，请稍后重试。");
  revalidatePath("/events");
  revalidatePath(`/events/${parsed.data.id}`);
}

export async function renameEventCollection(formData: FormData) {
  const parsed = collectionSchema.safeParse({ id: formData.get("id"), name: formData.get("name") });
  if (!parsed.success) throw new Error("分类名称应为 1 到 30 个字符。");
  const { supabase } = await requireUser();
  const { error } = await supabase.from("event_collections").update({ name: parsed.data.name }).eq("id", parsed.data.id);
  if (error) throw new Error("修改分类失败；可能已存在同名分类。");
  revalidatePath("/events");
  revalidatePath("/me");
}

export async function deleteEventCollection(formData: FormData) {
  const id = eventIdSchema.safeParse(formData.get("id"));
  if (!id.success) return;
  const { supabase } = await requireUser();
  const { error } = await supabase.from("event_collections").delete().eq("id", id.data);
  if (error) throw new Error("删除分类失败，请稍后重试。");
  revalidatePath("/events");
  revalidatePath("/me");
}

export async function createEventReference(
  _previousState: ReferenceActionState,
  formData: FormData,
): Promise<ReferenceActionState> {
  const parsed = referenceSchema.safeParse({
    sourceEventId: formData.get("sourceEventId"),
    targetEventId: formData.get("targetEventId"),
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors.note?.[0] ?? "请选择要关联的另一件事。" };
  if (parsed.data.sourceEventId === parsed.data.targetEventId) return { error: "不能关联到事件本身。" };

  const { supabase, user } = await requireUser();
  const { data: target } = await supabase.from("events").select("id").eq("id", parsed.data.targetEventId).maybeSingle();
  if (!target) return { error: "找不到要关联的事件。" };

  const { error } = await supabase.from("event_references").insert({
    user_id: user.id,
    source_event_id: parsed.data.sourceEventId,
    target_event_id: parsed.data.targetEventId,
    note: parsed.data.note || null,
  });
  if (error) return { error: "保存关联失败；这两件事可能已经关联过了。" };
  revalidatePath(`/events/${parsed.data.sourceEventId}`);
  revalidatePath(`/events/${parsed.data.targetEventId}`);
  return { success: "关联已添加。" };
}

const deleteReferenceSchema = z.object({ sourceEventId: z.string().uuid(), referenceId: z.string().uuid(), returnEventId: z.string().uuid().optional() });

export async function deleteEventReference(formData: FormData) {
  const parsed = deleteReferenceSchema.safeParse({ sourceEventId: formData.get("sourceEventId"), referenceId: formData.get("referenceId"), returnEventId: formData.get("returnEventId") || undefined });
  if (!parsed.success) return;
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("event_references")
    .delete()
    .eq("id", parsed.data.referenceId)
    .eq("source_event_id", parsed.data.sourceEventId);
  if (error) throw new Error("删除关联失败，请稍后重试。");
  revalidatePath(`/events/${parsed.data.sourceEventId}`);
  if (parsed.data.returnEventId) revalidatePath(`/events/${parsed.data.returnEventId}`);
}

export async function archiveEvent(formData: FormData) {
  const id = eventIdSchema.safeParse(formData.get("id"));
  if (!id.success) return;
  const { supabase } = await requireUser();
  const { error } = await supabase.from("events").update({ status: "archived" }).eq("id", id.data);
  if (error) throw new Error("归档事件失败，请稍后重试。");
  revalidatePath("/events");
  revalidatePath("/archive");
  redirect("/events");
}

export async function batchArchiveEvents(formData: FormData) {
  const ids = [...new Set(formData.getAll("eventIds"))]
    .map((value) => eventIdSchema.safeParse(value))
    .flatMap((result) => result.success ? [result.data] : []);
  if (!ids.length) return;

  const { supabase } = await requireUser();
  const { error } = await supabase.from("events").update({ status: "archived" }).in("id", ids);
  if (error) throw new Error("批量归档失败，请稍后重试。");
  revalidatePath("/events");
  revalidatePath("/archive");
}

const batchStatusSchema = z.enum(["active", "paused", "completed", "archived"]);

const quickStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["active", "paused", "completed"]),
});

export async function updateEventStatus(formData: FormData) {
  const parsed = quickStatusSchema.safeParse({ id: formData.get("id"), status: formData.get("status") });
  if (!parsed.success) return;

  const { supabase } = await requireUser();
  const { error } = await supabase.from("events").update({ status: parsed.data.status }).eq("id", parsed.data.id);
  if (error) throw new Error("更新事件状态失败，请稍后重试。");
  revalidatePath("/events");
  revalidatePath("/archive");
  revalidatePath(`/events/${parsed.data.id}`);
}

export async function batchUpdateEventStatus(formData: FormData) {
  const ids = [...new Set(formData.getAll("eventIds"))]
    .map((value) => eventIdSchema.safeParse(value))
    .flatMap((result) => result.success ? [result.data] : []);
  const status = batchStatusSchema.safeParse(formData.get("status"));
  if (!ids.length || !status.success) return;
  const { supabase } = await requireUser();
  const { error } = await supabase.from("events").update({ status: status.data }).in("id", ids);
  if (error) throw new Error("批量更新状态失败，请稍后重试。");
  revalidatePath("/events");
  revalidatePath("/archive");
}

const restoreEventSchema = z.object({ id: z.string().uuid(), status: z.enum(["active", "paused", "completed"]) });

export async function restoreEvent(formData: FormData) {
  const parsed = restoreEventSchema.safeParse({ id: formData.get("id"), status: formData.get("status") });
  if (!parsed.success) return;
  const { supabase } = await requireUser();
  const { error } = await supabase.from("events").update({ status: parsed.data.status }).eq("id", parsed.data.id);
  if (error) throw new Error("恢复事件失败，请稍后重试。");
  revalidatePath("/events");
  revalidatePath("/archive");
  redirect("/archive");
}

export async function deleteEvent(formData: FormData) {
  const id = eventIdSchema.safeParse(formData.get("id"));
  if (!id.success) return;
  const { supabase } = await requireUser();
  const { data: nodes } = await supabase.from("event_nodes").select("id").eq("event_id", id.data);
  const nodeIds = (nodes ?? []).map((node) => node.id);
  if (nodeIds.length) {
    const { data: attachments } = await supabase.from("attachments").select("storage_path").in("node_id", nodeIds);
    const paths = (attachments ?? []).map((attachment) => attachment.storage_path);
    if (paths.length) {
      const { error: storageError } = await supabase.storage.from("timeline-files").remove(paths);
      if (storageError) throw new Error("无法清理事件附件，请稍后重试删除操作。");
    }
  }
  const { error } = await supabase.from("events").delete().eq("id", id.data);
  if (error) throw new Error("删除事件失败，请稍后重试。");
  revalidatePath("/events");
  revalidatePath("/archive");
  redirect("/events");
}
