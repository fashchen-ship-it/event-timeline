import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function backupFileName() {
  return `event-timeline-backup-${new Date().toISOString().slice(0, 10)}.json`;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("请先登录后再导出备份。", { status: 401 });

  const [collectionsResult, eventsResult, nodesResult, attachmentsResult, tagsResult, eventTagsResult, nodeTagsResult, referencesResult, visitsResult] = await Promise.all([
    supabase.from("event_collections").select("id, name, color, created_at, updated_at").order("name"),
    supabase.from("events").select("id, title, description, status, start_date, cover_url, icon, collection_id, is_pinned, created_at, updated_at").order("created_at"),
    supabase.from("event_nodes").select("id, event_id, title, content, event_date, event_time, is_important, link_url, created_at, updated_at").order("created_at"),
    supabase.from("attachments").select("id, node_id, file_name, file_url, storage_path, file_type, file_size, created_at").order("created_at"),
    supabase.from("tags").select("id, name, created_at").order("name"),
    supabase.from("event_tags").select("event_id, tag_id"),
    supabase.from("node_tags").select("node_id, tag_id"),
    supabase.from("event_references").select("id, source_event_id, source_node_id, target_event_id, target_node_id, note, created_at").order("created_at"),
    supabase.from("event_visits").select("event_id, visited_at").order("visited_at", { ascending: false }),
  ]);

  const requiredResults = [collectionsResult, eventsResult, nodesResult, attachmentsResult, tagsResult, eventTagsResult, nodeTagsResult, referencesResult, visitsResult];
  const failedResult = requiredResults.find((result) => result.error);
  if (failedResult?.error) return new Response("读取备份数据失败，请稍后重试。", { status: 500 });

  // Older installations may not yet contain the checklist migration. Their backup is still useful without it.
  const { data: checklistItems, error: checklistError } = await supabase
    .from("node_checklist_items")
    .select("id, node_id, event_id, content, is_completed, position, created_at, updated_at")
    .order("created_at");
  const checklistsUnavailable = checklistError?.code === "42P01" || checklistError?.code === "PGRST205";
  if (checklistError && !checklistsUnavailable) return new Response("读取清单备份失败，请稍后重试。", { status: 500 });

  const payload = {
    format: "event-timeline-backup",
    version: 1,
    exported_at: new Date().toISOString(),
    note: "附件仅导出文件记录，不含文件二进制内容。",
    collections: collectionsResult.data ?? [],
    events: eventsResult.data ?? [],
    nodes: nodesResult.data ?? [],
    attachments: attachmentsResult.data ?? [],
    tags: tagsResult.data ?? [],
    event_tags: eventTagsResult.data ?? [],
    node_tags: nodeTagsResult.data ?? [],
    event_references: referencesResult.data ?? [],
    event_visits: visitsResult.data ?? [],
    node_checklist_items: checklistItems ?? [],
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${backupFileName()}"`,
      "Cache-Control": "no-store",
    },
  });
}
