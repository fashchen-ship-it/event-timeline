import Link from "next/link";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/layout/bottom-nav";
import { PageShell, PixelEmptyState, PixelIcon } from "@/components/ui/pixel";
import { getTimelineOverview } from "@/lib/events/queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function monthLabel(value: string) {
  const [year, month] = value.split("-");
  return `${year} 年 ${Number(month)} 月`;
}

export default async function InsightsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const overview = await getTimelineOverview();
  const metrics = [
    { label: "记录节点", value: overview.totalNodes, icon: "journal" as const, tone: "text-[var(--forest)]" },
    { label: "重要时刻", value: overview.importantNodes, icon: "star" as const, tone: "text-[#a97d30]" },
    { label: "正在发生", value: overview.activeEvents, icon: "sprout" as const, tone: "text-[var(--sage)]" },
    { label: "事件总数", value: overview.totalEvents, icon: "calendar" as const, tone: "text-[var(--soil)]" },
  ];

  return (
    <PageShell>
      <header className="pixel-paper p-5 sm:p-6">
        <p className="pixel-eyebrow">LIFE ALMANAC</p>
        <div className="mt-2 flex items-start justify-between gap-3">
          <div><h1 className="pixel-title text-3xl sm:text-4xl">记录统计</h1><p className="mt-2 text-sm leading-6 text-[var(--soil)]">不是评价生活，只是看看这一段日子留下了多少真实的痕迹。</p></div>
          <Link className="pixel-button pixel-button-secondary min-h-10 shrink-0 px-3 text-sm" href="/calendar">事线月历</Link>
        </div>
      </header>

      {overview.totalNodes ? <>
        <section className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {metrics.map((metric) => <article className="pixel-card p-4" key={metric.label}><PixelIcon className={`size-5 ${metric.tone}`} name={metric.icon} /><p className="mt-3 text-2xl font-black text-[var(--ink)]">{metric.value}</p><p className="mt-1 text-xs font-bold text-[var(--soil)]">{metric.label}</p></article>)}
        </section>
        <section className="mt-7"><div className="flex items-center gap-2"><PixelIcon className="size-5 text-[var(--sage)]" name="calendar" /><h2 className="pixel-title text-xl">按月翻看</h2></div><p className="mt-2 text-sm leading-6 text-[var(--soil)]">显示最近 12 个留下过节点的月份。</p><ol className="mt-4 space-y-3">{overview.months.map((month) => <li className="pixel-card flex items-center justify-between gap-4 p-4" key={month.month}><div><h3 className="font-bold text-[var(--ink)]">{monthLabel(month.month)}</h3><p className="mt-1 text-xs text-[var(--soil)]">{month.eventCount} 条事线留下记录</p></div><div className="flex shrink-0 items-center gap-3 text-right"><span className="text-sm font-bold text-[var(--forest)]">{month.nodeCount} 节点</span><span className="inline-flex items-center gap-1 text-xs font-bold text-[#8a6727]"><PixelIcon className="size-3.5" name="star" />{month.importantCount}</span></div></li>)}</ol>
        </section>
      </> : <div className="mt-8"><PixelEmptyState icon="calendar" title="还没有可回看的记录。">先在任意一条事线上留下一次节点，统计会慢慢长出来。</PixelEmptyState></div>}
      <Link aria-label="返回事件" className="pixel-button pixel-button-primary fixed bottom-22 right-5 z-30 size-14 min-h-14 rounded-md p-0 shadow-[3px_3px_0_#25442e] sm:bottom-8 sm:right-8" href="/events"><PixelIcon className="size-6" name="journal" /></Link>
      <BottomNav />
    </PageShell>
  );
}
