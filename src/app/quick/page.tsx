import Link from "next/link";
import { redirect } from "next/navigation";
import { QuickNodeForm } from "@/components/timeline/quick-node-form";
import { PageShell, PixelEmptyState, PixelIcon } from "@/components/ui/pixel";
import { getEvents } from "@/lib/events/queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function QuickCapturePage({ searchParams }: { searchParams: Promise<{ event?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [events, params] = await Promise.all([getEvents(), searchParams]);
  const defaultEventId = events.some((event) => event.id === params.event) ? params.event : undefined;
  return <PageShell><Link className="text-sm font-bold text-[var(--forest)] underline underline-offset-4" href="/events">← 返回事件</Link><div className="mt-5 flex items-center gap-2"><PixelIcon className="size-6 text-[var(--sage)]" name="plus" /><p className="pixel-eyebrow">QUICK CAPTURE</p></div><h1 className="pixel-title mt-3 text-3xl">快速记下这一刻</h1><p className="mt-3 text-base leading-7 text-[var(--soil)]">先留住最重要的变化，之后再慢慢补充细节。</p>{events.length ? <QuickNodeForm defaultEventId={defaultEventId} events={events} /> : <div className="mt-7"><PixelEmptyState icon="sprout" title="还没有可记录的事线。">先创建一条事件线，再回来记下第一个节点。<Link className="pixel-button pixel-button-primary mt-5 min-h-11 px-4 text-sm" href="/events/new"><PixelIcon className="size-4" name="plus" />新建事件</Link></PixelEmptyState></div>}</PageShell>;
}
