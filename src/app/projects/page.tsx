import Link from "next/link";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/layout/bottom-nav";
import { PageShell, PixelEmptyState, PixelIcon, type PixelIconName } from "@/components/ui/pixel";
import { getEventCollections, getEventsForProjects } from "@/lib/events/queries";
import { EVENT_STATUS_LABELS, EVENT_STATUSES, type EventStatus } from "@/lib/events/types";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function collectionIcon(name: string): PixelIconName {
  const normalized = name.toLowerCase();
  if (/工作|公司|职业|项目|work|career/.test(normalized)) return "briefcase";
  if (/学习|读书|课程|study|learn|book/.test(normalized)) return "study";
  if (/旅行|出行|travel|trip/.test(normalized)) return "map";
  if (/健康|运动|健身|health|sport/.test(normalized)) return "leaf";
  if (/家庭|家人|生活|宠物|朋友|life|family|pet/.test(normalized)) return "heart";
  if (/理财|钱|财务|finance|money/.test(normalized)) return "coin";
  return "journal";
}

function relativeUpdate(value: string) {
  const difference = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(difference / 60_000));
  if (minutes < 1) return "刚刚更新";
  if (minutes < 60) return `${minutes} 分钟前更新`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前更新`;
  return `${Math.floor(hours / 24)} 天前更新`;
}

type ProjectSort = "updated" | "count" | "title";

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ status?: string; sort?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [collections, events, filters] = await Promise.all([getEventCollections(), getEventsForProjects(), searchParams]);
  const selectedStatus: EventStatus | "all" = EVENT_STATUSES.includes(filters.status as EventStatus) && filters.status !== "archived" ? filters.status as EventStatus : "all";
  const selectedSort: ProjectSort = filters.sort === "count" || filters.sort === "title" ? filters.sort : "updated";
  const groups = collections.map((collection) => {
    const groupEvents = events.filter((event) => event.collection_id === collection.id).sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    return { collection, events: groupEvents, activeCount: groupEvents.filter((event) => event.status === "active").length, latest: groupEvents[0] ?? null };
  }).filter((group) => group.events.length > 0 && (selectedStatus === "all" || group.events.some((event) => event.status === selectedStatus))).sort((a, b) => {
    if (selectedSort === "count") return b.events.length - a.events.length || (b.latest?.updated_at ?? "").localeCompare(a.latest?.updated_at ?? "");
    if (selectedSort === "title") return a.collection.name.localeCompare(b.collection.name, "zh-Hans-CN");
    return (b.latest?.updated_at ?? "").localeCompare(a.latest?.updated_at ?? "");
  });
  const ungrouped = events.filter((event) => !event.collection_id).sort((a, b) => b.updated_at.localeCompare(a.updated_at));

  return (
    <PageShell>
      <header className="pixel-paper p-5 sm:p-6">
        <p className="pixel-eyebrow">PROJECT SHELVES</p>
        <div className="mt-2 flex items-start justify-between gap-3">
          <div><h1 className="pixel-title text-3xl sm:text-4xl">项目分组</h1><p className="mt-2 text-sm leading-6 text-[var(--soil)]">按主题收好事线；打开一个分组，就能继续记录它。</p></div>
          <div className="flex shrink-0 gap-2"><Link aria-label="管理项目分类" className="pixel-button pixel-button-secondary min-h-10 px-3 text-sm" href="/me#collection-management"><PixelIcon className="size-4" name="edit" /><span className="hidden sm:inline">管理</span></Link><Link className="pixel-button pixel-button-secondary min-h-10 px-3 text-sm" href="/events"><PixelIcon className="size-4" name="journal" />事线</Link></div>
        </div>
      </header>

      <p className="mt-4 text-xs leading-6 text-[var(--soil)]">删除项目分类不会删除里面的事线；它们会保留并移动到“尚未分组”。</p>
      <form action="/projects" className="pixel-paper mt-4 grid gap-2 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"><label className="sr-only" htmlFor="project-status">项目状态筛选</label><select className="pixel-select min-w-0 py-2 text-sm" defaultValue={selectedStatus} id="project-status" name="status"><option value="all">包含任意状态</option>{EVENT_STATUSES.filter((status) => status !== "archived").map((status) => <option key={status} value={status}>包含{EVENT_STATUS_LABELS[status]}</option>)}</select><label className="sr-only" htmlFor="project-sort">项目排序</label><select className="pixel-select min-w-0 py-2 text-sm" defaultValue={selectedSort} id="project-sort" name="sort"><option value="updated">按最近更新</option><option value="count">按事线数量</option><option value="title">按项目名称</option></select><button className="pixel-button pixel-button-secondary min-h-10 px-3 text-sm" type="submit">整理</button></form>
      {groups.length ? <>
        <section className="mt-7" aria-labelledby="project-groups-heading">
          <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><PixelIcon className="size-5 text-[var(--wheat)]" name="briefcase" /><h2 className="pixel-title text-xl" id="project-groups-heading">我的项目</h2></div><span className="pixel-chip">{groups.length} 组</span></div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {groups.map(({ collection, events: groupEvents, activeCount, latest }) => <Link className="pixel-card pixel-card-hover block p-4" href={`/events?collection=${collection.id}`} key={collection.id}>
              <div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center border-2 border-[var(--line)] text-[var(--ink)]" style={{ backgroundColor: `${collection.color}2e`, color: collection.color }}><PixelIcon className="size-5" name={collectionIcon(collection.name)} /></span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><h3 className="pixel-title truncate text-lg">{collection.name}</h3><PixelIcon className="mt-1 size-4 shrink-0 text-[var(--soil)]" name="link" /></div><p className="mt-1 text-xs font-bold text-[var(--soil)]">{groupEvents.length} 条事线 · {activeCount ? `${activeCount} 条进行中` : "暂未进行"}</p></div></div>
              {latest && <div className="mt-4 border-t-2 border-dashed border-[var(--line)] pt-3"><p className="text-xs font-bold text-[var(--sage)]">最近记录 · {relativeUpdate(latest.updated_at)}</p><p className="mt-1 truncate text-sm font-bold text-[var(--ink)]">{latest.icon ? `${latest.icon} ` : ""}{latest.title}</p></div>}
            </Link>)}
          </div>
        </section>
        {ungrouped.length > 0 && <section className="mt-8"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><PixelIcon className="size-5 text-[var(--sage)]" name="journal" /><h2 className="pixel-title text-xl">尚未分组</h2></div><span className="pixel-chip">{ungrouped.length} 条</span></div><Link className="pixel-card pixel-card-hover mt-4 block p-4" href="/events?collection=none"><p className="text-sm font-bold text-[var(--soil)]">还没有放进分类的事线</p><p className="mt-2 truncate text-sm text-[var(--ink)]">{ungrouped[0].icon ? `${ungrouped[0].icon} ` : ""}{ungrouped[0].title}</p></Link></section>}
      </> : <div className="mt-8"><PixelEmptyState icon="briefcase" title="项目书架还是空的。">新建或编辑事线时填写“分类”，它就会自动成为一个项目分组。<Link className="pixel-button pixel-button-primary mt-5 min-h-11 px-4 text-sm" href="/events/new"><PixelIcon className="size-4" name="plus" />新建事线</Link></PixelEmptyState></div>}
      <BottomNav />
    </PageShell>
  );
}
