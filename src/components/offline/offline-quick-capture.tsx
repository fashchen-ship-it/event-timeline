"use client";

import { useEffect, useState, type FormEvent } from "react";
import { OfflineRecordNotice } from "@/components/offline/offline-record-notice";
import { queueNodeFromFormData } from "@/lib/offline/node-queue";
import { ALLOWED_FILE_TYPES, MAX_ATTACHMENTS, MAX_FILE_SIZE } from "@/lib/timeline/schema";
import { MAX_SOURCE_IMAGE_SIZE, optimizeImageFiles } from "@/lib/uploads/image-optimizer";
import type { EventSummary } from "@/lib/events/types";
import { PixelIcon } from "@/components/ui/pixel";

function localMoment() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return { date: local.toISOString().slice(0, 10), time: local.toISOString().slice(11, 16) };
}

/** Lives in the events bundle so a previously opened app can still record after a full offline reopen. */
export function OfflineQuickCapture({ events }: { events: Pick<EventSummary, "id" | "title">[] }) {
  const [isOffline, setIsOffline] = useState(false);
  const [moment, setMoment] = useState(localMoment);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    const refresh = () => setIsOffline(!navigator.onLine);
    refresh();
    window.addEventListener("online", refresh);
    window.addEventListener("offline", refresh);
    return () => { window.removeEventListener("online", refresh); window.removeEventListener("offline", refresh); };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const input = form.elements.namedItem("attachments") as HTMLInputElement | null;
    const sourceFiles = Array.from(input?.files ?? []);
    if (sourceFiles.length > MAX_ATTACHMENTS) { setError(`一次最多保存 ${MAX_ATTACHMENTS} 个附件。`); return; }
    if (sourceFiles.some((file) => !ALLOWED_FILE_TYPES.includes(file.type as (typeof ALLOWED_FILE_TYPES)[number]) || (file.type.startsWith("image/") ? file.size > MAX_SOURCE_IMAGE_SIZE : file.size > MAX_FILE_SIZE))) {
      setError("图片原件最大 15 MB，其他附件最大 5 MB；仅支持图片、PDF、TXT、DOCX、XLSX。");
      return;
    }
    const files = await optimizeImageFiles(sourceFiles);
    if (files.some((file) => file.size > MAX_FILE_SIZE)) {
      setError("附件仅支持图片、PDF、TXT、DOCX、XLSX，且每个文件不能超过 5 MB。");
      return;
    }
    const result = await queueNodeFromFormData(new FormData(form), [], files);
    if ("error" in result) { setError(result.error); return; }
    form.reset();
    setMoment(localMoment());
    setMessage(`已离线保存${files.length ? "（含附件）" : ""}，恢复网络并重新打开应用后会自动同步。`);
  }

  if (!isOffline) return null;
  return (
    <section className="pixel-paper mt-6 p-4 sm:p-5">
      <div className="flex items-center gap-2"><PixelIcon className="size-5 text-[var(--wheat)]" name="hourglass" /><p className="pixel-eyebrow">OFFLINE CAPTURE</p></div>
      <h2 className="pixel-title mt-2 text-xl">离线快记</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--soil)]">先把此刻留下，恢复网络后自动写回原来的事线。</p>
      {events.length ? <form className="mt-5 space-y-4" noValidate onSubmit={submit}>
        <input name="uploads" type="hidden" value="[]" /><input name="checklistItems" type="hidden" value="[]" /><input name="linkUrl" type="hidden" value="" /><input name="tags" type="hidden" value="" /><input name="referenceTargetEventId" type="hidden" value="" /><input name="referenceTargetNodeId" type="hidden" value="" /><input name="referenceNote" type="hidden" value="" />
        <div><label className="pixel-label" htmlFor="offline-event">记入哪条事线</label><select className="pixel-select text-base" id="offline-event" name="eventId" required><option value="">选择一条事线</option>{events.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></div>
        <div><label className="pixel-label" htmlFor="offline-title">发生了什么</label><input className="pixel-input text-base" id="offline-title" maxLength={160} name="title" placeholder="例如：完成了第一步" required /></div>
        <div className="grid grid-cols-2 gap-3"><div><label className="pixel-label" htmlFor="offline-date">日期</label><input className="pixel-input text-base" id="offline-date" name="eventDate" onChange={(item) => setMoment((value) => ({ ...value, date: item.target.value }))} type="date" value={moment.date} required /></div><div><label className="pixel-label" htmlFor="offline-time">时间</label><input className="pixel-input text-base" id="offline-time" name="eventTime" onChange={(item) => setMoment((value) => ({ ...value, time: item.target.value }))} type="time" value={moment.time} /></div></div>
        <div><label className="pixel-label" htmlFor="offline-content">补充几句</label><textarea className="pixel-textarea min-h-24 text-base" id="offline-content" maxLength={10000} name="content" placeholder="写下想留下的内容" /></div>
        <div><label className="pixel-label" htmlFor="offline-attachments">图片或文件（选填）</label><input accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain,.docx,.xlsx" className="block w-full text-sm text-[var(--soil)]" id="offline-attachments" multiple name="attachments" type="file" /><p className="mt-2 text-xs leading-5 text-[var(--soil)]">普通照片会先压缩并缩至最长边 1600px；GIF、PDF 与文档保持原文件。</p></div>
        <label className="flex min-h-11 items-center gap-3 border-2 border-[var(--line)] bg-[var(--paper-deep)] px-3 text-sm font-bold text-[var(--soil)]"><input className="size-5" name="isImportant" type="checkbox" />标记为重要节点</label>
        <OfflineRecordNotice message={message} />
        {error && <p className="border-2 border-[var(--brick)] bg-[#fff1e9] px-3 py-2 text-sm leading-6 text-[var(--brick)]">{error}</p>}
        <button className="pixel-button pixel-button-primary w-full text-base" type="submit"><PixelIcon className="size-4" name="plus" />离线保存</button>
      </form> : <p className="mt-4 text-sm leading-6 text-[var(--soil)]">这台设备还没有缓存事线列表。请先联网打开一次首页。</p>}
    </section>
  );
}
