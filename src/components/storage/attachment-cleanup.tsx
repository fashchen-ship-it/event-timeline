"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { bulkDeleteAttachments, type AttachmentCleanupActionState } from "@/lib/timeline/actions";
import { PixelIcon } from "@/components/ui/pixel";

type StorageFile = {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  nodeTitle: string;
  eventTitle: string | null;
};

const initialState: AttachmentCleanupActionState = {};

function formatBytes(value: number) {
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

export function AttachmentCleanup({ files }: { files: StorageFile[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [state, formAction, isPending] = useActionState(bulkDeleteAttachments, initialState);
  const selectedSet = useMemo(() => new Set(selected.filter((id) => files.some((file) => file.id === id))), [files, selected]);
  const selectedCount = selectedSet.size;
  const selectedBytes = files.filter((file) => selectedSet.has(file.id)).reduce((total, file) => total + Number(file.file_size || 0), 0);

  useEffect(() => {
    if (!state.success) return;
    router.refresh();
  }, [router, state.success]);

  function toggle(id: string) {
    setSelected((ids) => ids.includes(id) ? ids.filter((item) => item !== id) : [...selectedSet, id]);
  }

  return <form action={formAction} className="mt-4 space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm leading-6 text-[var(--soil)]">勾选后可直接移除云端原件；记录文本和节点不会删除。</p><button className="pixel-button pixel-button-danger min-h-10 px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50" disabled={!selectedCount || isPending} onClick={(event) => { if (!window.confirm(`永久删除已选 ${selectedCount} 个附件（约 ${formatBytes(selectedBytes)}）？节点和文字记录会保留。`)) event.preventDefault(); }} type="submit"><PixelIcon className="size-4" name="archive" />{isPending ? "正在清理…" : `删除已选 ${selectedCount ? `(${selectedCount})` : ""}`}</button></div>
    {state.error && <p className="pixel-alert" role="alert">{state.error}</p>}
    {state.success && <p className="border-2 border-[var(--sage)] bg-[#e8f0df] px-3 py-2 text-sm leading-6 text-[var(--forest)]" role="status">{state.success}</p>}
    <ol className="space-y-3">{files.map((file) => <li className={`pixel-card flex items-center gap-3 p-4 ${selectedSet.has(file.id) ? "border-[var(--forest)] bg-[#f2f7e9]" : ""}`} key={file.id}><input aria-label={`选择 ${file.file_name}`} checked={selectedSet.has(file.id)} className="size-5 shrink-0 accent-[var(--forest)]" name="attachmentIds" onChange={() => toggle(file.id)} type="checkbox" value={file.id} /><div className="min-w-0 flex-1"><p className="truncate font-bold text-[var(--ink)]">{file.file_name}</p><p className="mt-1 truncate text-xs text-[var(--soil)]">{file.eventTitle ? `${file.eventTitle} · ` : ""}{file.nodeTitle} · {file.file_type || "文件"}</p></div><strong className="shrink-0 text-sm text-[var(--forest)]">{formatBytes(Number(file.file_size || 0))}</strong></li>)}</ol>
  </form>;
}
