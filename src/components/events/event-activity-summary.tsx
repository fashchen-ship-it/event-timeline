import { PixelIcon } from "@/components/ui/pixel";

type ActivityStats = { totalNodes: number; importantNodes: number; firstNodeDate: string | null; lastNodeDate: string | null };

function daySpan(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`).getTime();
  const end = new Date(`${endDate}T00:00:00`).getTime();
  return Math.max(1, Math.floor((end - start) / 86_400_000) + 1);
}

export function EventActivitySummary({ startDate, stats }: { startDate: string; stats: ActivityStats }) {
  const span = daySpan(startDate, stats.lastNodeDate ?? startDate);
  const items = [
    { label: "留下节点", value: `${stats.totalNodes} 条`, icon: "journal" as const },
    { label: "重要时刻", value: `${stats.importantNodes} 个`, icon: "star" as const },
    { label: "记录跨度", value: `${span} 天`, icon: "calendar" as const },
    { label: "最近记录", value: stats.lastNodeDate ?? "尚未记录", icon: "sprout" as const },
  ];
  return <section aria-label="事件回顾摘要" className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">{items.map((item) => <div className="border-2 border-[var(--line)] bg-[var(--paper-deep)] p-3" key={item.label}><p className="flex items-center gap-1.5 text-xs font-bold text-[var(--soil)]"><PixelIcon className="size-3.5 text-[var(--sage)]" name={item.icon} />{item.label}</p><p className="mt-2 text-sm font-bold text-[var(--ink)]">{item.value}</p></div>)}</section>;
}
