"use client";

import { useEffect } from "react";
import { PixelIcon } from "@/components/ui/pixel";

export default function ErrorPage({ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  useEffect(() => { console.error("Page rendering failed", error); }, [error]);
  return <main className="flex min-h-screen items-center justify-center px-5 py-10"><section className="pixel-paper w-full max-w-md p-7 text-center"><PixelIcon className="mx-auto size-10 text-[var(--brick)]" name="hourglass" /><p className="pixel-eyebrow mt-5">A SMALL PAUSE</p><h1 className="pixel-title mt-3 text-2xl">页面暂时无法打开</h1><p className="mt-3 text-sm leading-7 text-[var(--soil)]">请检查网络连接后重试。如果问题持续出现，请刷新页面。</p><button className="pixel-button pixel-button-primary mt-7 text-base" onClick={unstable_retry} type="button">再试一次</button></section></main>;
}
