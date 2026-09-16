import Link from "next/link";
import { restoreEvent } from "@/lib/events/actions";
import { DeleteEventButton } from "@/components/events/delete-event-button";
import type { EventSummary } from "@/lib/events/types";
import { PixelIcon } from "@/components/ui/pixel";

export function ArchiveCard({ event }: { event: EventSummary }) {
  const tags = event.event_tags.flatMap(({ tag }) => (tag ? [tag.name] : [])).slice(0, 3);
  return (
    <article className="pixel-card p-4 sm:p-5">
      <Link className="block outline-none" href={`/events/${event.id}`}>
        <div className="flex items-start gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-md border-2 border-[var(--soil)] bg-[var(--paper-deep)] text-xl text-[var(--soil)] shadow-[2px_2px_0_var(--line)]">{event.icon || <PixelIcon className="size-6" name="archive" />}</span>
          <div className="min-w-0"><h2 className="pixel-title truncate text-lg sm:text-xl">{event.title}</h2>{event.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--soil)]">{event.description}</p>}</div>
        </div>
      </Link>
      {tags.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{tags.map((tag) => <span className="pixel-chip" key={tag}>{tag}</span>)}</div>}
      <div className="mt-5 flex flex-wrap gap-3 border-t-2 border-dashed border-[var(--line)] pt-4">
        <form action={restoreEvent} className="flex min-h-11 items-center gap-2">
          <input name="id" type="hidden" value={event.id} />
          <select className="pixel-select min-h-11 w-auto max-w-44 text-sm" defaultValue="active" name="status"><option value="active">恢复为进行中</option><option value="paused">恢复为已暂停</option><option value="completed">恢复为已完成</option></select>
          <button className="pixel-button pixel-button-primary text-sm" type="submit">恢复</button>
        </form>
        <DeleteEventButton id={event.id} />
      </div>
    </article>
  );
}
