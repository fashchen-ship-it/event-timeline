import { createZip } from "@/lib/backup/zip";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ARCHIVE_BYTES = 35 * 1024 * 1024;
const encoder = new TextEncoder();

function safeFileName(value: string) {
  const clean = value.replace(/[\\/:*?"<>|\x00-\x1f]/g, "_").replace(/^\.+/, "_").trim();
  return (clean || "attachment").slice(0, 180);
}

function fileName() {
  return `event-timeline-full-backup-${new Date().toISOString().slice(0, 10)}.zip`;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("请先登录后再下载完整备份。", { status: 401 });

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
  if (requiredResults.some((result) => result.error)) return new Response("读取完整备份数据失败，请稍后重试。", { status: 500 });
  const { data: checklistItems, error: checklistError } = await supabase.from("node_checklist_items").select("id, node_id, event_id, content, is_completed, position, created_at, updated_at").order("created_at");
  if (checklistError && !["42P01", "PGRST205"].includes(checklistError.code)) return new Response("读取清单备份失败，请稍后重试。", { status: 500 });

  const attachments = attachmentsResult.data ?? [];
  const recordedBytes = attachments.reduce((total, item) => total + Number(item.file_size || 0), 0);
  if (recordedBytes > MAX_ARCHIVE_BYTES) return new Response("附件原件合计超过 35MB，暂不能生成单文件完整备份。请使用 JSON 和附件 ZIP 分开保存。", { status: 413 });

  const entries: { name: string; data: Uint8Array; modifiedAt?: Date }[] = [];
  const files: { attachment_id: string; archive_path: string }[] = [];
  let downloadedBytes = 0;
  for (const attachment of attachments) {
    const { data, error } = await supabase.storage.from("timeline-files").download(attachment.storage_path);
    if (error || !data) continue;
    const bytes = new Uint8Array(await data.arrayBuffer());
    downloadedBytes += bytes.length;
    if (downloadedBytes > MAX_ARCHIVE_BYTES) return new Response("附件原件合计超过 35MB，暂不能生成单文件完整备份。请使用 JSON 和附件 ZIP 分开保存。", { status: 413 });
    const archivePath = `files/${attachment.id}-${safeFileName(attachment.file_name)}`;
    entries.push({ name: archivePath, data: bytes, modifiedAt: attachment.created_at ? new Date(attachment.created_at) : undefined });
    files.push({ attachment_id: attachment.id, archive_path: archivePath });
  }
  const payload = {
    format: "event-timeline-backup", version: 1, exported_at: new Date().toISOString(), note: "完整备份 ZIP 包含附件原件。",
    collections: collectionsResult.data ?? [], events: eventsResult.data ?? [], nodes: nodesResult.data ?? [], attachments,
    tags: tagsResult.data ?? [], event_tags: eventTagsResult.data ?? [], node_tags: nodeTagsResult.data ?? [],
    event_references: referencesResult.data ?? [], event_visits: visitsResult.data ?? [], node_checklist_items: checklistItems ?? [],
  };
  const manifest = { format: "event-timeline-full-backup", version: 1, attachment_files: files };
  entries.unshift({ name: "backup.json", data: encoder.encode(JSON.stringify(payload)), modifiedAt: new Date() });
  entries.unshift({ name: "full-backup.json", data: encoder.encode(JSON.stringify(manifest)), modifiedAt: new Date() });
  const archive = createZip(entries);
  if (archive.length > MAX_ARCHIVE_BYTES) return new Response("完整备份超过 35MB，暂不能生成单文件备份。请使用 JSON 和附件 ZIP 分开保存。", { status: 413 });
  return new Response(archive, { headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${fileName()}"`, "Cache-Control": "no-store" } });
}
