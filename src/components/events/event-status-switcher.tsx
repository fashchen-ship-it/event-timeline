import { updateEventStatus } from "@/lib/events/actions";
import { EVENT_STATUS_LABELS, type EventStatus } from "@/lib/events/types";
import { PixelIcon } from "@/components/ui/pixel";

type EventStatusSwitcherProps = {
  eventId: string;
  status: EventStatus;
};

const editableStatuses: EventStatus[] = ["active", "paused", "completed"];

export function EventStatusSwitcher({ eventId, status }: EventStatusSwitcherProps) {
  if (status === "archived") {
    return <p className="mt-3 inline-flex min-h-10 items-center gap-2 border-2 border-[var(--line)] bg-[var(--paper-deep)] px-3 text-sm font-bold text-[var(--soil)]"><PixelIcon className="size-4" name="archive" />已归档：请在归档箱中恢复</p>;
  }

  return (
    <form action={updateEventStatus} className="mt-3 flex flex-wrap items-center gap-2">
      <input name="id" type="hidden" value={eventId} />
      <label className="sr-only" htmlFor="event-status">事件状态</label>
      <select className="pixel-select min-h-10 py-2 text-sm" defaultValue={status} id="event-status" name="status">
        {editableStatuses.map((value) => <option key={value} value={value}>{EVENT_STATUS_LABELS[value]}</option>)}
      </select>
      <button className="pixel-button pixel-button-secondary min-h-10 px-3 text-sm" type="submit">
        <PixelIcon className="size-4" name="sprout" />
        更新状态
      </button>
    </form>
  );
}
