export const EVENT_STATUSES = ["active", "paused", "completed", "archived"] as const;

export const EVENT_ICON_OPTIONS = ["◈", "✦", "◆", "◉", "▣", "✚", "☀", "☾", "✿", "⚑"] as const;

/** Keeps automatically assigned icons stable instead of changing whenever an event is edited. */
export function defaultEventIcon(seed: string) {
  const total = [...seed].reduce((sum, character) => sum + character.codePointAt(0)!, 0);
  return EVENT_ICON_OPTIONS[total % EVENT_ICON_OPTIONS.length];
}

export type EventStatus = (typeof EVENT_STATUSES)[number];

export type EventCollection = {
  id: string;
  name: string;
  color: string;
  is_favorite?: boolean;
  position?: number;
};

export type EventReference = {
  id: string;
  event_id: string;
  event_title: string;
  note: string | null;
  event_status: EventStatus;
  event_start_date: string;
  event_icon: string | null;
  event_updated_at: string;
  node_count: number;
  recent_nodes: { id: string; title: string; event_date: string; event_time: string | null; is_important: boolean }[];
  timeline_nodes: { id: string; title: string; event_date: string; event_time: string | null; is_important: boolean }[];
};

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  active: "进行中",
  paused: "已暂停",
  completed: "已完成",
  archived: "已归档",
};

export type EventSummary = {
  id: string;
  title: string;
  description: string | null;
  status: EventStatus;
  start_date: string;
  icon: string | null;
  updated_at: string;
  is_pinned: boolean;
  collection_id: string | null;
  collection: EventCollection | null;
  event_nodes: { count: number }[];
  event_tags: { tag: { id: string; name: string } | null }[];
};

export type ProjectEventSummary = Pick<EventSummary, "id" | "title" | "status" | "icon" | "updated_at" | "collection_id">;

export type EditableEvent = Pick<
  EventSummary,
  "id" | "title" | "description" | "status" | "start_date" | "icon" | "collection_id" | "collection"
> & {
  tags: { tag: { id: string; name: string } | null }[];
};
