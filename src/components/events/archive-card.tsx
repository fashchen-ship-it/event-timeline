import Link from "next/link";
import { restoreEvent } from "@/lib/events/actions";
import { DeleteEventButton } from "@/components/events/delete-event-button";
import type { EventSummary } from "@/lib/events/types";

export function ArchiveCard({ event }: { event: EventSummary }) {
  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-5">
      <Link className="block rounded-xl outline-none focus:ring-2 focus:ring-stone-300" href={`/events/${event.id}`}>
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-xl">{event.icon || "·"}</span>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-stone-900">{event.title}</h2>
            {event.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-600">{event.description}</p>}
          </div>
        </div>
      </Link>
      <div className="mt-5 flex flex-wrap gap-3 border-t border-stone-100 pt-4">
        <form action={restoreEvent} className="flex min-h-11 items-center gap-2 rounded-xl border border-stone-300 px-3">
          <input name="id" type="hidden" value={event.id} />
          <select className="bg-transparent text-sm text-stone-700 outline-none" defaultValue="active" name="status">
            <option value="active">恢复为进行中</option>
            <option value="paused">恢复为已暂停</option>
            <option value="completed">恢复为已完成</option>
          </select>
          <button className="text-sm font-medium text-stone-800" type="submit">恢复</button>
        </form>
        <DeleteEventButton id={event.id} />
      </div>
    </article>
  );
}
