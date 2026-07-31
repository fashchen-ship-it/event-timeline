export const EVENT_STATUSES = ["active", "paused", "completed", "archived"] as const;

export type EventStatus = (typeof EVENT_STATUSES)[number];

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
  event_nodes: { count: number }[];
};

export type EditableEvent = Pick<
  EventSummary,
  "id" | "title" | "description" | "status" | "start_date" | "icon"
> & {
  tags: { tag: { id: string; name: string } | null }[];
};
