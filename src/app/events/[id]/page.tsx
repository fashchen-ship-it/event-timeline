import Link from "next/link";
import { notFound } from "next/navigation";
import { EVENT_STATUS_LABELS } from "@/lib/events/types";
import { getEventDetail } from "@/lib/events/queries";
import { TimelineNodeCard } from "@/components/timeline/timeline-node";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ order?: string; important?: string }>;
}) {
  const { id } = await params;
  if (!id) notFound();
  const filters = await searchParams;
  const newestFirst = filters.order !== "asc";
  const importantOnly = filters.important === "1";
  const { event, nodes } = await getEventDetail(id, newestFirst, importantOnly);
  const tags = event.event_tags.flatMap(({ tag }) => (tag ? [tag.name] : []));

  const filterUrl = (next: { order?: "asc" | "desc"; important?: "1" }) => {
    const query = new URLSearchParams();
    if (next.order === "asc") query.set("order", "asc");
    if (next.important === "1") query.set("important", "1");
    const value = query.toString();
    return `/events/${event.id}${value ? `?${value}` : ""}`;
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-5 py-8 pb-28 sm:px-8">
      <Link className="text-sm font-medium text-stone-600 underline underline-offset-4" href="/events">返回事件</Link>
      <header className="mt-6 rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-2xl">{event.icon || "·"}</span>
            <div className="min-w-0">
              <h1 className="break-words text-2xl font-semibold tracking-tight text-stone-900">{event.title}</h1>
              <p className="mt-1 text-sm text-stone-500">{EVENT_STATUS_LABELS[event.status]}</p>
            </div>
          </div>
          <Link className="shrink-0 rounded-xl border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100" href={`/events/${event.id}/edit`}>编辑</Link>
        </div>
        {event.description && <p className="mt-5 whitespace-pre-wrap text-base leading-7 text-stone-600">{event.description}</p>}
        <div className="mt-5 flex flex-wrap gap-2 text-sm text-stone-500">
          <span>开始于 {event.start_date}</span>
          {tags.map((tag) => <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-600" key={tag}>{tag}</span>)}
        </div>
      </header>

      <section className="mt-9">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-stone-900">时间线</h2>
          <div className="flex rounded-xl bg-stone-200/70 p-1 text-sm">
            <Link className={`rounded-lg px-3 py-2 ${newestFirst ? "bg-white font-medium text-stone-900 shadow-sm" : "text-stone-600"}`} href={filterUrl({ order: "desc", important: importantOnly ? "1" : undefined })}>最新在前</Link>
            <Link className={`rounded-lg px-3 py-2 ${!newestFirst ? "bg-white font-medium text-stone-900 shadow-sm" : "text-stone-600"}`} href={filterUrl({ order: "asc", important: importantOnly ? "1" : undefined })}>最早在前</Link>
          </div>
        </div>
        <div className="mt-4">
          <Link className={`inline-flex min-h-10 items-center rounded-xl px-3 text-sm font-medium ${importantOnly ? "bg-amber-100 text-amber-800" : "bg-stone-100 text-stone-600"}`} href={filterUrl({ order: newestFirst ? "desc" : "asc", important: importantOnly ? undefined : "1" })}>
            {importantOnly ? "查看全部节点" : "只看重要节点"}
          </Link>
        </div>

        {nodes.length ? (
          <ol className="relative mt-7 space-y-5 border-l border-stone-300">{nodes.map((node) => <TimelineNodeCard eventId={event.id} key={node.id} node={node} />)}</ol>
        ) : (
          <p className="mt-7 rounded-3xl border border-dashed border-stone-300 bg-white/70 p-8 text-center text-base leading-7 text-stone-600">这件事还没有留下节点。</p>
        )}
      </section>
      <Link aria-label="添加节点" className="fixed bottom-6 right-5 flex size-14 items-center justify-center rounded-full bg-stone-800 text-3xl font-light text-white shadow-[0_8px_24px_rgba(41,39,34,0.28)] transition hover:bg-stone-700 focus:outline-none focus:ring-4 focus:ring-stone-300 sm:bottom-8 sm:right-8" href={`/events/${event.id}/nodes/new`}>+</Link>
    </main>
  );
}
