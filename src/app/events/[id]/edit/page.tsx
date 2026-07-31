import Link from "next/link";
import { notFound } from "next/navigation";
import { archiveEvent } from "@/lib/events/actions";
import { getEventForEdit } from "@/lib/events/queries";
import { DeleteEventButton } from "@/components/events/delete-event-button";
import { EventForm } from "@/components/events/event-form";

export const dynamic = "force-dynamic";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) notFound();

  const event = await getEventForEdit(id);

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-5 py-8 sm:px-8">
      <Link className="text-sm font-medium text-stone-600 underline underline-offset-4" href="/events">返回事件</Link>
      <h1 className="mt-5 text-3xl font-semibold tracking-tight text-stone-900">编辑事件</h1>
      <EventForm event={event} />
      <section className="mt-10 border-t border-stone-200 pt-7">
        <h2 className="text-base font-semibold text-stone-900">事件管理</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">归档后不会在默认事件列表显示；永久删除会同时删除其下的节点和附件。</p>
        <div className="mt-5 flex flex-wrap gap-3">
          {event.status !== "archived" && (
            <form action={archiveEvent}>
              <input name="id" type="hidden" value={event.id} />
              <button className="min-h-11 rounded-xl border border-stone-300 px-4 text-sm font-medium text-stone-700 transition hover:bg-stone-100" type="submit">归档事件</button>
            </form>
          )}
          <DeleteEventButton id={event.id} />
        </div>
      </section>
    </main>
  );
}
