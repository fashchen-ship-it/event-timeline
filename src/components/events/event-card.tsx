import Link from "next/link";
import { archiveEvent } from "@/lib/events/actions";
import { EVENT_STATUS_LABELS, type EventSummary } from "@/lib/events/types";

const statusClass = {
  active: "bg-emerald-50 text-emerald-800",
  paused: "bg-amber-50 text-amber-800",
  completed: "bg-sky-50 text-sky-800",
  archived: "bg-stone-100 text-stone-700",
};

function dateLabel(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${year}年${Number(month)}月${Number(day)}日`;
}

export function EventCard({ event }: { event: EventSummary }) {
  const nodeCount = event.event_nodes?.[0]?.count ?? 0;

  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_4px_18px_rgba(74,61,47,0.04)]">
      <Link className="block rounded-xl outline-none focus:ring-2 focus:ring-stone-300" href={`/events/${event.id}`}>
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-xl">
            {event.icon || "·"}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h2 className="truncate text-lg font-semibold text-stone-900">{event.title}</h2>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusClass[event.status]}`}>
                {EVENT_STATUS_LABELS[event.status]}
              </span>
            </div>
            {event.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-600">{event.description}</p>}
          </div>
        </div>
      </Link>
      <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3 text-xs text-stone-500">
        <span>开始于 {dateLabel(event.start_date)}</span>
        <span>{nodeCount} 个节点</span>
      </div>
      {event.status !== "archived" && (
        <div className="mt-4 flex justify-end">
          <form action={archiveEvent}>
            <input name="id" type="hidden" value={event.id} />
            <button className="min-h-10 rounded-lg px-3 text-sm font-medium text-stone-600 transition hover:bg-stone-100 hover:text-stone-900" type="submit">
              归档
            </button>
          </form>
        </div>
      )}
    </article>
  );
}
