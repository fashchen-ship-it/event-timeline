import Link from "next/link";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/layout/bottom-nav";
import { PageShell, PixelEmptyState, PixelIcon } from "@/components/ui/pixel";
import { getGlobalTimelineNodes } from "@/lib/events/queries";
import type { GlobalTimelineNode } from "@/lib/timeline/types";
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

function timeGapLabel(previous: GlobalTimelineNode, current: GlobalTimelineNode) {
  if (!previous.event_time || !current.event_time) return null;
  const previousTime = new Date(`${previous.event_date}T${previous.event_time}`).getTime();
  const currentTime = new Date(`${current.event_date}T${current.event_time}`).getTime();
  const minutes = Math.round((currentTime - previousTime) / 60_000);
  if (minutes <= 0) return null;
  if (minutes < 60) return `${minutes} 分钟后`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours} 小时 ${remainder} 分钟后` : `${hours} 小时后`;
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + days);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function calendarHref(date: string) {
  return `/calendar?month=${date.slice(0, 7)}&date=${date}`;
}

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ month?: string; date?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const filters = await searchParams;
  let nodes: GlobalTimelineNode[] = [];
  let calendarReadFailed = false;
  try {
    nodes = await getGlobalTimelineNodes();
  } catch {
    calendarReadFailed = true;
  }
  const months = [...new Set(nodes.map((node) => node.event_date.slice(0, 7)))].sort((a, b) => b.localeCompare(a));
  const currentMonth = new Date().toISOString().slice(0, 7);
  const selectedMonth = isMonth(filters.month) ? filters.month : months[0] ?? currentMonth;
  const monthNodes = nodes.filter((node) => node.event_date.startsWith(selectedMonth));
  const allNodesByDate = nodes.reduce<Map<string, typeof nodes>>((map, node) => {
    const entries = map.get(node.event_date) ?? [];
    entries.push(node);
    map.set(node.event_date, entries);
    return map;
  }, new Map());
  const nodesByDate = monthNodes.reduce<Map<string, typeof nodes>>((map, node) => {
    const entries = map.get(node.event_date) ?? [];
    entries.push(node);
    map.set(node.event_date, entries);
    return map;
  }, new Map());
  const datesWithNodes = [...nodesByDate.keys()].sort();
  const requestedDate = filters.date?.startsWith(`${selectedMonth}-`) ? filters.date : undefined;
  const selectedDate = requestedDate && nodesByDate.has(requestedDate) ? requestedDate : datesWithNodes[0] ?? null;
  const selectedNodes = selectedDate ? [...(nodesByDate.get(selectedDate) ?? [])].sort((a, b) => (a.event_time ?? "00:00").localeCompare(b.event_time ?? "00:00")) : [];
  const recordedDates = [...allNodesByDate.keys()].sort();
  const selectedIndex = selectedDate ? recordedDates.indexOf(selectedDate) : -1;
  const previousDate = selectedIndex > 0 ? recordedDates[selectedIndex - 1] : null;
  const nextDate = selectedIndex >= 0 && selectedIndex < recordedDates.length - 1 ? recordedDates[selectedIndex + 1] : null;
  const weekDates = selectedDate ? Array.from({ length: 7 }, (_, index) => addDays(selectedDate, index - 3)) : [];

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

      {calendarReadFailed ? <div className="pixel-empty mt-8"><PixelIcon className="mx-auto size-10 text-[var(--brick)]" name="hourglass" /><h2 className="pixel-title mt-4 text-xl">月历暂时没有读到记录。</h2><p className="mt-2 text-sm leading-7 text-[var(--soil)]">你的事线没有被删除。通常是网络或服务短暂波动，稍后重新打开月历即可。</p><Link className="pixel-button pixel-button-primary mt-5 min-h-11 px-4 text-sm" href="/calendar"><PixelIcon className="size-4" name="calendar" />重新打开月历</Link></div> : nodes.length ? <>
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
          <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><PixelIcon className="size-5 text-[var(--sage)]" name="journal" /><h2 className="pixel-title text-xl">{selectedDate ? `${dateLabel(selectedDate)} 的记录` : "这个月还没有记录"}</h2></div>{selectedNodes.length > 0 && <span className="pixel-chip">当天记录流</span>}</div>
          {selectedDate && <nav aria-label="切换记录日期" className="pixel-week-strip mt-4"><div className="flex items-center justify-between gap-2"><span>{previousDate ? <Link className="pixel-week-nav" href={calendarHref(previousDate)}>‹ 前一记录日</Link> : <span className="pixel-week-nav pixel-week-nav-disabled">‹ 前一记录日</span>}</span><span>{nextDate ? <Link className="pixel-week-nav" href={calendarHref(nextDate)}>后一记录日 ›</Link> : <span className="pixel-week-nav pixel-week-nav-disabled">后一记录日 ›</span>}</span></div><div className="mt-3 grid grid-cols-7 gap-1">{weekDates.map((date) => { const entries = allNodesByDate.get(date) ?? []; const weekday = weekdays[new Date(`${date}T12:00:00`).getDay()]; const active = date === selectedDate; const content = <><span>{weekday}</span><strong>{Number(date.slice(-2))}</strong>{entries.length > 0 && <i>{entries.length}</i>}</>; return entries.length ? <Link aria-label={`${dateLabel(date)}，${entries.length} 条记录`} className={`pixel-week-day ${active ? "pixel-week-day-active" : ""}`} href={calendarHref(date)} key={date}>{content}</Link> : <span className="pixel-week-day" key={date}>{content}</span>; })}</div></nav>}
          {selectedNodes.length ? <ol className="pixel-day-flow mt-4">{selectedNodes.map((node, index) => <li className="pixel-day-flow-item" key={node.id}>{index > 0 && timeGapLabel(selectedNodes[index - 1], node) && <p className="pixel-day-flow-gap">{timeGapLabel(selectedNodes[index - 1], node)}</p>}<Link className="pixel-card block p-4" href={`/events/${node.event?.id}#node-${node.id}`}><div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center border-2 border-[var(--line)] bg-[var(--paper-deep)] text-[var(--forest)]">{node.event?.icon || <PixelIcon className="size-4" name={node.is_important ? "star" : "journal"} />}</span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><p className="truncate text-xs font-bold text-[var(--sage)]">{node.event?.title ?? "未命名事线"}</p>{node.event_time && <time className="shrink-0 text-xs font-bold text-[var(--soil)]">{node.event_time.slice(0, 5)}</time>}</div><h3 className="mt-1 font-bold text-[var(--ink)]">{node.title}</h3>{node.content && <p className="mt-1 line-clamp-2 text-sm leading-6 text-[var(--soil)]">{node.content}</p>}</div></div></Link></li>)}</ol> : <p className="pixel-empty mt-4 text-sm text-[var(--soil)]">点击带小圆点的日期，查看当天留下的记录。</p>}
        </section>
      </> : <div className="mt-8"><PixelEmptyState icon="calendar" title="月历还没有可以放进去的记录。">先在一条事线上留下一次节点，发生过的日子会出现在这里。</PixelEmptyState></div>}
      <BottomNav />
    </PageShell>
  );
}
