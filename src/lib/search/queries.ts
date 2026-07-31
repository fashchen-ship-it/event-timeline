import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { EVENT_STATUSES, type EventStatus } from "@/lib/events/types";

const searchSchema = z.object({
  q: z.string().trim().max(120).optional().catch(""),
  status: z.enum(EVENT_STATUSES).optional().catch(undefined),
  tag: z.string().trim().max(30).optional().catch(undefined),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().catch(undefined),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().catch(undefined),
  important: z.enum(["1"]).optional().catch(undefined),
});

export type SearchFilters = {
  q: string;
  status?: EventStatus;
  tag?: string;
  from?: string;
  to?: string;
  important?: "1";
};

export type SearchResult = {
  result_type: "event" | "node";
  event_id: string;
  node_id: string | null;
  title: string;
  excerpt: string;
  event_title: string;
  result_date: string;
  is_important: boolean;
};

export function parseSearchFilters(input: Record<string, string | string[] | undefined>): SearchFilters {
  const value = searchSchema.parse({
    q: Array.isArray(input.q) ? input.q[0] : input.q,
    status: Array.isArray(input.status) ? input.status[0] : input.status,
    tag: Array.isArray(input.tag) ? input.tag[0] : input.tag,
    from: Array.isArray(input.from) ? input.from[0] : input.from,
    to: Array.isArray(input.to) ? input.to[0] : input.to,
    important: Array.isArray(input.important) ? input.important[0] : input.important,
  });

  return {
    q: value.q ?? "",
    status: value.status,
    tag: value.tag || undefined,
    from: value.from,
    to: value.to,
    important: value.important,
  };
}

export async function searchTimeline(filters: SearchFilters) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_timeline", {
    p_query: filters.q || null,
    p_status: filters.status ?? null,
    p_tag: filters.tag ?? null,
    p_date_from: filters.from ?? null,
    p_date_to: filters.to ?? null,
    p_important: filters.important === "1" ? true : null,
  });

  if (error) throw new Error("搜索暂时不可用，请稍后重试。");
  return (data ?? []) as SearchResult[];
}
