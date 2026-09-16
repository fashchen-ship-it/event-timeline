import Link from "next/link";
import { ArchiveCard } from "@/components/events/archive-card";
import { BottomNav } from "@/components/layout/bottom-nav";
import { getArchivedEvents, getEventCollections } from "@/lib/events/queries";
import type { EventSummary } from "@/lib/events/types";
import { PageShell, PixelEmptyState } from "@/components/ui/pixel";

export const dynamic = "force-dynamic";

type ArchiveSort = "updated" | "start-desc" | "start-asc" | "title";

function sortEvents(events: EventSummary[], sort: ArchiveSort) {
  return [...events].sort((a, b) => {
    if (sort === "start-desc") return b.start_date.localeCompare(a.start_date) || b.updated_at.localeCompare(a.updated_at);
    if (sort === "start-asc") return a.start_date.localeCompare(b.start_date) || b.updated_at.localeCompare(a.updated_at);
    if (sort === "title") return a.title.localeCompare(b.title, "zh-Hans-CN");
    return b.updated_at.localeCompare(a.updated_at);
  });
}

export default async function ArchivePage({ searchParams }: { searchParams: Promise<{ collection?: string; sort?: string }> }) {
  const [events, collections, filters] = await Promise.all([getArchivedEvents(), getEventCollections(), searchParams]);
  const selectedCollection = filters.collection ?? "all";
  const selectedSort: ArchiveSort = filters.sort === "start-desc" || filters.sort === "start-asc" || filters.sort === "title" ? filters.sort : "updated";
  const filteredEvents = selectedCollection === "all" ? events : selectedCollection === "none" ? events.filter((event) => !event.collection_id) : events.filter((event) => event.collection_id === selectedCollection);
  const visibleEvents = sortEvents(filteredEvents, selectedSort);

  return (
    <PageShell>
      <header className="pixel-paper flex items-end justify-between gap-4 p-5 sm:p-6"><div><p className="pixel-eyebrow">STORAGE CHEST</p><h1 className="pixel-title mt-2 text-3xl">归档箱</h1><p className="mt-2 text-sm text-[var(--soil)]">收好已经走过的路。</p></div><Link className="pixel-button pixel-button-secondary min-h-10 px-3 text-sm" href="/events">返回事件</Link></header>
      {events.length ? <>
        <form action="/archive" className="pixel-paper mt-5 grid gap-2 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          {collections.length ? <><label className="sr-only" htmlFor="archive-collection">分类</label><select className="pixel-select min-w-0 py-2 text-sm" defaultValue={selectedCollection} id="archive-collection" name="collection"><option value="all">全部分类</option><option value="none">未分类</option>{collections.map((collection) => <option key={collection.id} value={collection.id}>{collection.name}</option>)}</select></> : <input name="collection" type="hidden" value="all" />}
          <label className="sr-only" htmlFor="archive-sort">排序方式</label><select className="pixel-select min-w-0 py-2 text-sm" defaultValue={selectedSort} id="archive-sort" name="sort"><option value="updated">按最近更新</option><option value="start-desc">开始日期：新到旧</option><option value="start-asc">开始日期：旧到新</option><option value="title">按事件名称</option></select>
          <button className="pixel-button pixel-button-secondary min-h-10 px-3 text-sm" type="submit">整理</button>
        </form>
        {visibleEvents.length ? <div className="mt-5 space-y-4">{visibleEvents.map((event) => <ArchiveCard event={event} key={event.id} />)}</div> : <div className="mt-7"><PixelEmptyState icon="archive" title="这个分类里没有归档。">换一个分类，或回到编辑事件页面为它补上分类。</PixelEmptyState></div>}
      </> : <div className="mt-9"><PixelEmptyState icon="archive" title="归档箱还是空的。">完成或暂时放下的事件，会收在这里。</PixelEmptyState></div>}
      <BottomNav />
    </PageShell>
  );
}
