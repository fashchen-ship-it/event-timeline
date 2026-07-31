import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { EditableNode, EventDetail, TimelineNode } from "@/lib/timeline/types";
import type { EditableEvent, EventSummary } from "./types";

export async function getEvents() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("id, title, description, status, start_date, icon, updated_at, event_nodes(count)")
    .neq("status", "archived")
    .order("updated_at", { ascending: false });

  if (error) throw new Error("无法读取事件，请稍后刷新重试。");
  return (data ?? []) as EventSummary[];
}

export async function getArchivedEvents() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("id, title, description, status, start_date, icon, updated_at, event_nodes(count)")
    .eq("status", "archived")
    .order("updated_at", { ascending: false });

  if (error) throw new Error("无法读取归档事件，请稍后刷新重试。");
  return (data ?? []) as EventSummary[];
}

export async function getTags() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("tags").select("name").order("name");
  if (error) throw new Error("无法读取标签，请稍后刷新重试。");
  return (data ?? []).map((tag) => tag.name);
}

export async function getEventForEdit(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("id, title, description, status, start_date, icon, event_tags(tag:tags(id, name))")
    .eq("id", id)
    .single();

  if (error || !data) notFound();
  return data as unknown as EditableEvent;
}

export async function getEventDetail(id: string, newestFirst: boolean, importantOnly: boolean) {
  const supabase = await createClient();
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, title, description, status, start_date, icon, event_tags(tag:tags(id, name))")
    .eq("id", id)
    .single();

  if (eventError || !event) notFound();

  let nodesQuery = supabase
    .from("event_nodes")
    .select("id, title, content, event_date, event_time, is_important, link_url, created_at, updated_at, attachments(id, file_name, file_type, file_size, storage_path), node_tags(tag:tags(id, name))")
    .eq("event_id", id)
    .order("event_date", { ascending: !newestFirst })
    .order("event_time", { ascending: !newestFirst, nullsFirst: false });

  if (importantOnly) nodesQuery = nodesQuery.eq("is_important", true);
  const { data: nodes, error: nodesError } = await nodesQuery;
  if (nodesError) throw new Error("无法读取时间线，请稍后刷新重试。");

  const typedNodes = (nodes ?? []) as unknown as TimelineNode[];
  const paths = typedNodes.flatMap((node) => node.attachments.map((attachment) => attachment.storage_path));
  const { data: signedUrls } = paths.length
    ? await supabase.storage.from("timeline-files").createSignedUrls(paths, 60 * 60)
    : { data: [] };
  const urls = new Map((signedUrls ?? []).map((file) => [file.path, file.signedUrl]));

  return {
    event: event as unknown as EventDetail,
    nodes: typedNodes.map((node) => ({
      ...node,
      attachments: node.attachments.map((attachment) => ({ ...attachment, signed_url: urls.get(attachment.storage_path) ?? undefined })),
    })),
  };
}

export async function getNodeForEdit(eventId: string, nodeId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_nodes")
    .select("id, title, content, event_date, event_time, is_important, link_url, attachments(id, file_name, file_type, file_size, storage_path), node_tags(tag:tags(id, name))")
    .eq("id", nodeId)
    .eq("event_id", eventId)
    .single();

  if (error || !data) notFound();
  return data as unknown as EditableNode;
}
