/* eslint-disable @next/next/no-img-element -- private Supabase signed URLs should not be routed through the public image optimizer. */
"use client";

import { useEffect, useState } from "react";
import type { Attachment } from "@/lib/timeline/types";

type ImageAttachment = Pick<Attachment, "id" | "file_name" | "signed_url">;

export function ImageGallery({ images }: { images: ImageAttachment[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selected = selectedIndex === null ? null : images[selectedIndex];
  const displayIndex = selectedIndex ?? 0;

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedIndex(null);
      if (event.key === "ArrowLeft" && selectedIndex !== null) setSelectedIndex((index) => index === null ? null : Math.max(0, index - 1));
      if (event.key === "ArrowRight" && selectedIndex !== null) setSelectedIndex((index) => index === null ? null : Math.min(images.length - 1, index + 1));
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [images.length, selectedIndex]);

  return <>
    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
      {images.map((image, index) => image.signed_url && <button aria-label={`查看图片：${image.file_name}`} className="pixel-photo-frame group relative text-left" key={image.id} onClick={() => setSelectedIndex(index)} type="button"><img alt={image.file_name} className="aspect-square size-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" src={image.signed_url} /><span className="absolute bottom-2 right-2 border border-[var(--soil)] bg-[#fff9ed]/90 px-1.5 py-1 text-xs font-bold text-[var(--soil)]">查看</span></button>)}
    </div>
    {selected?.signed_url && <div aria-label="图片预览" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-[#201914]/80 p-4" onClick={() => setSelectedIndex(null)} role="dialog"><div className="relative flex max-h-full w-full max-w-4xl flex-col" onClick={(event) => event.stopPropagation()}><div className="mb-2 flex items-center justify-between gap-3 text-sm font-bold text-[#fff9ed]"><span className="truncate">{selected.file_name}</span><button aria-label="关闭图片预览" className="pixel-button min-h-10 border-[#fff9ed] bg-[#fff9ed] px-3 text-[var(--soil)]" onClick={() => setSelectedIndex(null)} type="button">关闭</button></div><img alt={selected.file_name} className="max-h-[78vh] w-full rounded-md border-2 border-[#fff9ed] bg-[#201914] object-contain" src={selected.signed_url} />{images.length > 1 && <div className="mt-3 flex justify-center gap-3"><button aria-label="上一张图片" className="pixel-button min-h-10 border-[#fff9ed] bg-[#fff9ed] px-3 text-[var(--soil)] disabled:opacity-40" disabled={displayIndex === 0} onClick={() => setSelectedIndex((index) => index === null ? null : index - 1)} type="button">← 上一张</button><span className="flex items-center text-sm font-bold text-[#fff9ed]">{displayIndex + 1} / {images.length}</span><button aria-label="下一张图片" className="pixel-button min-h-10 border-[#fff9ed] bg-[#fff9ed] px-3 text-[var(--soil)] disabled:opacity-40" disabled={displayIndex === images.length - 1} onClick={() => setSelectedIndex((index) => index === null ? null : index + 1)} type="button">下一张 →</button></div>}</div></div>}
  </>;
}
