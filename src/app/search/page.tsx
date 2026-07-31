import Link from "next/link";
import { BottomNav } from "@/components/layout/bottom-nav";
import { EVENT_STATUS_LABELS, EVENT_STATUSES } from "@/lib/events/types";
import { getTags } from "@/lib/events/queries";
import { parseSearchFilters, searchTimeline } from "@/lib/search/queries";

export const dynamic = "force-dynamic";

function dateLabel(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${year}年${Number(month)}月${Number(day)}日`;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseSearchFilters(await searchParams);
  const tags = await getTags();
  const hasSearch = Boolean(filters.q || filters.status || filters.tag || filters.from || filters.to || filters.important);
  const results = hasSearch ? await searchTimeline(filters) : [];

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-5 py-8 pb-28 sm:px-8">
      <header className="flex items-end justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <p className="text-sm font-medium tracking-[0.18em] text-stone-500">SEARCH</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900">搜索</h1>
        </div>
        <Link className="text-sm font-medium text-stone-600 underline underline-offset-4" href="/events">返回事件</Link>
      </header>

      <form action="/search" className="mt-7 space-y-4 rounded-3xl border border-stone-200 bg-white p-5">
        <div className="flex gap-2">
          <input className="h-12 min-w-0 flex-1 rounded-xl border border-stone-300 bg-white px-3 text-base outline-none focus:border-stone-500 focus:ring-2 focus:ring-stone-200" defaultValue={filters.q} name="q" placeholder="事件名称、节点内容或标签" type="search" />
          <button className="rounded-xl bg-stone-800 px-4 text-sm font-medium text-white hover:bg-stone-700" type="submit">搜索</button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <select className="h-11 rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-700" defaultValue={filters.status ?? ""} name="status">
            <option value="">全部状态</option>
            {EVENT_STATUSES.filter((status) => status !== "archived").map((status) => <option key={status} value={status}>{EVENT_STATUS_LABELS[status]}</option>)}
          </select>
          <select className="h-11 rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-700" defaultValue={filters.tag ?? ""} name="tag">
            <option value="">全部标签</option>
            {tags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
          </select>
          <input className="h-11 rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-700" defaultValue={filters.from ?? ""} name="from" type="date" />
          <input className="h-11 rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-700" defaultValue={filters.to ?? ""} name="to" type="date" />
        </div>
        <label className="flex min-h-11 items-center gap-2 text-sm text-stone-700"><input className="size-4 accent-stone-800" defaultChecked={filters.important === "1"} name="important" type="checkbox" value="1" />只看重要节点</label>
      </form>

      {!hasSearch ? (
        <p className="mt-8 text-center text-base text-stone-600">输入关键词，或选择一个筛选条件开始搜索。</p>
      ) : results.length ? (
        <section className="mt-8 space-y-3">
          <p className="text-sm text-stone-500">找到 {results.length} 条结果</p>
          {results.map((result) => (
            <Link className="block rounded-2xl border border-stone-200 bg-white p-5 transition hover:border-stone-300" href={result.result_type === "node" ? `/events/${result.event_id}#node-${result.node_id}` : `/events/${result.event_id}`} key={`${result.result_type}-${result.node_id ?? result.event_id}`}>
              <div className="flex items-center justify-between gap-3 text-xs text-stone-500">
                <span>{result.result_type === "event" ? "事件" : "节点"} · {result.event_title}</span>
                <span>{dateLabel(result.result_date)}</span>
              </div>
              <h2 className="mt-2 text-lg font-semibold text-stone-900">{result.title}</h2>
              {result.excerpt && <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-600">{result.excerpt}</p>}
              {result.is_important && <span className="mt-3 inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">重要节点</span>}
            </Link>
          ))}
        </section>
      ) : (
        <p className="mt-8 text-center text-base text-stone-600">没有找到符合条件的事件或节点。</p>
      )}
      <BottomNav />
    </main>
  );
}
