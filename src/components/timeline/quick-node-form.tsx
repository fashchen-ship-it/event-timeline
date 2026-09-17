"use client";

import Link from "next/link";
import { startTransition, useActionState, useState, type FormEvent } from "react";
import { OfflineRecordNotice } from "@/components/offline/offline-record-notice";
import { queueNodeFromFormData } from "@/lib/offline/node-queue";
import { createClient } from "@/lib/supabase/client";
import { createNode } from "@/lib/timeline/actions";
import { ALLOWED_FILE_TYPES, MAX_ATTACHMENTS, MAX_FILE_SIZE, type NodeActionState } from "@/lib/timeline/schema";
import type { EventSummary } from "@/lib/events/types";
import { PixelIcon } from "@/components/ui/pixel";

const initialState: NodeActionState = {};

function currentLocalMoment() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return { date: local.toISOString().slice(0, 10), time: local.toISOString().slice(11, 16) };
}

export function QuickNodeForm({ events, defaultEventId }: { events: EventSummary[]; defaultEventId?: string }) {
  const [state, formAction, isPending] = useActionState(createNode, initialState);
  const [uploadError, setUploadError] = useState<string>();
  const [isUploading, setIsUploading] = useState(false);
  const [moment, setMoment] = useState(currentLocalMoment);
  const [offlineMessage, setOfflineMessage] = useState<string>();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploadError(undefined);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const eventId = String(formData.get("eventId") ?? "");
    const input = form.elements.namedItem("attachments") as HTMLInputElement | null;
    const files = Array.from(input?.files ?? []);
    if (files.length > MAX_ATTACHMENTS) { setUploadError(`一次最多上传 ${MAX_ATTACHMENTS} 个附件。`); return; }
    if (files.some((file) => file.size > MAX_FILE_SIZE || !ALLOWED_FILE_TYPES.includes(file.type as (typeof ALLOWED_FILE_TYPES)[number]))) {
      setUploadError("附件仅支持图片、PDF、TXT、DOCX、XLSX，且每个文件不能超过 5 MB。");
      return;
    }
    if (!navigator.onLine) {
      const queued = await queueNodeFromFormData(formData, [], files);
      if ("error" in queued) { setUploadError(queued.error); return; }
      form.reset();
      setMoment(currentLocalMoment());
      setOfflineMessage(`已离线保存到这台设备${files.length ? "（含附件）" : ""}；恢复网络后会自动同步到所选事线。`);
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
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form className="pixel-paper mt-7 space-y-5 p-4 sm:p-6" noValidate onSubmit={handleSubmit}>
      <input name="uploads" type="hidden" value="[]" /><input name="checklistItems" type="hidden" value="[]" />
      <div><label className="pixel-label" htmlFor="quick-event">记入哪条事线</label><select className="pixel-select text-base" defaultValue={defaultEventId ?? ""} id="quick-event" name="eventId" required><option disabled value="">选择一条事线</option>{events.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}</select></div>
      <div><label className="pixel-label" htmlFor="quick-title">发生了什么</label><input autoFocus className="pixel-input text-base" id="quick-title" maxLength={160} name="title" placeholder="例如：收到第一版结果" required />{state.fieldErrors?.title && <p className="mt-2 text-sm text-[var(--brick)]">{state.fieldErrors.title}</p>}</div>
      <div className="grid gap-5 sm:grid-cols-2"><div><label className="pixel-label" htmlFor="quick-date">发生日期</label><input className="pixel-input text-base" id="quick-date" name="eventDate" onChange={(event) => setMoment((value) => ({ ...value, date: event.target.value }))} type="date" value={moment.date} required />{state.fieldErrors?.eventDate && <p className="mt-2 text-sm text-[var(--brick)]">{state.fieldErrors.eventDate}</p>}</div><div><label className="pixel-label" htmlFor="quick-time">发生时间 <span className="font-normal text-[var(--soil)]/70">（选填）</span></label><input className="pixel-input text-base" id="quick-time" name="eventTime" onChange={(event) => setMoment((value) => ({ ...value, time: event.target.value }))} type="time" value={moment.time} /></div></div>
      <div><label className="pixel-label" htmlFor="quick-content">补充几句 <span className="font-normal text-[var(--soil)]/70">（选填）</span></label><textarea className="pixel-textarea min-h-28 text-base" id="quick-content" maxLength={10000} name="content" placeholder="把此刻想记住的内容写下来" /></div>
      <div><label className="pixel-label" htmlFor="quick-attachments">图片或文件 <span className="font-normal text-[var(--soil)]/70">（选填，最多 6 个）</span></label><input accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain,.docx,.xlsx" className="block w-full text-sm text-[var(--soil)] file:mr-3 file:border-2 file:border-[var(--line)] file:bg-[var(--paper-deep)] file:px-3 file:py-2 file:text-sm file:font-bold file:text-[var(--forest)]" id="quick-attachments" multiple name="attachments" type="file" /><p className="mt-2 text-xs leading-5 text-[var(--soil)]">支持图片、PDF、TXT、DOCX、XLSX；每个文件最大 5 MB。</p></div>
      <input name="linkUrl" type="hidden" value="" /><input name="tags" type="hidden" value="" /><input name="referenceTargetEventId" type="hidden" value="" /><input name="referenceTargetNodeId" type="hidden" value="" /><input name="referenceNote" type="hidden" value="" />
      <label className="flex min-h-12 items-center gap-3 border-2 border-[var(--line)] bg-[var(--paper-deep)] px-4 text-base text-[var(--soil)]"><input className="size-5 accent-[var(--forest)]" name="isImportant" type="checkbox" />标记为重要节点</label>
      <OfflineRecordNotice message={offlineMessage} />
      {(state.error || uploadError) && <p className="border-2 border-[var(--brick)] bg-[#fff1e9] px-3 py-2 text-sm leading-6 text-[var(--brick)]">{uploadError ?? state.error}</p>}
      <div className="flex gap-3 pt-2"><Link className="pixel-button pixel-button-secondary flex-1 text-base" href="/events">取消</Link><button className="pixel-button pixel-button-primary flex-1 text-base disabled:opacity-60" disabled={isUploading || isPending} type="submit"><PixelIcon className="size-4" name="plus" />{isUploading ? "正在上传…" : isPending ? "正在保存…" : "记下这一刻"}</button></div>
    </form>
  );
}
