"use client";

import { useState } from "react";
import { PixelIcon } from "@/components/ui/pixel";

export function NodeFinder() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<{ total: number; visible: number } | null>(null);

  function updateSearch(nextQuery: string) {
    setQuery(nextQuery);
    const nodes = [...document.querySelectorAll<HTMLElement>("[data-timeline-node]")];
    const keyword = nextQuery.trim().toLocaleLowerCase();
    let visible = 0;
    for (const node of nodes) {
      const matches = !keyword || node.textContent?.toLocaleLowerCase().includes(keyword);
      node.toggleAttribute("hidden", !matches);
      if (matches) visible += 1;
    }
    setResult({ total: nodes.length, visible });
  }

  return (
    <div className="pixel-paper mt-4 p-3">
      <label className="sr-only" htmlFor="node-finder">查找当前事线的节点</label>
      <div className="flex gap-2"><div className="relative min-w-0 flex-1"><PixelIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--sage)]" name="search" /><input className="pixel-input min-h-10 py-2 pl-9 text-sm" id="node-finder" onChange={(event) => updateSearch(event.target.value)} placeholder="查找本事线的标题、正文或标签" type="search" value={query} /></div>{query && <button className="pixel-button pixel-button-secondary min-h-10 px-3 text-sm" onClick={() => updateSearch("")} type="button">清除</button>}</div>
      {query && result && <p aria-live="polite" className="mt-2 text-xs text-[var(--soil)]">找到 {result.visible} / {result.total} 个节点</p>}
    </div>
  );
}
