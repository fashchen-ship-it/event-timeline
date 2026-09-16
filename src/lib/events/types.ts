export const EVENT_STATUSES = ["active", "paused", "completed", "archived"] as const;

export type EventStatus = (typeof EVENT_STATUSES)[number];

export type EventCollection = {
  id: string;
  name: string;
  color: string;
};

export type EventReference = {
  id: string;
  event_id: string;
  event_title: string;
  note: string | null;
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
