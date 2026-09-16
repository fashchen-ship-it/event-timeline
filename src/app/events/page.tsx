import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/lib/auth/actions";
import { batchUpdateEventStatus } from "@/lib/events/actions";
import { EventCard } from "@/components/events/event-card";
import { BottomNav } from "@/components/layout/bottom-nav";
import { getEventCollections, getEvents, getRecentEvents } from "@/lib/events/queries";
import { EVENT_STATUS_LABELS, EVENT_STATUSES, type EventStatus } from "@/lib/events/types";
import { createClient } from "@/lib/supabase/server";
import { PageShell, PixelDoodle, PixelEmptyState, PixelIcon } from "@/components/ui/pixel";

export const dynamic = "force-dynamic";

type EventSort = "updated" | "start-desc" | "start-asc" | "title";

function sortEvents<T extends { title: string; start_date: string; updated_at: string }>(events: T[], sort: EventSort) {
  return [...events].sort((a, b) => {
    if (sort === "start-desc") return b.start_date.localeCompare(a.start_date) || b.updated_at.localeCompare(a.updated_at);
    if (sort === "start-asc") return a.start_date.localeCompare(b.start_date) || b.updated_at.localeCompare(a.updated_at);
    if (sort === "title") return a.title.localeCompare(b.title, "zh-Hans-CN");
    return b.updated_at.localeCompare(a.updated_at);
  });
}

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ collection?: string; sort?: string; status?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [events, recentEvents, collections, filters] = await Promise.all([getEvents(), getRecentEvents(), getEventCollections(), searchParams]);
  const selectedCollection = filters.collection ?? "all";
  const selectedSort: EventSort = filters.sort === "start-desc" || filters.sort === "start-asc" || filters.sort === "title" ? filters.sort : "updated";
  const selectedStatus: EventStatus | "all" = EVENT_STATUSES.includes(filters.status as EventStatus) && filters.status !== "archived" ? filters.status as EventStatus : "all";
  const filteredEvents = selectedCollection === "all" ? events : selectedCollection === "none" ? events.filter((event) => !event.collection_id) : events.filter((event) => event.collection_id === selectedCollection);
  const visibleEvents = sortEvents(selectedStatus === "all" ? filteredEvents : filteredEvents.filter((event) => event.status === selectedStatus), selectedSort);
  const visibleEventIds = new Set(visibleEvents.map((event) => event.id));
  const visibleRecentEvents = recentEvents.filter((event) => visibleEventIds.has(event.id));
  const pinnedEvents = visibleEvents.filter((event) => event.is_pinned);
  const activeEvents = visibleEvents.filter((event) => event.status === "active" && !event.is_pinned);
  const otherEvents = visibleEvents.filter((event) => event.status !== "active" && !event.is_pinned);
  const batchFormId = "batch-archive-events";

  return (
    <PageShell className="ledger-page">
      <header className="pixel-paper ledger-cover p-5 sm:p-7">
        <PixelDoodle className="ledger-field-doodle" name="field" />
        <PixelDoodle className="ledger-cat-doodle" name="cat" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="pixel-eyebrow">EVENT LOGBOOK</p>
            <h1 className="pixel-title mt-2 text-3xl sm:text-4xl">我的事线</h1>
            <p className="mt-2 text-sm leading-6 text-[var(--soil)]">把正在发生的事，慢慢记下来。</p>
          </div>
          <div className="flex shrink-0 gap-2"><Link className="pixel-button pixel-button-primary min-h-10 px-3 text-sm" href="/quick"><PixelIcon className="size-4" name="plus" /><span className="hidden sm:inline">快记</span></Link><form action={signOut}><button className="pixel-button pixel-button-secondary min-h-10 px-3 text-sm" type="submit">退出</button></form></div>
        </div>
        <form action="/search" className="mt-5 flex gap-2">
          <label className="sr-only" htmlFor="timeline-search">搜索事件和节点</label>
          <input className="pixel-input min-w-0 flex-1 text-base" id="timeline-search" name="q" placeholder="搜索事件、节点或标签" type="search" />
          <button aria-label="搜索" className="pixel-button pixel-button-primary min-h-12 px-3" type="submit"><PixelIcon className="size-5" name="search" /><span className="hidden sm:inline">搜索</span></button>
        </form>
        <Link className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-[var(--forest)] underline underline-offset-4" href="/journal"><PixelIcon className="size-4" name="journal" />查看全部记录</Link>
        <form action="/events" className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
          {collections.length > 0 && <label className="sr-only" htmlFor="collection-filter">分类</label>}
          {collections.length > 0 ? <select className="pixel-select min-w-0 py-2 text-sm" defaultValue={selectedCollection} id="collection-filter" name="collection"><option value="all">全部分类</option><option value="none">未分类</option>{collections.map((collection) => <option key={collection.id} value={collection.id}>{collection.name}</option>)}</select> : <input name="collection" type="hidden" value="all" />}
          <label className="sr-only" htmlFor="event-status">事件状态</label>
          <select className="pixel-select min-w-0 py-2 text-sm" defaultValue={selectedStatus} id="event-status" name="status"><option value="all">全部状态</option>{EVENT_STATUSES.filter((status) => status !== "archived").map((status) => <option key={status} value={status}>{EVENT_STATUS_LABELS[status]}</option>)}</select>
          <label className="sr-only" htmlFor="event-sort">排序方式</label>
          <select className="pixel-select min-w-0 py-2 text-sm" defaultValue={selectedSort} id="event-sort" name="sort"><option value="updated">按最近更新</option><option value="start-desc">开始日期：新到旧</option><option value="start-asc">开始日期：旧到新</option><option value="title">按事件名称</option></select>
          <button className="pixel-button pixel-button-secondary min-h-10 px-3 text-sm" type="submit">整理</button>
        </form>
      </header>

      {!events.length ? (
        <div className="mt-8"><PixelEmptyState icon="sprout" title="还没有正在发生的事。">创建一条事件线，记录它是怎么一步步走到今天的。<Link className="pixel-button pixel-button-primary mt-5 min-h-11 px-4 text-sm" href="/events/new"><PixelIcon className="size-4" name="plus" />新建事件</Link><p className="mt-3 text-xs opacity-70">当前账号：{user.email}</p></PixelEmptyState></div>
      ) : !visibleEvents.length ? <div className="mt-8"><PixelEmptyState icon="journal" title="没有符合筛选的事线。">换一个分类或状态，或者清除筛选后再看看。</PixelEmptyState></div> : (
        <div className="ledger-sections mt-8 space-y-9">
          {visibleRecentEvents.length > 0 && (
            <section>
              <div className="flex items-center gap-2"><PixelIcon className="size-5 text-[var(--wheat)]" name="calendar" /><h2 className="pixel-title text-xl">最近翻看</h2></div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {visibleRecentEvents.map((event) => <Link className="pixel-paper flex items-center gap-3 p-3 transition-transform hover:-translate-y-0.5" href={`/events/${event.id}`} key={event.id}><PixelIcon className="size-5 shrink-0 text-[var(--sage)]" name={event.is_pinned ? "star" : "journal"} /><span className="min-w-0 truncate font-bold text-[var(--ink)]">{event.title}</span></Link>)}
              </div>
            </section>
          )}
          <form action={batchUpdateEventStatus} className="pixel-paper ledger-tools flex flex-wrap items-center justify-between gap-3 p-3" id={batchFormId}>
            <p className="text-sm leading-6 text-[var(--soil)]">勾选事件后，可批量更新它们的状态。</p>
            <div className="flex gap-2"><select aria-label="批量设置状态" className="pixel-select min-h-10 py-2 text-sm" defaultValue="archived" name="status"><option value="active">设为进行中</option><option value="paused">设为已暂停</option><option value="completed">设为已完成</option><option value="archived">设为已归档</option></select><button className="pixel-button pixel-button-secondary min-h-10 px-3 text-sm" type="submit"><PixelIcon className="size-4" name="edit" />批量更新</button></div>
          </form>
          {pinnedEvents.length > 0 && (
            <section>
              <div className="flex items-center gap-2"><PixelIcon className="size-5 text-[#a97d30]" name="star" /><h2 className="pixel-title text-xl">置顶事线</h2></div>
              <div className="mt-4 space-y-4">{pinnedEvents.map((event) => <EventCard batchFormId={batchFormId} event={event} key={event.id} />)}</div>
            </section>
          )}
          <section>
            <div className="flex items-center gap-2"><PixelIcon className="size-5 text-[var(--sage)]" name="sprout" /><h2 className="pixel-title text-xl">正在进行</h2></div>
            {activeEvents.length ? <div className="mt-4 space-y-4">{activeEvents.map((event) => <EventCard batchFormId={batchFormId} event={event} key={event.id} />)}</div> : <p className="pixel-empty mt-4 text-sm text-[var(--soil)]">暂时没有未置顶的进行中事件。</p>}
          </section>
          {otherEvents.length > 0 && <section><div className="flex items-center gap-2"><PixelIcon className="size-5 text-[var(--wheat)]" name="journal" /><h2 className="pixel-title text-xl">其他记录</h2></div><div className="mt-4 space-y-4">{otherEvents.map((event) => <EventCard batchFormId={batchFormId} event={event} key={event.id} />)}</div></section>}
        </div>
      )}
      <Link aria-label="新建事件" className="pixel-button pixel-button-primary fixed bottom-22 right-5 z-30 size-14 min-h-14 rounded-md p-0 shadow-[3px_3px_0_#25442e] sm:bottom-8 sm:right-8" href="/events/new"><PixelIcon className="size-6" name="plus" /></Link>
      <BottomNav />
    </PageShell>
  );
}
