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

export async function createEvent(
  _previousState: EventActionState,
  formData: FormData,
): Promise<EventActionState> {
  const parsed = validationError(formData);
  if ("error" in parsed) return parsed.error;

  const { supabase, user } = await requireUser();
  const { data: event, error } = await supabase
    .from("events")
    .insert({
      user_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      start_date: parsed.data.startDate,
      status: parsed.data.status,
      icon: parsed.data.icon || null,
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

export async function updateEvent(
  _previousState: EventActionState,
  formData: FormData,
): Promise<EventActionState> {
  const parsed = validationError(formData);
  if ("error" in parsed) return parsed.error;
  if (!parsed.data.id) return { error: "事件信息无效。" };

  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("events")
    .update({
      title: parsed.data.title,
      description: parsed.data.description || null,
      start_date: parsed.data.startDate,
      status: parsed.data.status,
      icon: parsed.data.icon || null,
    })
    .eq("id", parsed.data.id);

  if (error) return { error: "保存事件失败，请稍后重试。" };

  try {
    await replaceEventTags(parsed.data.id, user.id, parseTagNames(parsed.data.tags));
  } catch {
    return { error: "事件已保存，但标签保存失败。请重试。" };
  }

  revalidatePath("/events");
  redirect(`/events/${parsed.data.id}/edit`);
}

const eventIdSchema = z.string().uuid();

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

const restoreEventSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["active", "paused", "completed"]),
});

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
