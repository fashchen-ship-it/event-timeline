import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { EditableNode, EventDetail, GlobalTimelineNode, TimelineNode } from "@/lib/timeline/types";
import type { NodeReferenceTarget } from "@/lib/timeline/types";
import type { EditableEvent, EventCollection, EventReference, EventSummary, ProjectEventSummary, ProjectTreeNode } from "./types";

const eventSummarySelect = "id, title, description, status, start_date, icon, updated_at, is_pinned, collection_id, collection:event_collections!events_collection_id_fkey(id, name, color), event_nodes(count), event_tags(tag:tags(id, name))";

export async function getEvents() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select(eventSummarySelect)
    .neq("status", "archived")
    .order("is_pinned", { ascending: false })
    .order("updated_at", { ascending: false });
  if (error) throw new Error("无法读取事件，请稍后刷新重试。");
  return (data ?? []) as unknown as EventSummary[];
}

export async function getEventsForProjects() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("id, title, status, icon, updated_at, collection_id")
    .neq("status", "archived")
    .order("updated_at", { ascending: false });
  if (error) throw new Error("无法读取项目分组，请稍后刷新重试。");
  return (data ?? []) as ProjectEventSummary[];
}

export async function getArchivedEvents() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select(eventSummarySelect)
    .eq("status", "archived")
    .order("updated_at", { ascending: false });
  if (error) throw new Error("无法读取归档事件，请稍后刷新重试。");
  return (data ?? []) as unknown as EventSummary[];
}

export async function getTags() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("tags").select("name").order("name");
  if (error) throw new Error("无法读取标签，请稍后刷新重试。");
  return (data ?? []).map((tag) => tag.name);
}

export async function getEventCollections() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("event_collections").select("id, name, color").order("name");
  if (error) throw new Error("无法读取分类，请稍后刷新重试。");
  return (data ?? []) as EventCollection[];
}

/** Uses attachment records to show the current user's storage footprint without reading file contents. */
export async function getAttachmentStorageOverview() {
  const supabase = await createClient();
  const [{ data: attachments, error: attachmentError }, { data: nodes, error: nodeError }, { data: events, error: eventError }] = await Promise.all([
    supabase.from("attachments").select("id, node_id, file_name, file_type, file_size, created_at").order("file_size", { ascending: false }),
    supabase.from("event_nodes").select("id, event_id, title"),
    supabase.from("events").select("id, title"),
  ]);
  if (attachmentError || nodeError || eventError) throw new Error("无法读取附件空间，请稍后刷新重试。");
  const nodesById = new Map((nodes ?? []).map((node) => [node.id, node]));
  const eventsById = new Map((events ?? []).map((event) => [event.id, event]));
  const files = (attachments ?? []).map((attachment) => {
    const node = nodesById.get(attachment.node_id);
    return { ...attachment, nodeTitle: node?.title ?? "已删除的节点", eventId: node?.event_id ?? null, eventTitle: node ? eventsById.get(node.event_id)?.title ?? "未命名事线" : null };
  });
  return {
    totalBytes: files.reduce((total, file) => total + Number(file.file_size || 0), 0),
    imageBytes: files.filter((file) => file.file_type.startsWith("image/")).reduce((total, file) => total + Number(file.file_size || 0), 0),
    fileCount: files.length,
    largestFiles: files.slice(0, 20),
  };
}

/** Falls back safely until the optional project-order migration has been applied. */
export async function getProjectCollections() {
  const collections = await getEventCollections();
  const supabase = await createClient();
  const { data, error } = await supabase.from("event_collections").select("id, is_favorite, position");
  if (error) return { collections, supportsOrdering: false };
  const settings = new Map((data ?? []).map((collection) => [collection.id, collection]));
  return {
    collections: collections.map((collection) => ({ ...collection, ...settings.get(collection.id) })),
    supportsOrdering: true,
  };
}

export async function getRecentEvents() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_visits")
    .select(`visited_at, event:events!event_visits_event_id_fkey(${eventSummarySelect})`)
    .order("visited_at", { ascending: false })
    .limit(4);
  if (error) throw new Error("无法读取最近访问的事件，请稍后刷新重试。");
  return (data ?? []).flatMap((visit) => (visit.event ? [visit.event as unknown as EventSummary] : []));
}

export async function getEventReferenceTargets(currentEventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("id, title")
    .neq("id", currentEventId)
    .neq("status", "archived")
    .order("updated_at", { ascending: false });
  if (error) throw new Error("无法读取可关联的事件，请稍后刷新重试。");
  return data ?? [];
}

export async function getNodeReferenceTargets() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("id, title, event_nodes(id, title, event_date)")
    .order("updated_at", { ascending: false });
  if (error) throw new Error("无法读取可关联的节点，请稍后刷新重试。");
  return (data ?? []).map((event) => ({
    id: event.id,
    title: event.title,
    nodes: (event.event_nodes ?? []).sort((a, b) => b.event_date.localeCompare(a.event_date)),
  })) as NodeReferenceTarget[];
}

export async function getEventRelations(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_references")
    .select("id, source_event_id, target_event_id, note")
    .or(`source_event_id.eq.${eventId},target_event_id.eq.${eventId}`)
    .is("source_node_id", null)
    .is("target_node_id", null)
    .order("created_at", { ascending: false });
  if (error) throw new Error("无法读取事件关联，请稍后刷新重试。");

  const references = data ?? [];
  const relatedIds = [...new Set(references.map((reference) => reference.source_event_id === eventId ? reference.target_event_id : reference.source_event_id))];
  if (!relatedIds.length) return { outgoing: [] as EventReference[], incoming: [] as EventReference[] };

  const { data: relatedEvents, error: relatedError } = await supabase.from("events").select("id, title, status, start_date, icon, updated_at, event_nodes(id, title, event_date, event_time, is_important)").in("id", relatedIds);
  if (relatedError) throw new Error("无法读取关联事件，请稍后刷新重试。");
  const details = new Map((relatedEvents ?? []).map((event) => [event.id, event]));
  const mapReference = (reference: (typeof references)[number], relatedId: string): EventReference | null => {
    const event = details.get(relatedId);
    const nodes = [...(event?.event_nodes ?? [])].sort((a, b) => b.event_date.localeCompare(a.event_date) || (b.event_time ?? "").localeCompare(a.event_time ?? ""));
    return event ? { id: reference.id, event_id: relatedId, event_title: event.title, note: reference.note, event_status: event.status, event_start_date: event.start_date, event_icon: event.icon, event_updated_at: event.updated_at, node_count: nodes.length, recent_nodes: nodes.slice(0, 3), timeline_nodes: nodes } : null;
  };

  return {
    outgoing: references.filter((reference) => reference.source_event_id === eventId).flatMap((reference) => {
      const result = mapReference(reference, reference.target_event_id);
      return result ? [result] : [];
    }),
    incoming: references.filter((reference) => reference.target_event_id === eventId).flatMap((reference) => {
      const result = mapReference(reference, reference.source_event_id);
      return result ? [result] : [];
    }),
  };
}

/** Builds a read-only hierarchy from the existing "project → parent" event links. */
export async function getEventProjectTree(rootEventId: string) {
  const supabase = await createClient();
  const [{ data: references, error: referenceError }, { data: events, error: eventError }] = await Promise.all([
    supabase.from("event_references").select("source_event_id, target_event_id").is("source_node_id", null).is("target_node_id", null),
    supabase.from("events").select("id, title, icon, status, event_nodes(count)"),
  ]);
  if (referenceError || eventError) throw new Error("无法读取项目层级，请稍后刷新重试。");
  const eventMap = new Map((events ?? []).map((event) => [event.id, event]));
  const childrenByParent = new Map<string, string[]>();
  for (const reference of references ?? []) {
    const children = childrenByParent.get(reference.target_event_id) ?? [];
    children.push(reference.source_event_id);
    childrenByParent.set(reference.target_event_id, children);
  }
  function build(parentId: string, ancestors: Set<string>): ProjectTreeNode[] {
    const childIds = [...new Set(childrenByParent.get(parentId) ?? [])];
    return childIds.flatMap((id) => {
      if (ancestors.has(id)) return [];
      const event = eventMap.get(id);
      if (!event) return [];
      const nextAncestors = new Set(ancestors);
      nextAncestors.add(id);
      return [{
        id: event.id,
        title: event.title,
        icon: event.icon,
        status: event.status as ProjectTreeNode["status"],
        nodeCount: event.event_nodes?.[0]?.count ?? 0,
        children: build(event.id, nextAncestors),
      }];
    }).sort((a, b) => a.title.localeCompare(b.title, "zh-Hans-CN"));
  }
  return build(rootEventId, new Set([rootEventId]));
}

export async function getEventActivityStats(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_nodes")
    .select("event_date, is_important")
    .eq("event_id", eventId)
    .order("event_date", { ascending: true });
  if (error) throw new Error("无法读取事件摘要，请稍后刷新重试。");
  const nodes = data ?? [];
  return {
    totalNodes: nodes.length,
    importantNodes: nodes.filter((node) => node.is_important).length,
    firstNodeDate: nodes[0]?.event_date ?? null,
    lastNodeDate: nodes.at(-1)?.event_date ?? null,
  };
}

export async function getGlobalTimelineNodes() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_nodes")
    .select("id, title, content, event_date, event_time, is_important, event:events!event_nodes_event_id_fkey(id, title, icon)")
    .order("event_date", { ascending: false })
    .order("event_time", { ascending: false, nullsFirst: false })
    .limit(200);
  if (error) throw new Error("无法读取全部记录，请稍后刷新重试。");
  return (data ?? []) as unknown as GlobalTimelineNode[];
}

export async function getTimelineOverview() {
  const supabase = await createClient();
  const [{ data: events, error: eventsError }, { data: nodes, error: nodesError }] = await Promise.all([
    supabase.from("events").select("id, status"),
    supabase.from("event_nodes").select("event_id, event_date, is_important"),
  ]);
  if (eventsError || nodesError) throw new Error("无法读取记录统计，请稍后刷新重试。");

  const months = new Map<string, { nodeCount: number; importantCount: number; eventIds: Set<string> }>();
  for (const node of nodes ?? []) {
    const month = node.event_date.slice(0, 7);
    const entry = months.get(month) ?? { nodeCount: 0, importantCount: 0, eventIds: new Set<string>() };
    entry.nodeCount += 1;
    entry.importantCount += node.is_important ? 1 : 0;
    entry.eventIds.add(node.event_id);
    months.set(month, entry);
  }

  return {
    totalEvents: events?.length ?? 0,
    activeEvents: (events ?? []).filter((event) => event.status === "active").length,
    totalNodes: nodes?.length ?? 0,
    importantNodes: (nodes ?? []).filter((node) => node.is_important).length,
    months: [...months.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 12)
      .map(([month, value]) => ({ month, nodeCount: value.nodeCount, importantCount: value.importantCount, eventCount: value.eventIds.size })),
  };
}

export async function getEventForEdit(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("id, title, description, status, start_date, icon, collection_id, collection:event_collections!events_collection_id_fkey(id, name, color), event_tags(tag:tags(id, name))")
    .eq("id", id)
    .single();
  if (error || !data) notFound();
  return data as unknown as EditableEvent;
}

export async function getEventDetail(id: string, newestFirst: boolean, importantOnly: boolean) {
  const supabase = await createClient();
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, title, description, status, start_date, icon, collection_id, collection:event_collections!events_collection_id_fkey(id, name, color), event_tags(tag:tags(id, name))")
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
  const checklistByNode = new Map<string, TimelineNode["node_checklist_items"]>();
  const referencesByNode = new Map<string, TimelineNode["references"]>();
  if (typedNodes.length) {
    const { data: checklistItems } = await supabase
      .from("node_checklist_items")
      .select("id, node_id, content, is_completed, position")
      .in("node_id", typedNodes.map((node) => node.id))
      .order("position");
    for (const item of checklistItems ?? []) {
      const list = checklistByNode.get(item.node_id) ?? [];
      list.push({ id: item.id, content: item.content, is_completed: item.is_completed, position: item.position });
      checklistByNode.set(item.node_id, list);
    }
  }
  if (typedNodes.length) {
    const { data: references } = await supabase
      .from("event_references")
      .select("id, source_node_id, target_event_id, target_node_id, note")
      .in("source_node_id", typedNodes.map((node) => node.id))
      .not("target_node_id", "is", null);
    const targetNodeIds = [...new Set((references ?? []).flatMap((reference) => reference.target_node_id ? [reference.target_node_id] : []))];
    const { data: targetNodes } = targetNodeIds.length
      ? await supabase.from("event_nodes").select("id, title").in("id", targetNodeIds)
      : { data: [] as { id: string; title: string }[] };
    const titles = new Map((targetNodes ?? []).map((node) => [node.id, node.title]));
    for (const reference of references ?? []) {
      if (!reference.source_node_id || !reference.target_node_id) continue;
      const title = titles.get(reference.target_node_id);
      if (!title) continue;
      const list = referencesByNode.get(reference.source_node_id) ?? [];
      list.push({ id: reference.id, target_event_id: reference.target_event_id, target_node_id: reference.target_node_id, target_title: title, note: reference.note });
      referencesByNode.set(reference.source_node_id, list);
    }
  }
  const paths = typedNodes.flatMap((node) => node.attachments.map((attachment) => attachment.storage_path));
  const { data: signedUrls } = paths.length
    ? await supabase.storage.from("timeline-files").createSignedUrls(paths, 60 * 60)
    : { data: [] };
  const urls = new Map((signedUrls ?? []).map((file) => [file.path, file.signedUrl]));

  return {
    event: event as unknown as EventDetail,
    nodes: typedNodes.map((node) => ({
      ...node,
      node_checklist_items: checklistByNode.get(node.id) ?? [],
      references: referencesByNode.get(node.id) ?? [],
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
  const { data: checklistItems } = await supabase
    .from("node_checklist_items")
    .select("id, content, is_completed, position")
    .eq("node_id", nodeId)
    .order("position");
  const { data: references } = await supabase
    .from("event_references")
    .select("id, target_event_id, target_node_id, note")
    .eq("source_node_id", nodeId)
    .not("target_node_id", "is", null);
  const targetNodeIds = (references ?? []).flatMap((reference) => reference.target_node_id ? [reference.target_node_id] : []);
  const { data: targetNodes } = targetNodeIds.length
    ? await supabase.from("event_nodes").select("id, title").in("id", targetNodeIds)
    : { data: [] as { id: string; title: string }[] };
  const titles = new Map((targetNodes ?? []).map((target) => [target.id, target.title]));
  const nodeReferences = (references ?? []).flatMap((reference) => {
    if (!reference.target_node_id) return [];
    const title = titles.get(reference.target_node_id);
    return title ? [{ id: reference.id, target_event_id: reference.target_event_id, target_node_id: reference.target_node_id, target_title: title, note: reference.note }] : [];
  });
  return { ...data, node_checklist_items: checklistItems ?? [], references: nodeReferences } as unknown as EditableNode;
}
