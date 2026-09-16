import Link from "next/link";
import { archiveEvent, setEventPinned } from "@/lib/events/actions";
import { EVENT_STATUS_LABELS, type EventSummary } from "@/lib/events/types";
import { PixelIcon, type PixelIconName } from "@/components/ui/pixel";

const statusVisual: Record<EventSummary["status"], { icon: PixelIconName; className: string }> = {
  active: { icon: "sprout", className: "bg-[#e6f0dd] text-[#416b49]" },
  paused: { icon: "hourglass", className: "bg-[#f9e7bd] text-[#805d24]" },
  completed: { icon: "wheat", className: "bg-[#e9dfbd] text-[#6d5d23]" },
  archived: { icon: "archive", className: "bg-[#eadfd1] text-[#705846]" },
};

function dateLabel(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${year}年${Number(month)}月${Number(day)}日`;
}

export function EventCard({ event, batchFormId }: { event: EventSummary; batchFormId?: string }) {
  const nodeCount = event.event_nodes?.[0]?.count ?? 0;
  const status = statusVisual[event.status];
  const tags = event.event_tags.flatMap(({ tag }) => (tag ? [tag.name] : [])).slice(0, 3);
  return (
    <article className="event-card pixel-card pixel-card-hover p-4 sm:p-5">
      <span aria-hidden className="event-card-tab">{event.is_pinned ? "置顶" : EVENT_STATUS_LABELS[event.status]}</span>
      <div className="flex items-start gap-3">
        {batchFormId && <label className="mt-1 inline-flex size-6 shrink-0 cursor-pointer items-center justify-center border-2 border-[var(--line)] bg-[var(--paper-deep)]"><input aria-label={`选择 ${event.title}`} className="size-4 accent-[var(--forest)]" form={batchFormId} name="eventIds" type="checkbox" value={event.id} /></label>}
        <Link className="block min-w-0 flex-1 outline-none" href={`/events/${event.id}`}>
        <div className="flex items-start gap-3">
          <span className="event-card-seal grid size-12 shrink-0 place-items-center text-xl text-[var(--forest)]">
            {event.icon || <PixelIcon className="size-6" name={status.icon} />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h2 className="event-card-title pixel-title truncate text-lg sm:text-xl">{event.title}</h2>
              <span className={`pixel-chip shrink-0 ${status.className}`}><PixelIcon className="size-3" name={status.icon} />{EVENT_STATUS_LABELS[event.status]}</span>
            </div>
            {event.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--soil)]">{event.description}</p>}
          </div>
        </div>
        </Link>
      </div>
      <div className="event-card-meta mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 pt-3 text-xs font-medium text-[var(--soil)]">
        <span className="inline-flex items-center gap-1"><PixelIcon className="size-3.5 text-[var(--sage)]" name="calendar" />始于 {dateLabel(event.start_date)}</span>
        <span className="inline-flex items-center gap-1"><PixelIcon className="size-3.5 text-[var(--sage)]" name="journal" />{nodeCount} 个节点</span>
        {event.collection && <span className="pixel-chip" style={{ backgroundColor: `${event.collection.color}26`, color: event.collection.color }}><span className="size-2 rounded-sm border border-current" />{event.collection.name}</span>}
      </div>
      {tags.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{tags.map((tag) => <span className="pixel-chip" key={tag}>{tag}</span>)}</div>}
      {event.status !== "archived" && (
        <div className="mt-4 flex justify-end gap-2">
          <form action={setEventPinned}>
            <input name="id" type="hidden" value={event.id} />
            <input name="isPinned" type="hidden" value={event.is_pinned ? "false" : "true"} />
            <button aria-label={event.is_pinned ? "取消置顶" : "置顶事件"} className={`pixel-button min-h-9 px-3 text-sm ${event.is_pinned ? "border-[#ba8b35] bg-[#f8df96] text-[#6d501b] shadow-[2px_2px_0_#a97d30]" : "pixel-button-secondary"}`} type="submit"><PixelIcon className="size-4" name="star" />{event.is_pinned ? "已置顶" : "置顶"}</button>
          </form>
          <form action={archiveEvent}>
            <input name="id" type="hidden" value={event.id} />
            <button className="pixel-button pixel-button-secondary min-h-9 px-3 text-sm" type="submit"><PixelIcon className="size-4" name="archive" />归档</button>
          </form>
        </div>
      )}
    </article>
  );
}
