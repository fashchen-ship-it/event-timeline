"use client";

import { useEffect } from "react";
import { PixelIcon } from "@/components/ui/pixel";

export default function ErrorPage({ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  useEffect(() => { console.error("Page rendering failed", error); }, [error]);
  return <main className="flex min-h-screen items-center justify-center px-5 py-10"><section className="pixel-paper w-full max-w-md p-7 text-center"><PixelIcon className="mx-auto size-10 text-[var(--brick)]" name="hourglass" /><p className="pixel-eyebrow mt-5">A SMALL PAUSE</p><h1 className="pixel-title mt-3 text-2xl">页面暂时无法打开</h1><p className="mt-3 text-sm leading-7 text-[var(--soil)]">你的记录没有被删除。请检查网络后重试；若刚完成保存，也可以直接回到事件列表确认。</p><div className="mt-7 flex flex-wrap justify-center gap-3"><button className="pixel-button pixel-button-primary text-base" onClick={unstable_retry} type="button">再试一次</button><button className="pixel-button pixel-button-secondary text-base" onClick={() => window.location.assign("/events")} type="button">回到事件</button></div></section></main>;
}
