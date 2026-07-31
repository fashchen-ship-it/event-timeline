"use client";

import Link from "next/link";
import { startTransition, useActionState, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { deleteAttachment, createNode, updateNode } from "@/lib/timeline/actions";
import { ALLOWED_FILE_TYPES, MAX_ATTACHMENTS, MAX_FILE_SIZE, type NodeActionState } from "@/lib/timeline/schema";
import type { EditableNode } from "@/lib/timeline/types";

type NodeFormProps = {
  eventId: string;
  node?: EditableNode;
};

const initialState: NodeActionState = {};

function formatBytes(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ExistingAttachments({ attachments, eventId, nodeId }: { attachments: EditableNode["attachments"]; eventId: string; nodeId: string }) {
  if (!attachments.length) return null;

  return (
    <div className="mt-3 space-y-2">
      <p className="text-sm text-stone-500">已上传的附件</p>
      {attachments.map((attachment) => (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-stone-100 px-3 py-2 text-sm" key={attachment.id}>
          <span className="min-w-0 truncate text-stone-700">{attachment.file_name}</span>
          <form action={deleteAttachment}>
            <input name="eventId" type="hidden" value={eventId} />
            <input name="nodeId" type="hidden" value={nodeId} />
            <input name="attachmentId" type="hidden" value={attachment.id} />
            <button className="shrink-0 text-rose-700 underline underline-offset-2" type="submit">移除</button>
          </form>
        </div>
      ))}
    </div>
  );
}

export function NodeForm({ eventId, node }: NodeFormProps) {
  const action = node ? updateNode : createNode;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [uploadError, setUploadError] = useState<string>();
  const [isUploading, setIsUploading] = useState(false);
  const tags = node?.node_tags.flatMap(({ tag }) => (tag ? [tag.name] : [])).join("，") ?? "";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploadError(undefined);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const input = form.elements.namedItem("attachments") as HTMLInputElement | null;
    const files = Array.from(input?.files ?? []);

    if (files.length > MAX_ATTACHMENTS) {
      setUploadError(`一次最多上传 ${MAX_ATTACHMENTS} 个附件。`);
      return;
    }
    if (files.some((file) => file.size > MAX_FILE_SIZE || !ALLOWED_FILE_TYPES.includes(file.type as (typeof ALLOWED_FILE_TYPES)[number]))) {
      setUploadError("附件仅支持图片、PDF、TXT、DOCX、XLSX，且每个文件不能超过 5 MB。");
      return;
    }

    setIsUploading(true);
    const uploadedPaths: string[] = [];
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("登录状态已失效，请重新登录后再上传。");

      const uploads = [];
      for (const file of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const filePath = `${user.id}/${eventId}/${crypto.randomUUID()}-${safeName}`;
        const { error } = await supabase.storage.from("timeline-files").upload(filePath, file, {
          contentType: file.type,
          upsert: false,
        });
        if (error) throw new Error(`“${file.name}”上传失败，请重试。`);

        uploadedPaths.push(filePath);
        uploads.push({ fileName: file.name, filePath, fileType: file.type, fileSize: file.size });
      }

      formData.delete("attachments");
      formData.set("uploads", JSON.stringify(uploads));
      startTransition(() => formAction(formData));
    } catch (error) {
      if (uploadedPaths.length) {
        try {
          const supabase = createClient();
          await supabase.storage.from("timeline-files").remove(uploadedPaths);
        } catch {
          // The server action will reject missing metadata; storage policies still keep files private.
        }
      }
      setUploadError(error instanceof Error ? error.message : "附件上传失败，请稍后重试。");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form className="mt-7 space-y-6" noValidate onSubmit={handleSubmit}>
      <input name="eventId" type="hidden" value={eventId} />
      {node && <input name="id" type="hidden" value={node.id} />}
      <input name="uploads" type="hidden" value="[]" />

      <div>
        <label className="mb-2 block text-sm font-medium text-stone-700" htmlFor="title">节点标题</label>
        <input className="h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200" defaultValue={node?.title} id="title" maxLength={160} name="title" required />
        {state.fieldErrors?.title && <p className="mt-2 text-sm text-rose-700">{state.fieldErrors.title}</p>}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700" htmlFor="eventDate">发生日期</label>
          <input className="h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200" defaultValue={node?.event_date ?? new Date().toISOString().slice(0, 10)} id="eventDate" name="eventDate" type="date" required />
          {state.fieldErrors?.eventDate && <p className="mt-2 text-sm text-rose-700">{state.fieldErrors.eventDate}</p>}
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700" htmlFor="eventTime">发生时间 <span className="font-normal text-stone-400">（选填）</span></label>
          <input className="h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200" defaultValue={node?.event_time?.slice(0, 5) ?? ""} id="eventTime" name="eventTime" type="time" />
          {state.fieldErrors?.eventTime && <p className="mt-2 text-sm text-rose-700">{state.fieldErrors.eventTime}</p>}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-stone-700" htmlFor="content">详细内容 <span className="font-normal text-stone-400">（选填）</span></label>
        <textarea className="min-h-36 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-base leading-7 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200" defaultValue={node?.content ?? ""} id="content" maxLength={10000} name="content" />
        {state.fieldErrors?.content && <p className="mt-2 text-sm text-rose-700">{state.fieldErrors.content}</p>}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-stone-700" htmlFor="linkUrl">网页链接 <span className="font-normal text-stone-400">（选填）</span></label>
        <input className="h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200" defaultValue={node?.link_url ?? ""} id="linkUrl" name="linkUrl" placeholder="https://" type="url" />
        {state.fieldErrors?.linkUrl && <p className="mt-2 text-sm text-rose-700">{state.fieldErrors.linkUrl}</p>}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-stone-700" htmlFor="tags">标签 <span className="font-normal text-stone-400">（选填，用逗号分隔）</span></label>
        <input className="h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200" defaultValue={tags} id="tags" maxLength={400} name="tags" placeholder="例如：进展，重要" />
        {state.fieldErrors?.tags && <p className="mt-2 text-sm text-rose-700">{state.fieldErrors.tags}</p>}
      </div>

      <label className="flex min-h-12 items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 text-base text-stone-700">
        <input className="size-5 accent-stone-800" defaultChecked={node?.is_important} name="isImportant" type="checkbox" />
        标记为重要节点
      </label>

      <div>
        <label className="mb-2 block text-sm font-medium text-stone-700" htmlFor="attachments">图片或文件 <span className="font-normal text-stone-400">（选填，最多 6 个）</span></label>
        <input accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain,.docx,.xlsx" className="block w-full text-sm text-stone-600 file:mr-3 file:rounded-lg file:border-0 file:bg-stone-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-stone-700" id="attachments" multiple name="attachments" type="file" />
        <p className="mt-2 text-xs leading-5 text-stone-500">支持图片、PDF、TXT、DOCX、XLSX；每个文件最大 5 MB。</p>
        {node && <ExistingAttachments attachments={node.attachments} eventId={eventId} nodeId={node.id} />}
      </div>

      {(state.error || uploadError) && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm leading-6 text-rose-800">{uploadError ?? state.error}</p>}

      <div className="flex gap-3 pt-2">
        <Link className="flex h-12 flex-1 items-center justify-center rounded-xl border border-stone-300 px-4 text-base font-medium text-stone-700 transition hover:bg-stone-100" href={`/events/${eventId}`}>取消</Link>
        <button className="h-12 flex-1 rounded-xl bg-stone-800 px-4 text-base font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-400" disabled={isUploading || isPending} type="submit">
          {isUploading ? "正在上传…" : isPending ? "正在保存…" : "保存节点"}
        </button>
      </div>
    </form>
  );
}
