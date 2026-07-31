export type Attachment = {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  signed_url?: string;
};

export type TimelineNode = {
  id: string;
  title: string;
  content: string | null;
  event_date: string;
  event_time: string | null;
  is_important: boolean;
  link_url: string | null;
  created_at: string;
  updated_at: string;
  attachments: Attachment[];
  node_tags: { tag: { id: string; name: string } | null }[];
};

export type EventDetail = {
  id: string;
  title: string;
  description: string | null;
  status: "active" | "paused" | "completed" | "archived";
  start_date: string;
  icon: string | null;
  event_tags: { tag: { id: string; name: string } | null }[];
};

export type EditableNode = Pick<
  TimelineNode,
  "id" | "title" | "content" | "event_date" | "event_time" | "is_important" | "link_url" | "attachments" | "node_tags"
>;
