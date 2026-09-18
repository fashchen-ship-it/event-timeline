"use client";

import { useState } from "react";
import { PixelIcon } from "@/components/ui/pixel";

function downloadName(contentDisposition: string | null, fallback: string) {
  const match = contentDisposition?.match(/filename="?([^";]+)"?/i);
  return match?.[1] ?? fallback;
}

function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export function FullBackupButton() {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function downloadBackup() {
    if (isLoading) return;
    setIsLoading(true);
    setMessage("");
    try {
      const bundle = crypto.randomUUID();
      let total = 1;
      for (let part = 1; part <= total; part += 1) {
        setMessage(total > 1 ? `正在准备第 ${part}/${total} 个完整备份包…` : "正在准备完整备份…");
        const response = await fetch(`/backup/full?bundle=${bundle}&part=${part}`, { cache: "no-store" });
        if (!response.ok) throw new Error((await response.text()) || "完整备份下载失败，请稍后重试。");
        total = Number(response.headers.get("X-Event-Timeline-Parts") || "1");
        if (!Number.isInteger(total) || total < 1 || total > 100) throw new Error("完整备份分包信息无效，请稍后重试。");
        saveBlob(await response.blob(), downloadName(response.headers.get("Content-Disposition"), `event-timeline-full-backup-part-${part}-of-${total}.zip`));
        // Let mobile browsers start each download before the next part is requested.
        if (part < total) await new Promise((resolve) => window.setTimeout(resolve, 500));
      }
      setMessage(total > 1 ? `已开始下载 ${total} 个完整备份包。恢复时请一次选中全部 ZIP 文件。` : "完整恢复 ZIP 已开始下载。恢复时选择这个文件即可。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "完整备份下载失败，请稍后重试。");
    } finally {
      setIsLoading(false);
    }
  }

  return <div><button className="pixel-button min-h-11 px-4 text-sm" disabled={isLoading} onClick={downloadBackup} type="button"><PixelIcon className="size-4" name="archive" />{isLoading ? "正在打包…" : "下载完整恢复 ZIP"}</button>{message && <p className="mt-3 text-sm leading-6 text-[var(--soil)]" role="status">{message}</p>}</div>;
}
