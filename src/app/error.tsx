"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("Page rendering failed", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <section className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-7 text-center shadow-[0_12px_40px_rgba(74,61,47,0.08)]">
        <p className="text-sm font-medium tracking-[0.18em] text-stone-500">SOMETHING WENT WRONG</p>
        <h1 className="mt-4 text-2xl font-semibold text-stone-900">页面暂时无法打开</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">请检查网络连接后重试。如果问题持续出现，请刷新页面。</p>
        <button className="mt-7 min-h-12 rounded-xl bg-stone-800 px-5 text-base font-medium text-white hover:bg-stone-700" onClick={unstable_retry} type="button">重试</button>
      </section>
    </main>
  );
}
