"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PixelIcon } from "@/components/ui/pixel";

const messages: Record<string, string> = {
  "event-created": "新事件已经建好，可以从第一个节点开始记录。",
  "event-updated": "事件信息已保存。",
  "event-archived": "事件已归档，之后可在归档箱找回。",
  "event-deleted": "事件及其节点、附件已删除。",
  "node-saved": "记录已保存到这条事线。",
  "node-deleted": "节点及其附件已删除。",
};

export function ActionNotice() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const notice = searchParams.get("notice");
  const message = notice ? messages[notice] : undefined;

  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams.toString());
      next.delete("notice");
      const query = next.toString();
      router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
    }, 5_000);
    return () => window.clearTimeout(timeout);
  }, [message, pathname, router, searchParams]);

  if (!message) return null;
  return <div aria-live="polite" className="mt-4 flex items-start gap-2 border-2 border-[var(--sage)] bg-[#e8f0df] px-3 py-2 text-sm leading-6 text-[var(--forest)]"><PixelIcon className="mt-0.5 size-4 shrink-0" name="sprout" /><span>{message}</span></div>;
}
