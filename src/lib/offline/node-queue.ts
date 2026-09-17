import { createClient } from "@/lib/supabase/client";
import { nodeFormSchema, parseTagNames } from "@/lib/timeline/schema";

const DATABASE_NAME = "shixian-offline";
const STORE_NAME = "node-queue";
const EVENT_NAME = "shixian-offline-queue-change";

type ChecklistItem = { content: string; isCompleted: boolean };
type OfflineAttachment = { id: string; fileName: string; fileType: string; fileSize: number; file: File };

export type OfflineNodeDraft = {
  id: string;
  userId: string;
  createdAt: string;
  eventId: string;
  title: string;
  eventDate: string;
  eventTime?: string;
  content?: string;
  linkUrl?: string;
  tags: string[];
  isImportant: boolean;
  checklistItems: ChecklistItem[];
  referenceTargetEventId?: string;
  referenceTargetNodeId?: string;
  referenceNote?: string;
  attachments: OfflineAttachment[];
  syncedNodeId?: string;
};

function database() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onerror = () => reject(request.error ?? new Error("无法打开本地离线记录。"));
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
  });
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>) {
  const db = await database();
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const request = run(transaction.objectStore(STORE_NAME));
    request.onerror = () => reject(request.error ?? new Error("本地离线记录操作失败。"));
    request.onsuccess = () => resolve(request.result);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => db.close();
  });
}

function notifyQueueChange() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT_NAME));
}

export async function getOfflineNodeDrafts() {
  if (typeof window === "undefined" || !("indexedDB" in window)) return [];
  const drafts = await withStore<OfflineNodeDraft[]>("readonly", (store) => store.getAll());
  return drafts.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getOfflineNodeDraftCount() {
  return (await getOfflineNodeDrafts()).length;
}

export function subscribeToOfflineNodeQueue(listener: () => void) {
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}

async function saveDraft(draft: OfflineNodeDraft) {
  await withStore<IDBValidKey>("readwrite", (store) => store.put(draft));
  notifyQueueChange();
}

async function removeDraft(id: string) {
  await withStore<undefined>("readwrite", (store) => store.delete(id));
  notifyQueueChange();
}

export async function queueNodeFromFormData(formData: FormData, checklistItems: ChecklistItem[] = [], files: File[] = []) {
  let uploads: unknown = [];
  try { uploads = JSON.parse(String(formData.get("uploads") ?? "[]")); } catch { uploads = null; }
  const parsed = nodeFormSchema.safeParse({
    eventId: formData.get("eventId"), title: formData.get("title"), eventDate: formData.get("eventDate"),
    eventTime: formData.get("eventTime") || undefined, content: formData.get("content") || undefined,
    linkUrl: formData.get("linkUrl") || undefined, tags: formData.get("tags") || undefined,
    isImportant: formData.get("isImportant") === "on", checklistItems,
    referenceTargetEventId: formData.get("referenceTargetEventId") || undefined,
    referenceTargetNodeId: formData.get("referenceTargetNodeId") || undefined,
    referenceNote: formData.get("referenceNote") || undefined, uploads,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "请检查填写内容。" };

  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return { error: "登录状态已失效，请联网后重新登录。" };
  const draft: OfflineNodeDraft = {
    id: crypto.randomUUID(), userId: session.user.id, createdAt: new Date().toISOString(), eventId: parsed.data.eventId,
    title: parsed.data.title, eventDate: parsed.data.eventDate, eventTime: parsed.data.eventTime,
    content: parsed.data.content, linkUrl: parsed.data.linkUrl, tags: parseTagNames(parsed.data.tags),
    isImportant: parsed.data.isImportant, checklistItems: parsed.data.checklistItems,
    referenceTargetEventId: parsed.data.referenceTargetEventId, referenceTargetNodeId: parsed.data.referenceTargetNodeId,
    referenceNote: parsed.data.referenceNote,
    attachments: files.map((file) => ({ id: crypto.randomUUID(), fileName: file.name, fileType: file.type, fileSize: file.size, file })),
  };
  await saveDraft(draft);
  return { draft };
}

async function replaceTags(nodeId: string, userId: string, names: string[]) {
  const supabase = createClient();
  const { error: deleteError } = await supabase.from("node_tags").delete().eq("node_id", nodeId);
  if (deleteError) throw deleteError;
  if (!names.length) return;
  const { data: tags, error: tagError } = await supabase.from("tags").upsert(
    names.map((name) => ({ user_id: userId, name })), { onConflict: "user_id,name" },
  ).select("id");
  if (tagError || !tags) throw tagError ?? new Error("保存标签失败。");
  const { error } = await supabase.from("node_tags").insert(tags.map((tag) => ({ node_id: nodeId, tag_id: tag.id, user_id: userId })));
  if (error) throw error;
}

async function replaceChecklist(draft: OfflineNodeDraft, nodeId: string) {
  const supabase = createClient();
  const { error: deleteError } = await supabase.from("node_checklist_items").delete().eq("node_id", nodeId);
  if (deleteError) throw deleteError;
  if (!draft.checklistItems.length) return;
  const { error } = await supabase.from("node_checklist_items").insert(draft.checklistItems.map((item, position) => ({
    node_id: nodeId, event_id: draft.eventId, user_id: draft.userId, content: item.content, is_completed: item.isCompleted, position,
  })));
  if (error) throw error;
}

async function createReference(draft: OfflineNodeDraft, nodeId: string) {
  const supabase = createClient();
  const { error: removeError } = await supabase.from("event_references").delete().eq("source_node_id", nodeId);
  if (removeError) throw removeError;
  if (!draft.referenceTargetEventId || !draft.referenceTargetNodeId) return;
  const { error } = await supabase.from("event_references").insert({
    user_id: draft.userId, source_event_id: draft.eventId, source_node_id: nodeId,
    target_event_id: draft.referenceTargetEventId, target_node_id: draft.referenceTargetNodeId, note: draft.referenceNote || null,
  });
  if (error) throw error;
}

async function syncAttachments(draft: OfflineNodeDraft, nodeId: string) {
  const attachments = draft.attachments ?? [];
  if (!attachments.length) return;
  const supabase = createClient();
  for (const attachment of attachments) {
    const safeName = attachment.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${draft.userId}/${draft.eventId}/offline-${draft.id}-${attachment.id}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from("timeline-files").upload(storagePath, attachment.file, {
      contentType: attachment.fileType,
      upsert: true,
    });
    if (uploadError) throw uploadError;
    const { data: existing, error: lookupError } = await supabase.from("attachments").select("id").eq("storage_path", storagePath).maybeSingle();
    if (lookupError) throw lookupError;
    if (existing) continue;
    const { error: attachmentError } = await supabase.from("attachments").insert({
      node_id: nodeId, user_id: draft.userId, file_name: attachment.fileName, file_url: storagePath,
      storage_path: storagePath, file_type: attachment.fileType, file_size: attachment.fileSize,
    });
    if (attachmentError) throw attachmentError;
  }
}

async function syncDraft(draft: OfflineNodeDraft) {
  const supabase = createClient();
  let nodeId = draft.syncedNodeId;
  if (!nodeId) {
    const { data, error } = await supabase.from("event_nodes").insert({
      event_id: draft.eventId, user_id: draft.userId, title: draft.title, content: draft.content || null,
      event_date: draft.eventDate, event_time: draft.eventTime || null, is_important: draft.isImportant, link_url: draft.linkUrl || null,
    }).select("id").single();
    if (error || !data) throw error ?? new Error("创建离线节点失败。");
    nodeId = data.id;
    await saveDraft({ ...draft, syncedNodeId: nodeId });
  }
  if (!nodeId) throw new Error("离线节点缺少同步标识。");
  await replaceTags(nodeId, draft.userId, draft.tags);
  await replaceChecklist(draft, nodeId);
  await createReference(draft, nodeId);
  await syncAttachments(draft, nodeId);
  const { error: touchError } = await supabase.from("events").update({ updated_at: new Date().toISOString() }).eq("id", draft.eventId);
  if (touchError) throw touchError;
}

export async function syncOfflineNodeDrafts() {
  if (typeof navigator !== "undefined" && !navigator.onLine) return { synced: 0, pending: await getOfflineNodeDraftCount() };
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return { synced: 0, pending: await getOfflineNodeDraftCount(), error: "请重新登录后同步离线记录。" };
  let synced = 0;
  let error: string | undefined;
  for (const draft of await getOfflineNodeDrafts()) {
    if (draft.userId !== session.user.id) continue;
    try { await syncDraft(draft); await removeDraft(draft.id); synced += 1; }
    catch (reason) { error = reason instanceof Error ? reason.message : "同步失败，请稍后重试。"; break; }
  }
  return { synced, pending: await getOfflineNodeDraftCount(), error };
}
