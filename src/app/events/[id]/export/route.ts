import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function escapeCsv(value: string | number | boolean | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function fileName(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, "_").slice(0, 80) || "event-timeline";
}

function tagNames(links: { tag: { name: string } | { name: string }[] | null }[]) {
  return links.flatMap(({ tag }) => Array.isArray(tag) ? tag.map((item) => item.name) : tag ? [tag.name] : []);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, title, description, status, start_date, created_at, updated_at, event_tags(tag:tags(name))")
    .eq("id", id)
    .single();
  if (eventError || !event) return new Response("未找到该事件。", { status: 404 });

  const { data: nodes, error: nodesError } = await supabase
    .from("event_nodes")
    .select("id, title, content, event_date, event_time, is_important, link_url, created_at, updated_at, node_tags(tag:tags(name))")
    .eq("event_id", id)
    .order("event_date")
    .order("event_time", { nullsFirst: false });
  if (nodesError) return new Response("读取节点失败。", { status: 500 });

  const format = request.nextUrl.searchParams.get("format") === "json" ? "json" : "csv";
  const safeName = fileName(event.title);
  if (format === "json") {
    const payload = {
      exported_at: new Date().toISOString(),
      event: {
        ...event,
        tags: tagNames(event.event_tags),
      },
      nodes: (nodes ?? []).map((node) => ({
        ...node,
        tags: tagNames(node.node_tags),
      })),
    };
    return new Response(JSON.stringify(payload, null, 2), { headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="${safeName}.json"` } });
  }

  const rows = [
    ["事件名称", "事件描述", "状态", "开始日期", "事件标签", "节点日期", "节点时间", "节点标题", "节点内容", "重要节点", "网页链接", "节点标签"],
    ...(nodes ?? []).map((node) => [
      event.title,
      event.description,
      event.status,
      event.start_date,
      tagNames(event.event_tags).join("，"),
      node.event_date,
      node.event_time,
      node.title,
      node.content,
      node.is_important ? "是" : "否",
      node.link_url,
      tagNames(node.node_tags).join("，"),
    ]),
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n")}`;
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${safeName}.csv"` } });
}
