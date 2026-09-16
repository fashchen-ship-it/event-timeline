"use client";

import { deleteEventCollection, renameEventCollection } from "@/lib/events/actions";
import type { EventCollection } from "@/lib/events/types";
import { PixelIcon } from "@/components/ui/pixel";

export function CollectionManager({ collections }: { collections: EventCollection[] }) {
  if (!collections.length) return <p className="mt-3 text-sm leading-6 text-[var(--soil)]">还没有分类。创建或编辑事件时输入分类名称，即可自动建立。</p>;
  return <div className="mt-4 space-y-2">{collections.map((collection) => <div className="flex items-center gap-2 border-2 border-[var(--line)] bg-[var(--paper-deep)] p-2" key={collection.id}><span aria-hidden className="size-3 shrink-0 border border-[var(--line)]" style={{ backgroundColor: collection.color }} /><form action={renameEventCollection} className="flex min-w-0 flex-1 gap-2"><input name="id" type="hidden" value={collection.id} /><input aria-label={`修改分类 ${collection.name}`} className="pixel-input min-w-0 flex-1 py-2 text-sm" defaultValue={collection.name} maxLength={30} name="name" required /><button className="pixel-button pixel-button-secondary min-h-9 px-3 text-xs" type="submit">保存</button></form><form action={deleteEventCollection}><input name="id" type="hidden" value={collection.id} /><button aria-label={`删除分类 ${collection.name}`} className="min-h-9 px-2 text-sm font-bold text-[var(--brick)]" onClick={(event) => { if (!window.confirm(`删除“${collection.name}”分类？相关事件会变为未分类。`)) event.preventDefault(); }} type="submit"><PixelIcon className="size-4" name="archive" /></button></form></div>)}</div>;
}
