"use client";

import Link from "next/link";
import { startTransition, useActionState, useState, type FormEvent } from "react";
import { OfflineRecordNotice } from "@/components/offline/offline-record-notice";
import { queueNodeFromFormData } from "@/lib/offline/node-queue";
import { createClient } from "@/lib/supabase/client";
import { deleteAttachment, createNode, updateNode } from "@/lib/timeline/actions";
import { ALLOWED_FILE_TYPES, MAX_ATTACHMENTS, MAX_FILE_SIZE, type NodeActionState } from "@/lib/timeline/schema";
import type { EditableNode, NodeReferenceTarget } from "@/lib/timeline/types";
import { PixelIcon } from "@/components/ui/pixel";

type NodeFormProps = { eventId: string; node?: EditableNode; referenceTargets?: NodeReferenceTarget[] };
type ChecklistDraft = { content: string; isCompleted: boolean };
const initialState: NodeActionState = {};

function currentLocalMoment() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return { date: local.toISOString().slice(0, 10), time: local.toISOString().slice(11, 16) };
}

function ExistingAttachments({ attachments, eventId, nodeId }: { attachments: EditableNode["attachments"]; eventId: string; nodeId: string }) {
  if (!attachments.length) return null;
  return <div className="mt-3 space-y-2"><p className="text-sm text-[var(--soil)]">已上传的附件</p>{attachments.map((attachment) => <div className="flex items-center justify-between gap-3 border-2 border-[var(--line)] bg-[var(--paper-deep)] px-3 py-2 text-sm" key={attachment.id}><span className="min-w-0 truncate text-[var(--soil)]">{attachment.file_name}</span><form action={deleteAttachment}><input name="eventId" type="hidden" value={eventId} /><input name="nodeId" type="hidden" value={nodeId} /><input name="attachmentId" type="hidden" value={attachment.id} /><button className="shrink-0 font-bold text-[var(--brick)] underline underline-offset-2" type="submit">移除</button></form></div>)}</div>;
}

export function NodeForm({ eventId, node, referenceTargets = [] }: NodeFormProps) {
  const action = node ? updateNode : createNode;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [uploadError, setUploadError] = useState<string>();
  const [isUploading, setIsUploading] = useState(false);
  const [moment, setMoment] = useState(currentLocalMoment);
  const [checklistItems, setChecklistItems] = useState<ChecklistDraft[]>(() => node?.node_checklist_items.map((item) => ({ content: item.content, isCompleted: item.is_completed })) ?? []);
  const existingReference = node?.references[0];
  const [referenceEventId, setReferenceEventId] = useState(existingReference?.target_event_id ?? "");
  const [referenceNodeId, setReferenceNodeId] = useState(existingReference?.target_node_id ?? "");
  const [offlineMessage, setOfflineMessage] = useState<string>();
  const tags = node?.node_tags.flatMap(({ tag }) => (tag ? [tag.name] : [])).join(",") ?? "";

  function updateChecklist(index: number, next: Partial<ChecklistDraft>) {
    setChecklistItems((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, ...next } : item));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploadError(undefined);
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("checklistItems", JSON.stringify(checklistItems.map((item) => ({ ...item, content: item.content.trim() })).filter((item) => item.content)));
    const input = form.elements.namedItem("attachments") as HTMLInputElement | null;
    const files = Array.from(input?.files ?? []);
    if (files.length > MAX_ATTACHMENTS) { setUploadError(`一次最多上传 ${MAX_ATTACHMENTS} 个附件。`); return; }
    if (files.some((file) => file.size > MAX_FILE_SIZE || !ALLOWED_FILE_TYPES.includes(file.type as (typeof ALLOWED_FILE_TYPES)[number]))) {
      setUploadError("附件仅支持图片、PDF、TXT、DOCX、XLSX，且每个文件不能超过 5 MB。");
      return;
    }
    if (!navigator.onLine) {
      if (node) { setUploadError("离线状态暂只支持新建记录；编辑已有节点请恢复网络后再保存。"); return; }
      const queued = await queueNodeFromFormData(formData, checklistItems.map((item) => ({ ...item, content: item.content.trim() })).filter((item) => item.content), files);
      if ("error" in queued) { setUploadError(queued.error); return; }
      form.reset();
      setChecklistItems([]);
      setMoment(currentLocalMoment());
      setOfflineMessage(`已离线保存到这台设备${files.length ? "（含附件）" : ""}；恢复网络后会自动同步到这条事线。`);
      return;
    }

    setIsUploading(true);
    const uploadedPaths: string[] = [];
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("登录状态已失效，请重新登录后再上传。");
      const uploads = [];
      for (const file of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const filePath = `${user.id}/${eventId}/${crypto.randomUUID()}-${safeName}`;
        const { error } = await supabase.storage.from("timeline-files").upload(filePath, file, { contentType: file.type, upsert: false });
        if (error) throw new Error(`“${file.name}”上传失败，请重试。`);
        uploadedPaths.push(filePath);
        uploads.push({ fileName: file.name, filePath, fileType: file.type, fileSize: file.size });
      }
      formData.delete("attachments");
      formData.set("uploads", JSON.stringify(uploads));
      startTransition(() => formAction(formData));
    } catch (error) {
      if (uploadedPaths.length) {
        try { const supabase = createClient(); await supabase.storage.from("timeline-files").remove(uploadedPaths); } catch { /* storage stays private */ }
      }
      setUploadError(error instanceof Error ? error.message : "附件上传失败，请稍后重试。");
    } finally { setIsUploading(false); }
  }

  return (
    <form className="pixel-paper mt-7 space-y-6 p-4 sm:p-6" noValidate onSubmit={handleSubmit}>
      <input name="eventId" type="hidden" value={eventId} />{node && <input name="id" type="hidden" value={node.id} />}<input name="uploads" type="hidden" value="[]" /><input name="checklistItems" type="hidden" value="[]" />
      <div><label className="pixel-label" htmlFor="title">节点标题</label><input className="pixel-input text-base" defaultValue={node?.title} id="title" maxLength={160} name="title" required />{state.fieldErrors?.title && <p className="mt-2 text-sm text-[var(--brick)]">{state.fieldErrors.title}</p>}</div>
      <div className="grid gap-5 sm:grid-cols-2"><div><label className="pixel-label" htmlFor="eventDate">发生日期</label><input className="pixel-input text-base" id="eventDate" name="eventDate" onChange={(event) => setMoment((value) => ({ ...value, date: event.target.value }))} type="date" value={node?.event_date ?? moment.date} required />{state.fieldErrors?.eventDate && <p className="mt-2 text-sm text-[var(--brick)]">{state.fieldErrors.eventDate}</p>}</div><div><label className="pixel-label" htmlFor="eventTime">发生时间 <span className="font-normal text-[var(--soil)]/70">（选填）</span></label><input className="pixel-input text-base" id="eventTime" name="eventTime" onChange={(event) => setMoment((value) => ({ ...value, time: event.target.value }))} type="time" value={node?.event_time?.slice(0, 5) ?? moment.time} />{state.fieldErrors?.eventTime && <p className="mt-2 text-sm text-[var(--brick)]">{state.fieldErrors.eventTime}</p>}</div></div>
      <div><label className="pixel-label" htmlFor="content">详细内容 <span className="font-normal text-[var(--soil)]/70">（选填）</span></label><textarea className="pixel-textarea text-base" defaultValue={node?.content ?? ""} id="content" maxLength={10000} name="content" />{state.fieldErrors?.content && <p className="mt-2 text-sm text-[var(--brick)]">{state.fieldErrors.content}</p>}</div>
      <div><label className="pixel-label" htmlFor="linkUrl">网页链接 <span className="font-normal text-[var(--soil)]/70">（选填）</span></label><input className="pixel-input text-base" defaultValue={node?.link_url ?? ""} id="linkUrl" name="linkUrl" placeholder="https://" type="url" />{state.fieldErrors?.linkUrl && <p className="mt-2 text-sm text-[var(--brick)]">{state.fieldErrors.linkUrl}</p>}</div>
      <div><label className="pixel-label" htmlFor="tags">标签 <span className="font-normal text-[var(--soil)]/70">（选填，用逗号分隔）</span></label><input className="pixel-input text-base" defaultValue={tags} id="tags" maxLength={400} name="tags" placeholder="例如：进展，重要" />{state.fieldErrors?.tags && <p className="mt-2 text-sm text-[var(--brick)]">{state.fieldErrors.tags}</p>}</div>
      {referenceTargets.length > 0 && <section className="border-2 border-dashed border-[var(--line)] bg-[var(--paper-deep)] p-4"><h2 className="pixel-label mb-0">关联另一条记录 <span className="font-normal text-[var(--soil)]/70">（选填）</span></h2><p className="mt-1 text-xs leading-5 text-[var(--soil)]">让这个节点指向另一事线中的具体节点。</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><select className="pixel-select text-sm" name="referenceTargetEventId" onChange={(event) => { setReferenceEventId(event.target.value); setReferenceNodeId(""); }} value={referenceEventId}><option value="">不关联</option>{referenceTargets.map((target) => <option key={target.id} value={target.id}>{target.title}</option>)}</select><select className="pixel-select text-sm" disabled={!referenceEventId} name="referenceTargetNodeId" onChange={(event) => setReferenceNodeId(event.target.value)} value={referenceNodeId}><option value="">选择具体节点</option>{referenceTargets.find((target) => target.id === referenceEventId)?.nodes.filter((targetNode) => targetNode.id !== node?.id).map((targetNode) => <option key={targetNode.id} value={targetNode.id}>{targetNode.event_date} · {targetNode.title}</option>)}</select></div><input className="pixel-input mt-3 text-sm" defaultValue={existingReference?.note ?? ""} maxLength={300} name="referenceNote" placeholder="关联说明（选填）" />{state.fieldErrors?.referenceTargetNodeId && <p className="mt-2 text-sm text-[var(--brick)]">{state.fieldErrors.referenceTargetNodeId}</p>}</section>}
      <section className="border-2 border-dashed border-[var(--line)] bg-[var(--paper-deep)] p-4"><div className="flex items-center justify-between gap-3"><div><h2 className="pixel-label mb-0">节点清单 <span className="font-normal text-[var(--soil)]/70">（选填）</span></h2><p className="mt-1 text-xs leading-5 text-[var(--soil)]">记录这个节点需要跟进的小项，最多 12 条。</p></div><button className="pixel-button pixel-button-secondary min-h-9 px-3 text-sm" disabled={checklistItems.length >= 12} onClick={() => setChecklistItems((items) => [...items, { content: "", isCompleted: false }])} type="button"><PixelIcon className="size-4" name="plus" />添加</button></div>{checklistItems.length > 0 && <div className="mt-4 space-y-2">{checklistItems.map((item, index) => <div className="flex items-center gap-2" key={index}><input aria-label={`完成第 ${index + 1} 个清单项`} checked={item.isCompleted} className="size-5 accent-[var(--forest)]" onChange={(event) => updateChecklist(index, { isCompleted: event.target.checked })} type="checkbox" /><input aria-label={`第 ${index + 1} 个清单项`} className="pixel-input min-w-0 flex-1 py-2 text-sm" maxLength={240} onChange={(event) => updateChecklist(index, { content: event.target.value })} placeholder="写下一项要点" value={item.content} /><button aria-label={`删除第 ${index + 1} 个清单项`} className="min-h-10 px-2 font-bold text-[var(--brick)]" onClick={() => setChecklistItems((items) => items.filter((_, itemIndex) => itemIndex !== index))} type="button">×</button></div>)}</div>}{state.fieldErrors?.checklistItems && <p className="mt-2 text-sm text-[var(--brick)]">{state.fieldErrors.checklistItems}</p>}</section>
      <label className="flex min-h-12 items-center gap-3 border-2 border-[var(--line)] bg-[var(--paper-deep)] px-4 text-base text-[var(--soil)]"><input className="size-5 accent-[var(--forest)]" defaultChecked={node?.is_important} name="isImportant" type="checkbox" />标记为重要节点</label>
      <div><label className="pixel-label" htmlFor="attachments">图片或文件 <span className="font-normal text-[var(--soil)]/70">（选填，最多 6 个）</span></label><input accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain,.docx,.xlsx" className="block w-full text-sm text-[var(--soil)] file:mr-3 file:border-2 file:border-[var(--line)] file:bg-[var(--paper-deep)] file:px-3 file:py-2 file:text-sm file:font-bold file:text-[var(--forest)]" id="attachments" multiple name="attachments" type="file" /><p className="mt-2 text-xs leading-5 text-[var(--soil)]">支持图片、PDF、TXT、DOCX、XLSX；每个文件最大 5 MB。</p>{node && <ExistingAttachments attachments={node.attachments} eventId={eventId} nodeId={node.id} />}</div>
      <OfflineRecordNotice message={offlineMessage} />
      {(state.error || uploadError) && <p className="border-2 border-[var(--brick)] bg-[#fff1e9] px-3 py-2 text-sm leading-6 text-[var(--brick)]">{uploadError ?? state.error}</p>}
      <div className="flex gap-3 pt-2"><Link className="pixel-button pixel-button-secondary flex-1 text-base" href={`/events/${eventId}`}>取消</Link><button className="pixel-button pixel-button-primary flex-1 text-base disabled:cursor-not-allowed disabled:opacity-60" disabled={isUploading || isPending} type="submit">{isUploading ? "正在上传…" : isPending ? "正在保存…" : "保存节点"}</button></div>
    </form>
  );
}
