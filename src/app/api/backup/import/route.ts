import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BACKUP_SIZE = 10 * 1024 * 1024;
const identifier = z.string().uuid();
const nullableString = z.string().nullable().optional();

const backupSchema = z.object({
  format: z.literal("event-timeline-backup"),
  version: z.literal(1),
  collections: z.array(z.object({ id: identifier, name: z.string().trim().min(1).max(30), color: z.string().regex(/^#[0-9A-Fa-f]{6}$/) }).passthrough()).default([]),
  events: z.array(z.object({
    id: identifier,
    title: z.string().trim().min(1).max(120),
    description: nullableString,
    status: z.enum(["active", "paused", "completed", "archived"]),
    start_date: z.string().date(),
    icon: nullableString,
    collection_id: identifier.nullable().optional(),
  }).passthrough()),
  nodes: z.array(z.object({
    id: identifier,
    event_id: identifier,
    title: z.string().trim().min(1).max(160),
    content: nullableString,
    event_date: z.string().date(),
    event_time: nullableString,
    is_important: z.boolean().optional(),
    link_url: nullableString,
  }).passthrough()),
  attachments: z.array(z.object({ id: identifier }).passthrough()).default([]),
  tags: z.array(z.object({ id: identifier, name: z.string().trim().min(1).max(30) }).passthrough()).default([]),
  event_tags: z.array(z.object({ event_id: identifier, tag_id: identifier }).passthrough()).default([]),
  node_tags: z.array(z.object({ node_id: identifier, tag_id: identifier }).passthrough()).default([]),
  event_references: z.array(z.object({
    source_event_id: identifier,
    source_node_id: identifier.nullable().optional(),
    target_event_id: identifier,
    target_node_id: identifier.nullable().optional(),
    note: z.string().trim().max(300).nullable().optional(),
  }).passthrough()).default([]),
  node_checklist_items: z.array(z.object({
    node_id: identifier,
    event_id: identifier,
    content: z.string().trim().min(1).max(240),
    is_completed: z.boolean().optional(),
    position: z.number().int().min(0).max(100).optional(),
  }).passthrough()).default([]),
}).passthrough();

type Backup = z.infer<typeof backupSchema>;

function failure(message: string, status = 400) {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

function uniqueBy<T>(items: T[], key: (item: T) => string) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const itemKey = key(item);
    if (seen.has(itemKey)) return false;
    seen.add(itemKey);
    return true;
  });
}

async function importCollections(backup: Backup, userId: string, supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: existing, error: existingError } = await supabase.from("event_collections").select("id, name");
  if (existingError) throw new Error("读取现有分类失败。");
  const idByName = new Map((existing ?? []).map((collection) => [collection.name, collection.id]));
  const sourceToNew = new Map<string, string>();
  let imported = 0;

  for (const collection of uniqueBy(backup.collections, (item) => item.id)) {
    const present = idByName.get(collection.name);
    if (present) {
      sourceToNew.set(collection.id, present);
      continue;
    }
    const { data, error } = await supabase
      .from("event_collections")
      .insert({ user_id: userId, name: collection.name, color: collection.color })
      .select("id")
      .single();
    if (error || !data) throw new Error("创建分类失败。");
    idByName.set(collection.name, data.id);
    sourceToNew.set(collection.id, data.id);
    imported += 1;
  }
  return { sourceToNew, imported };
}

async function importTags(backup: Backup, userId: string, supabase: Awaited<ReturnType<typeof createClient>>) {
  const uniqueTags = uniqueBy(backup.tags, (item) => item.name);
  const tagIdByName = new Map<string, string>();
  if (uniqueTags.length) {
    const { data, error } = await supabase
      .from("tags")
      .upsert(uniqueTags.map((tag) => ({ user_id: userId, name: tag.name })), { onConflict: "user_id,name" })
      .select("id, name");
    if (error || !data) throw new Error("保存标签失败。");
    data.forEach((tag) => tagIdByName.set(tag.name, tag.id));
  }
  const sourceToNew = new Map(backup.tags.map((tag) => [tag.id, tagIdByName.get(tag.name)]).filter((entry): entry is [string, string] => Boolean(entry[1])));
  return { sourceToNew, imported: uniqueTags.length };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return failure("请先登录后再导入备份。", 401);

  let backup: Backup;
  try {
    const formData = await request.formData();
    const file = formData.get("backup");
    if (!(file instanceof File)) return failure("请选择 JSON 备份文件。");
    if (file.size > MAX_BACKUP_SIZE) return failure("备份文件不能超过 10MB。");
    backup = backupSchema.parse(JSON.parse(await file.text()));
  } catch (error) {
    if (error instanceof z.ZodError) return failure("备份结构不正确，请选择从事线下载的 JSON 备份。");
    return failure("无法读取备份文件，请检查文件后重试。");
  }

  try {
    const collections = await importCollections(backup, user.id, supabase);
    const eventsMap = new Map<string, string>();
    let importedEvents = 0;
    for (const event of uniqueBy(backup.events, (item) => item.id)) {
      const { data, error } = await supabase
        .from("events")
        .insert({
          user_id: user.id,
          title: event.title,
          description: event.description || null,
          status: event.status,
          start_date: event.start_date,
          icon: event.icon || null,
          collection_id: event.collection_id ? collections.sourceToNew.get(event.collection_id) ?? null : null,
          is_pinned: false,
        })
        .select("id")
        .single();
      if (error || !data) throw new Error("创建事件失败。");
      eventsMap.set(event.id, data.id);
      importedEvents += 1;
    }

    const tags = await importTags(backup, user.id, supabase);
    const eventTagRows = uniqueBy(backup.event_tags.flatMap((item) => {
      const eventId = eventsMap.get(item.event_id);
      const tagId = tags.sourceToNew.get(item.tag_id);
      return eventId && tagId ? [{ event_id: eventId, tag_id: tagId, user_id: user.id }] : [];
    }), (item) => `${item.event_id}:${item.tag_id}`);
    if (eventTagRows.length) {
      const { error } = await supabase.from("event_tags").insert(eventTagRows);
      if (error) throw new Error("关联事件标签失败。");
    }

    const nodesMap = new Map<string, string>();
    let importedNodes = 0;
    for (const node of uniqueBy(backup.nodes, (item) => item.id)) {
      const eventId = eventsMap.get(node.event_id);
      if (!eventId) continue;
      const { data, error } = await supabase
        .from("event_nodes")
        .insert({
          user_id: user.id,
          event_id: eventId,
          title: node.title,
          content: node.content || null,
          event_date: node.event_date,
          event_time: node.event_time || null,
          is_important: node.is_important ?? false,
          link_url: node.link_url || null,
        })
        .select("id")
        .single();
      if (error || !data) throw new Error("创建节点失败。");
      nodesMap.set(node.id, data.id);
      importedNodes += 1;
    }

    const nodeTagRows = uniqueBy(backup.node_tags.flatMap((item) => {
      const nodeId = nodesMap.get(item.node_id);
      const tagId = tags.sourceToNew.get(item.tag_id);
      return nodeId && tagId ? [{ node_id: nodeId, tag_id: tagId, user_id: user.id }] : [];
    }), (item) => `${item.node_id}:${item.tag_id}`);
    if (nodeTagRows.length) {
      const { error } = await supabase.from("node_tags").insert(nodeTagRows);
      if (error) throw new Error("关联节点标签失败。");
    }

    const checklistRows = uniqueBy(backup.node_checklist_items.flatMap((item) => {
      const nodeId = nodesMap.get(item.node_id);
      const eventId = eventsMap.get(item.event_id);
      return nodeId && eventId ? [{ node_id: nodeId, event_id: eventId, user_id: user.id, content: item.content, is_completed: item.is_completed ?? false, position: item.position ?? 0 }] : [];
    }), (item) => `${item.node_id}:${item.position}:${item.content}`);
    let skippedChecklistItems = 0;
    if (checklistRows.length) {
      const { error } = await supabase.from("node_checklist_items").insert(checklistRows);
      const checklistsUnavailable = error?.code === "42P01" || error?.code === "PGRST205";
      if (error && !checklistsUnavailable) throw new Error("恢复节点清单失败。");
      if (checklistsUnavailable) skippedChecklistItems = checklistRows.length;
    }

    const referenceRows = uniqueBy(backup.event_references.flatMap((item) => {
      const sourceEventId = eventsMap.get(item.source_event_id);
      const targetEventId = eventsMap.get(item.target_event_id);
      const sourceNodeId = item.source_node_id ? nodesMap.get(item.source_node_id) : null;
      const targetNodeId = item.target_node_id ? nodesMap.get(item.target_node_id) : null;
      if (!sourceEventId || !targetEventId || (item.source_node_id && !sourceNodeId) || (item.target_node_id && !targetNodeId)) return [];
      if (sourceEventId === targetEventId && !sourceNodeId && !targetNodeId) return [];
      return [{ user_id: user.id, source_event_id: sourceEventId, source_node_id: sourceNodeId ?? null, target_event_id: targetEventId, target_node_id: targetNodeId ?? null, note: item.note || null }];
    }), (item) => `${item.source_event_id}:${item.source_node_id ?? ""}:${item.target_event_id}:${item.target_node_id ?? ""}`);
    if (referenceRows.length) {
      const { error } = await supabase.from("event_references").insert(referenceRows);
      if (error) throw new Error("恢复事件关联失败。");
    }

    return Response.json({
      result: {
        imported: {
          collections: collections.imported,
          events: importedEvents,
          nodes: importedNodes,
          tags: tags.imported,
          references: referenceRows.length,
          checklistItems: checklistRows.length - skippedChecklistItems,
        },
        skippedAttachments: backup.attachments.length,
        skippedChecklistItems,
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Backup import failed", error);
    return failure("导入中断，可能已创建部分副本。请先检查当前记录，再决定是否重新导入。", 500);
  }
}
