"use client";

import { ChangeEvent, useState } from "react";
import { readZip } from "@/lib/backup/zip";
import { PixelIcon } from "@/components/ui/pixel";

type BackupPreview = {
  collections: number;
  events: number;
  nodes: number;
  tags: number;
  references: number;
  checklistItems: number;
  attachments: number;
};

type ImportResult = {
  imported: Omit<BackupPreview, "attachments">;
  restoredAttachments: number;
  skippedAttachments: number;
  isFullBackup: boolean;
  skippedChecklistItems?: number;
};

type PreviewState = BackupPreview & { isFullBackup: boolean };

function countList(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}

function readPreview(value: unknown): BackupPreview {
  if (!value || typeof value !== "object") throw new Error("这个文件不是可用的 JSON 备份。");
  const backup = value as Record<string, unknown>;
  if (backup.format !== "event-timeline-backup" || backup.version !== 1) {
    throw new Error("请选择从事线下载的 JSON 备份（版本 1）。");
  }
  if (!Array.isArray(backup.events) || !Array.isArray(backup.nodes)) {
    throw new Error("备份缺少事件或节点数据，无法导入。");
  }
  return {
    collections: countList(backup.collections),
    events: countList(backup.events),
    nodes: countList(backup.nodes),
    tags: countList(backup.tags),
    references: countList(backup.event_references),
    checklistItems: countList(backup.node_checklist_items),
    attachments: countList(backup.attachments),
  };
}

async function readPreviewFromFile(file: File): Promise<PreviewState> {
  const isZip = file.name.toLowerCase().endsWith(".zip") || file.type === "application/zip";
  if (!isZip) {
    if (file.size > 10 * 1024 * 1024) throw new Error("JSON 备份文件不能超过 10MB。");
    return { ...readPreview(JSON.parse(await file.text())), isFullBackup: false };
  }
  if (file.size > 40 * 1024 * 1024) throw new Error("完整备份 ZIP 不能超过 40MB。");
  const archive = readZip(new Uint8Array(await file.arrayBuffer()));
  const backup = archive.get("backup.json");
  const manifest = archive.get("full-backup.json");
  if (!backup || !manifest) throw new Error("请选择从事线下载的完整备份 ZIP。");
  const manifestValue = JSON.parse(new TextDecoder().decode(manifest)) as { format?: unknown; version?: unknown };
  if (manifestValue.format !== "event-timeline-full-backup" || manifestValue.version !== 1) throw new Error("完整备份 ZIP 版本不受支持。");
  return { ...readPreview(JSON.parse(new TextDecoder().decode(backup))), isFullBackup: true };
}

export function BackupImportForm() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    setFile(null);
    setPreview(null);
    setResult(null);
    setConfirmed(false);
    setError("");
    if (!nextFile) return;
    try {
      setPreview(await readPreviewFromFile(nextFile));
      setFile(nextFile);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "无法读取备份文件。");
    }
  }

  async function importBackup() {
    if (!file || !preview || !confirmed || isSubmitting) return;
    setIsSubmitting(true);
    setError("");
    setResult(null);
    try {
      const formData = new FormData();
      formData.set("backup", file);
      const response = await fetch("/api/backup/import", { method: "POST", body: formData });
      const payload = await response.json().catch(() => null) as { error?: string; result?: ImportResult } | null;
      if (!response.ok || !payload?.result) throw new Error(payload?.error ?? "导入失败，请稍后重试。");
      setResult(payload.result);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "导入失败，请稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="pixel-card mt-5 p-5 sm:p-6">
      <div className="flex items-center gap-2"><PixelIcon className="size-5 text-[var(--wheat)]" name="archive" /><h2 className="pixel-title text-lg">选择备份文件</h2></div>
      <label className="pixel-input mt-4 flex min-h-12 cursor-pointer items-center gap-3 px-3 text-sm text-[var(--soil)]">
        <PixelIcon className="size-5 text-[var(--sage)]" name="file" />
        <span className="min-w-0 truncate">{file ? file.name : "点击选择 JSON 或完整备份 .zip 文件"}</span>
        <input accept="application/json,.json,application/zip,.zip" className="sr-only" onChange={selectFile} type="file" />
      </label>
      {error && <p className="pixel-alert mt-4" role="alert">{error}</p>}
      {preview && !result && <>
        <div className="mt-5 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
          {[["分类", preview.collections], ["事件", preview.events], ["节点", preview.nodes], ["标签", preview.tags], ["关联", preview.references], ["清单", preview.checklistItems]].map(([label, count]) => <div className="rounded-sm border-2 border-[var(--line)] bg-[var(--cream-deep)] p-3" key={String(label)}><span className="block text-xs text-[var(--soil)]">{label}</span><strong className="mt-1 block text-lg text-[var(--ink)]">{count}</strong></div>)}
        </div>
        {preview.attachments > 0 && <p className="mt-4 text-sm leading-6 text-[var(--soil)]">{preview.isFullBackup ? `完整 ZIP 含 ${preview.attachments} 个附件，原件会自动恢复并重新关联。` : `此 JSON 还记录了 ${preview.attachments} 个附件；由于原文件不在 JSON 中，它们会跳过。`}</p>}
        <label className="mt-5 flex items-start gap-3 text-sm leading-6 text-[var(--soil)]"><input checked={confirmed} className="mt-1 size-4 accent-[var(--sage)]" onChange={(event) => setConfirmed(event.target.checked)} type="checkbox" /><span>我知道导入会创建新的记录副本，且不会覆盖现在的数据。</span></label>
        <button className="pixel-button mt-5 min-h-12 px-5" disabled={!confirmed || isSubmitting} onClick={importBackup} type="button"><PixelIcon className="size-4" name="archive" />{isSubmitting ? "正在导入…" : "确认导入为新副本"}</button>
      </>}
      {result && <div className="mt-5 rounded-sm border-2 border-[var(--sage)] bg-[var(--cream-deep)] p-4 text-sm leading-7 text-[var(--soil)]" role="status"><p className="font-bold text-[var(--ink)]">备份已导入为新的副本。</p><p>新增 {result.imported.events} 个事件、{result.imported.nodes} 个节点、{result.imported.references} 个关联和 {result.imported.checklistItems} 条清单。</p>{result.isFullBackup ? <p>已自动恢复 {result.restoredAttachments} 个附件{result.skippedAttachments ? `；另有 ${result.skippedAttachments} 个附件原件缺失，未恢复。` : "。"}</p> : <p>跳过 {result.skippedAttachments} 个附件文件记录（原文件不在 JSON 备份中）。</p>}{result.skippedChecklistItems ? <p>你的数据库暂未启用清单功能，另有 {result.skippedChecklistItems} 条清单未导入。</p> : null}</div>}
    </section>
  );
}
