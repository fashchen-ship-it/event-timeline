import Link from "next/link";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/layout/bottom-nav";
import { PageShell, PixelEmptyState, PixelIcon } from "@/components/ui/pixel";
import { getGlobalTimelineNodes } from "@/lib/events/queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function dateLabel(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${year} 年 ${Number(month)} 月 ${Number(day)} 日`;
}

function monthLabel(value: string) {
  const [year, month] = value.split("-");
  return `${year} 年 ${Number(month)} 月`;
}

export default async function JournalPage({ searchParams }: { searchParams: Promise<{ month?: string; important?: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [nodes, filters] = await Promise.all([getGlobalTimelineNodes(), searchParams]);
  const months = [...new Set(nodes.map((node) => node.event_date.slice(0, 7)))].sort((a, b) => b.localeCompare(a));
  const requestedMonth = filters.month ?? "";
  const selectedMonth = months.includes(requestedMonth) ? requestedMonth : "all";
  const importantOnly = filters.important === "1";
  const visibleNodes = nodes.filter((node) => (selectedMonth === "all" || node.event_date.startsWith(selectedMonth)) && (!importantOnly || node.is_important));
  const groups = visibleNodes.reduce<Map<string, typeof nodes>>((map, node) => {
    const list = map.get(node.event_date) ?? [];
    list.push(node);
    map.set(node.event_date, list);
    return map;
  }, new Map());

  return (
    <PageShell>
      <header className="pixel-paper p-5 sm:p-6"><p className="pixel-eyebrow">LIFE JOURNAL</p><div className="mt-2 flex items-start justify-between gap-3"><div><h1 className="pixel-title text-3xl sm:text-4xl">全部记录</h1><p className="mt-2 text-sm leading-6 text-[var(--soil)]">把不同事线里的重要时刻，按发生日期放在一起看。</p></div><div className="flex shrink-0 gap-2"><Link className="pixel-button pixel-button-secondary min-h-10 px-3 text-sm" href="/calendar">月历</Link><Link className="pixel-button pixel-button-secondary min-h-10 px-3 text-sm" href="/events">返回</Link></div></div></header>
      {nodes.length ? <>
        <form action="/journal" className="pixel-paper mt-5 grid gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]"><label className="sr-only" htmlFor="journal-month">选择月份</label><select className="pixel-select min-w-0 py-2 text-sm" defaultValue={selectedMonth} id="journal-month" name="month"><option value="all">全部月份</option>{months.map((month) => <option key={month} value={month}>{monthLabel(month)}</option>)}</select><label className="flex min-h-10 items-center gap-2 border-2 border-[var(--line)] bg-[var(--paper-deep)] px-3 text-sm font-bold text-[var(--soil)]"><input className="size-4 accent-[var(--forest)]" defaultChecked={importantOnly} name="important" type="checkbox" value="1" />只看重要节点</label><button className="pixel-button pixel-button-secondary min-h-10 px-3 text-sm" type="submit">筛选</button></form>
        <p className="mt-3 text-xs leading-5 text-[var(--soil)]">当前显示 {visibleNodes.length} 条记录；为保持手机阅读流畅，最多加载最近 200 条。</p>
        {visibleNodes.length ? <div className="mt-6 space-y-8">{[...groups].map(([date, entries]) => <section key={date}><h2 className="pixel-title flex items-center gap-2 text-lg"><PixelIcon className="size-4 text-[var(--sage)]" name="calendar" />{dateLabel(date)}</h2><ol className="mt-3 space-y-3">{entries.map((node) => <li className="pixel-card p-4" key={node.id}><Link className="block" href={`/events/${node.event?.id}#node-${node.id}`}><div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center border-2 border-[var(--line)] bg-[var(--paper-deep)] text-[var(--forest)]">{node.event?.icon || <PixelIcon className="size-4" name={node.is_important ? "star" : "journal"} />}</span><div className="min-w-0"><p className="text-xs font-bold text-[var(--sage)]">{node.event?.title ?? "未命名事线"}{node.event_time && ` · ${node.event_time.slice(0, 5)}`}</p><h3 className="mt-1 font-bold text-[var(--ink)]">{node.title}</h3>{node.content && <p className="mt-1 line-clamp-2 text-sm leading-6 text-[var(--soil)]">{node.content}</p>}</div></div></Link></li>)}</ol></section>)}</div> : <div className="mt-8"><PixelEmptyState icon="search" title="没有符合条件的记录。">换一个月份，或取消“只看重要节点”后再看看。</PixelEmptyState></div>}
      </> : <div className="mt-8"><PixelEmptyState icon="journal" title="还没有留下任何节点。">从一条事线的第一个重要时刻开始记录吧。</PixelEmptyState></div>}
      <BottomNav />
    </PageShell>
  );
}
