"use client";

import { useState } from "react";
import { PixelIcon } from "@/components/ui/pixel";

function downloadName(contentDisposition: string | null) {
  const match = contentDisposition?.match(/filename="?([^";]+)"?/i);
  return match?.[1] ?? "event-timeline-attachments.zip";
}

export function AttachmentBackupButton() {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function downloadAttachments() {
    if (isLoading) return;
    setIsLoading(true);
    setMessage("");
    try {
      const response = await fetch("/backup/attachments", { cache: "no-store" });
      if (!response.ok) throw new Error((await response.text()) || "附件备份下载失败，请稍后重试。");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = downloadName(response.headers.get("Content-Disposition"));
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setMessage("附件原件 ZIP 已开始下载。请和 JSON 备份放在一起保存。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "附件备份下载失败，请稍后重试。");
    } finally {
      setIsLoading(false);
    }
  }

  return <div><button className="pixel-button pixel-button-secondary min-h-11 px-4 text-sm" disabled={isLoading} onClick={downloadAttachments} type="button"><PixelIcon className="size-4" name="archive" />{isLoading ? "正在打包…" : "下载附件原件 ZIP"}</button>{message && <p className="mt-3 text-sm leading-6 text-[var(--soil)]" role="status">{message}</p>}</div>;
}
