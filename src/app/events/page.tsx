import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/lib/auth/actions";
import { EventCard } from "@/components/events/event-card";
import { BottomNav } from "@/components/layout/bottom-nav";
import { getEvents } from "@/lib/events/queries";
import { createClient } from "@/lib/supabase/server";

// The current user is read from request cookies, so this page must render per request.
export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const events = await getEvents();
  const activeEvents = events.filter((event) => event.status === "active");
  const otherEvents = events.filter((event) => event.status !== "active");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-5 py-8 pb-28 sm:px-8">
      <header className="flex items-start justify-between gap-5 border-b border-stone-200 pb-6">
        <div>
          <p className="text-sm font-medium tracking-[0.18em] text-stone-500">EVENT TIMELINE</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900">事件</h1>
        </div>
        <form action={signOut}>
          <button className="min-h-11 rounded-xl border border-stone-300 px-4 text-sm font-medium text-stone-700 transition hover:bg-stone-100" type="submit">
          退出登录
          </button>
        </form>
      </header>
      <form action="/search" className="mt-6 flex gap-2">
        <input aria-label="搜索事件和节点" className="h-12 min-w-0 flex-1 rounded-xl border border-stone-300 bg-white px-4 text-base outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200" name="q" placeholder="搜索事件、节点或标签" type="search" />
        <button className="rounded-xl bg-stone-800 px-4 text-sm font-medium text-white hover:bg-stone-700" type="submit">搜索</button>
      </form>
      {!events.length ? (
        <section className="mt-10 rounded-3xl border border-dashed border-stone-300 bg-white/70 p-8 text-center sm:p-12">
          <p className="text-base leading-7 text-stone-700">还没有正在发生的事，创建一条事件线吧。</p>
          <p className="mt-3 text-sm text-stone-500">当前账号：{user.email}</p>
        </section>
      ) : (
        <div className="mt-8 space-y-9">
          <section>
            <h2 className="text-sm font-medium tracking-[0.12em] text-stone-500">正在进行</h2>
            {activeEvents.length ? (
              <div className="mt-4 space-y-4">{activeEvents.map((event) => <EventCard event={event} key={event.id} />)}</div>
            ) : (
              <p className="mt-4 rounded-2xl bg-white/70 p-5 text-sm leading-6 text-stone-500">暂时没有进行中的事件。</p>
            )}
          </section>
          {otherEvents.length > 0 && (
            <section>
              <h2 className="text-sm font-medium tracking-[0.12em] text-stone-500">其他事件</h2>
              <div className="mt-4 space-y-4">{otherEvents.map((event) => <EventCard event={event} key={event.id} />)}</div>
            </section>
          )}
        </div>
      )}
      <Link aria-label="新建事件" className="fixed bottom-22 right-5 z-30 flex size-14 items-center justify-center rounded-full bg-stone-800 text-3xl font-light text-white shadow-[0_8px_24px_rgba(41,39,34,0.28)] transition hover:bg-stone-700 focus:outline-none focus:ring-4 focus:ring-stone-300 sm:bottom-8 sm:right-8" href="/events/new">
        +
      </Link>
      <BottomNav />
    </main>
  );
}
