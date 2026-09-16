import Link from "next/link";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/layout/bottom-nav";
import { PageShell, PixelEmptyState, PixelIcon } from "@/components/ui/pixel";
import { getGlobalTimelineNodes } from "@/lib/events/queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const weekdays = ["日", "一", "二", "三", "四", "五", "六"];

function isMonth(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}$/.test(value));
}

function monthLabel(value: string) {
  const [year, month] = value.split("-");
  return `${year} 年 ${Number(month)} 月`;
}

function dateLabel(value: string) {
  const [, month, day] = value.split("-");
  return `${Number(month)} 月 ${Number(day)} 日`;
}

function calendarDays(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const firstWeekday = new Date(year, monthNumber - 1, 1).getDay();
  const totalDays = new Date(year, monthNumber, 0).getDate();
  return Array.from({ length: firstWeekday + totalDays }, (_, index) => index < firstWeekday ? null : index - firstWeekday + 1);
}

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ month?: string; date?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [nodes, filters] = await Promise.all([getGlobalTimelineNodes(), searchParams]);
  const months = [...new Set(nodes.map((node) => node.event_date.slice(0, 7)))].sort((a, b) => b.localeCompare(a));
  const currentMonth = new Date().toISOString().slice(0, 7);
  const selectedMonth = isMonth(filters.month) ? filters.month : months[0] ?? currentMonth;
  const monthNodes = nodes.filter((node) => node.event_date.startsWith(selectedMonth));
  const nodesByDate = monthNodes.reduce<Map<string, typeof nodes>>((map, node) => {
    const entries = map.get(node.event_date) ?? [];
    entries.push(node);
    map.set(node.event_date, entries);
    return map;
  }, new Map());
  const datesWithNodes = [...nodesByDate.keys()].sort();
  const requestedDate = filters.date?.startsWith(`${selectedMonth}-`) ? filters.date : undefined;
  const selectedDate = requestedDate && nodesByDate.has(requestedDate) ? requestedDate : datesWithNodes[0] ?? null;
  const selectedNodes = selectedDate ? nodesByDate.get(selectedDate) ?? [] : [];

  return (
    <PageShell>
      <header className="pixel-paper p-5 sm:p-6">
        <p className="pixel-eyebrow">EVENT ALMANAC</p>
        <div className="mt-2 flex items-start justify-between gap-3">
          <div><h1 className="pixel-title text-3xl sm:text-4xl">事线月历</h1><p className="mt-2 text-sm leading-6 text-[var(--soil)]">不是待办清单，只把已经发生的记录按日期摊开来看。</p></div>
          <Link className="pixel-button pixel-button-secondary min-h-10 shrink-0 px-3 text-sm" href="/journal">记录流</Link>
        </div>
      </header>

      <form action="/calendar" className="pixel-paper mt-5 flex gap-2 p-3">
        <label className="sr-only" htmlFor="calendar-month">选择月份</label>
        <select className="pixel-select min-w-0 flex-1 py-2 text-sm" defaultValue={selectedMonth} id="calendar-month" name="month">
          {months.length ? months.map((month) => <option key={month} value={month}>{monthLabel(month)}</option>) : <option value={selectedMonth}>{monthLabel(selectedMonth)}</option>}
        </select>
        <button className="pixel-button pixel-button-secondary min-h-10 px-3 text-sm" type="submit">查看</button>
      </form>

      {nodes.length ? <>
        <section aria-label={`${monthLabel(selectedMonth)} 月历`} className="pixel-calendar mt-6">
          <div className="pixel-calendar-heading"><PixelIcon className="size-5 text-[var(--wheat)]" name="calendar" /><h2 className="pixel-title text-xl">{monthLabel(selectedMonth)}</h2><span>{monthNodes.length} 条记录</span></div>
          <div className="pixel-calendar-weekdays">{weekdays.map((day) => <span key={day}>{day}</span>)}</div>
          <div className="pixel-calendar-grid">
            {calendarDays(selectedMonth).map((day, index) => {
              if (!day) return <span aria-hidden="true" className="pixel-calendar-blank" key={`blank-${index}`} />;
              const date = `${selectedMonth}-${String(day).padStart(2, "0")}`;
              const entries = nodesByDate.get(date) ?? [];
              const importantCount = entries.filter((entry) => entry.is_important).length;
              const active = date === selectedDate;
              const content = <><span className="pixel-calendar-day-number">{day}</span>{entries.length > 0 && <span className="pixel-calendar-count"><span aria-hidden="true" className="pixel-calendar-dots">{entries.slice(0, 3).map((entry) => <i key={entry.id} />)}</span><span>{entries.length}</span>{importantCount > 0 && <PixelIcon className="size-3 text-[#9d7226]" name="star" />}</span>}</>;
              return entries.length ? <Link aria-label={`${dateLabel(date)}，${entries.length} 条记录${importantCount ? `，${importantCount} 条重要记录` : ""}`} className={`pixel-calendar-day ${active ? "pixel-calendar-day-active" : ""}`} href={`/calendar?month=${selectedMonth}&date=${date}`} key={date}>{content}</Link> : <span className="pixel-calendar-day" key={date}>{content}</span>;
            })}
          </div>
        </section>

        <section className="mt-7" id="day-records">
          <div className="flex items-center gap-2"><PixelIcon className="size-5 text-[var(--sage)]" name="journal" /><h2 className="pixel-title text-xl">{selectedDate ? `${dateLabel(selectedDate)} 的记录` : "这个月还没有记录"}</h2></div>
          {selectedNodes.length ? <ol className="mt-4 space-y-3">{selectedNodes.map((node) => <li className="pixel-card p-4" key={node.id}><Link className="block" href={`/events/${node.event?.id}#node-${node.id}`}><div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center border-2 border-[var(--line)] bg-[var(--paper-deep)] text-[var(--forest)]">{node.event?.icon || <PixelIcon className="size-4" name={node.is_important ? "star" : "journal"} />}</span><div className="min-w-0"><p className="text-xs font-bold text-[var(--sage)]">{node.event?.title ?? "未命名事线"}{node.event_time && ` · ${node.event_time.slice(0, 5)}`}</p><h3 className="mt-1 font-bold text-[var(--ink)]">{node.title}</h3>{node.content && <p className="mt-1 line-clamp-2 text-sm leading-6 text-[var(--soil)]">{node.content}</p>}</div></div></Link></li>)}</ol> : <p className="pixel-empty mt-4 text-sm text-[var(--soil)]">点击带小圆点的日期，查看当天留下的记录。</p>}
        </section>
      </> : <div className="mt-8"><PixelEmptyState icon="calendar" title="月历还没有可以放进去的记录。">先在一条事线上留下一次节点，发生过的日子会出现在这里。</PixelEmptyState></div>}
      <BottomNav />
    </PageShell>
  );
}
