import Link from "next/link";
import { notFound } from "next/navigation";
import { EVENT_STATUS_LABELS } from "@/lib/events/types";
import { getEventActivityStats, getEventDetail, getEventReferenceTargets, getEventRelations } from "@/lib/events/queries";
import { EventRelations } from "@/components/events/event-relations";
import { EventActivitySummary } from "@/components/events/event-activity-summary";
import { EventStatusSwitcher } from "@/components/events/event-status-switcher";
import { nodeGapLabel, TimelineNodeCard } from "@/components/timeline/timeline-node";
import { CompactNodeList } from "@/components/timeline/compact-node-list";
import { NodeFinder } from "@/components/timeline/node-finder";
import { PageShell, PixelEmptyState, PixelIcon } from "@/components/ui/pixel";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ order?: string; important?: string; view?: string }> }) {
  const { id } = await params;
  if (!id) notFound();
  const filters = await searchParams;
  const newestFirst = filters.order !== "asc";
  const importantOnly = filters.important === "1";
  const listView = filters.view === "list";
  const [{ event, nodes }, targets, relations, stats] = await Promise.all([
    getEventDetail(id, newestFirst, importantOnly),
    getEventReferenceTargets(id),
    getEventRelations(id),
    getEventActivityStats(id),
  ]);
  const tags = event.event_tags.flatMap(({ tag }) => (tag ? [tag.name] : []));
  const filterUrl = (next: { order?: "asc" | "desc"; important?: "1"; view?: "timeline" | "list" }) => {
    const query = new URLSearchParams();
    if (next.order === "asc") query.set("order", "asc");
    if (next.important === "1") query.set("important", "1");
    if (next.view === "list") query.set("view", "list");
    const value = query.toString();
    return `/events/${event.id}${value ? `?${value}` : ""}`;
  };

  return (
    <PageShell>
      <Link className="inline-flex items-center gap-1 text-sm font-bold text-[var(--forest)] underline underline-offset-4" href="/events"><span aria-hidden>←</span> 返回事件</Link>
      <header className="pixel-paper mt-5 p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-md border-2 border-[var(--soil)] bg-[var(--paper-deep)] text-2xl text-[var(--forest)] shadow-[2px_2px_0_var(--line)]">{event.icon || <PixelIcon className="size-6" name="journal" />}</span>
            <div className="min-w-0"><p className="pixel-eyebrow">EVENT DOSSIER</p><h1 className="pixel-title mt-1 break-words text-2xl sm:text-3xl">{event.title}</h1><p className="mt-2 text-sm font-bold text-[var(--forest)]">{EVENT_STATUS_LABELS[event.status]}</p><EventStatusSwitcher eventId={event.id} status={event.status} /></div>
          </div>
          <div className="flex shrink-0 gap-2"><Link aria-label="快速记录节点" className="pixel-button pixel-button-primary min-h-10 px-3 text-sm" href={`/quick?event=${event.id}`}><PixelIcon className="size-4" name="plus" /><span className="hidden sm:inline">快记</span></Link><a aria-label="导出 CSV" className="pixel-button pixel-button-secondary min-h-10 px-3 text-sm" href={`/events/${event.id}/export`}><PixelIcon className="size-4" name="file" /><span className="hidden sm:inline">导出</span></a><Link aria-label="编辑事件" className="pixel-button pixel-button-secondary min-h-10 px-3 text-sm" href={`/events/${event.id}/edit`}><PixelIcon className="size-4" name="edit" />编辑</Link></div>
        </div>
        {event.description && <p className="mt-5 whitespace-pre-wrap text-base leading-7 text-[var(--soil)]">{event.description}</p>}
        <div className="mt-5 flex flex-wrap gap-2"><span className="pixel-chip"><PixelIcon className="size-3" name="calendar" />开始于 {event.start_date}</span>{tags.map((tag) => <span className="pixel-chip" key={tag}>{tag}</span>)}</div>
        <EventActivitySummary startDate={event.start_date} stats={stats} />
      </header>

      <EventRelations eventId={event.id} incoming={relations.incoming} outgoing={relations.outgoing} targets={targets} />

      <section className="mt-9">
        {nodes.length > 0 && <NodeFinder />}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2"><PixelIcon className="size-5 text-[var(--sage)]" name="journal" /><h2 className="pixel-title text-xl">记录小径</h2></div>
          <div className="flex flex-wrap gap-2"><div className="flex border-2 border-[var(--line)] bg-[var(--paper-deep)] p-1 text-sm font-bold"><Link className={`rounded px-3 py-2 ${newestFirst ? "bg-[var(--card)] text-[var(--forest)] shadow-[1px_1px_0_var(--line)]" : "text-[var(--soil)]"}`} href={filterUrl({ order: "desc", important: importantOnly ? "1" : undefined, view: listView ? "list" : "timeline" })}>最新在前</Link><Link className={`rounded px-3 py-2 ${!newestFirst ? "bg-[var(--card)] text-[var(--forest)] shadow-[1px_1px_0_var(--line)]" : "text-[var(--soil)]"}`} href={filterUrl({ order: "asc", important: importantOnly ? "1" : undefined, view: listView ? "list" : "timeline" })}>最早在前</Link></div><div className="flex border-2 border-[var(--line)] bg-[var(--paper-deep)] p-1 text-sm font-bold"><Link className={`rounded px-3 py-2 ${!listView ? "bg-[var(--card)] text-[var(--forest)] shadow-[1px_1px_0_var(--line)]" : "text-[var(--soil)]"}`} href={filterUrl({ order: newestFirst ? "desc" : "asc", important: importantOnly ? "1" : undefined, view: "timeline" })}>小径</Link><Link className={`rounded px-3 py-2 ${listView ? "bg-[var(--card)] text-[var(--forest)] shadow-[1px_1px_0_var(--line)]" : "text-[var(--soil)]"}`} href={filterUrl({ order: newestFirst ? "desc" : "asc", important: importantOnly ? "1" : undefined, view: "list" })}>列表</Link></div></div>
        </div>
        <div className="mt-4"><Link className={`pixel-button min-h-10 px-3 text-sm ${importantOnly ? "border-[var(--brick)] bg-[#f9dfad] text-[#7d5321] shadow-[2px_2px_0_#b86950]" : "pixel-button-secondary"}`} href={filterUrl({ order: newestFirst ? "desc" : "asc", important: importantOnly ? undefined : "1", view: listView ? "list" : "timeline" })}>{importantOnly ? "查看全部节点" : "只看重要节点"}</Link></div>
        {nodes.length ? listView ? <CompactNodeList eventId={event.id} nodes={nodes} /> : <ol className="pixel-timeline mt-7 space-y-5">{nodes.flatMap((node, index) => {
          const gap = index > 0 ? nodeGapLabel(nodes[index - 1], node) : null;
          return [
            ...(gap ? [<li className="ml-9 sm:ml-11" key={`gap-${node.id}`}><span className="pixel-gap-label"><PixelIcon className="size-3" name="hourglass" />{gap}</span></li>] : []),
            <TimelineNodeCard eventId={event.id} key={node.id} node={node} />,
          ];
        })}</ol> : <div className="mt-7"><PixelEmptyState icon="star" title="这件事还没有留下节点。">从第一个重要时刻开始记录吧。</PixelEmptyState></div>}
      </section>
      <Link aria-label="添加节点" className="pixel-button pixel-button-primary fixed bottom-6 right-5 z-30 size-14 min-h-14 rounded-md p-0 shadow-[3px_3px_0_#25442e] sm:bottom-8 sm:right-8" href={`/events/${event.id}/nodes/new`}><PixelIcon className="size-6" name="plus" /></Link>
    </PageShell>
  );
}
