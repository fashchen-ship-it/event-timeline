import Link from "next/link";
import { ArchiveCard } from "@/components/events/archive-card";
import { BottomNav } from "@/components/layout/bottom-nav";
import { getArchivedEvents } from "@/lib/events/queries";

export const dynamic = "force-dynamic";

export default async function ArchivePage() {
  const events = await getArchivedEvents();

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-5 py-8 pb-28 sm:px-8">
      <header className="flex items-end justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <p className="text-sm font-medium tracking-[0.18em] text-stone-500">ARCHIVE</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900">归档</h1>
        </div>
        <Link className="text-sm font-medium text-stone-600 underline underline-offset-4" href="/events">返回事件</Link>
      </header>
      {events.length ? (
        <div className="mt-7 space-y-4">{events.map((event) => <ArchiveCard event={event} key={event.id} />)}</div>
      ) : (
        <section className="mt-10 rounded-3xl border border-dashed border-stone-300 bg-white/70 p-8 text-center sm:p-12">
          <p className="text-base leading-7 text-stone-600">暂时没有归档事件。</p>
        </section>
      )}
      <BottomNav />
    </main>
  );
}
