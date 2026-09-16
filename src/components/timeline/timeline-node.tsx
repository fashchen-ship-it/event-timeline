/* eslint-disable @next/next/no-img-element -- private Supabase signed URLs should not be routed through the public image optimizer. */
import Link from "next/link";
import type { TimelineNode } from "@/lib/timeline/types";
import { PixelIcon } from "@/components/ui/pixel";

function dateLabel(date: string, time: string | null) {
  const [year, month, day] = date.slice(0, 10).split("-");
  return `${year}年${Number(month)}月${Number(day)}日${time ? ` ${time.slice(0, 5)}` : ""}`;
}

export function TimelineNodeCard({ eventId, node }: { eventId: string; node: TimelineNode }) {
  const tags = node.node_tags.flatMap(({ tag }) => (tag ? [tag.name] : []));
  const images = node.attachments.filter((attachment) => attachment.file_type.startsWith("image/") && attachment.signed_url);
  const files = node.attachments.filter((attachment) => !attachment.file_type.startsWith("image/") && attachment.signed_url);
  const longContent = (node.content?.length ?? 0) > 220;
  const checklist = [...node.node_checklist_items].sort((a, b) => a.position - b.position);
  const completedCount = checklist.filter((item) => item.is_completed).length;

  return (
    <li className="relative pl-9 sm:pl-11" data-timeline-node>
      <span className={`pixel-node-marker ${node.is_important ? "pixel-node-marker-important" : ""}`}>{node.is_important && <PixelIcon className="size-3 text-[#fff9ed]" name="star" />}</span>
      <article className={`pixel-card p-4 sm:p-5 ${node.is_important ? "border-[var(--brick)] bg-[#fff6e6]" : ""}`} id={`node-${node.id}`}>
        <div className="flex items-start justify-between gap-4"><div><p className="pixel-eyebrow flex items-center gap-1.5"><PixelIcon className="size-3.5" name="calendar" />{dateLabel(node.event_date, node.event_time)}</p><h2 className="pixel-title mt-2 text-lg sm:text-xl">{node.title}</h2></div><Link aria-label="编辑节点" className="pixel-button pixel-button-secondary min-h-9 shrink-0 px-2.5 text-sm" href={`/events/${eventId}/nodes/${node.id}/edit`}><PixelIcon className="size-4" name="edit" />编辑</Link></div>
        {node.is_important && <p className="pixel-chip mt-3 bg-[#f7d88b] text-[#7d5321]"><PixelIcon className="size-3" name="star" />重要节点</p>}
        {node.content && <div className="mt-4 text-base leading-7 text-[var(--soil)]">{longContent ? <details><summary className="cursor-pointer font-bold text-[var(--forest)]">展开详细内容</summary><p className="mt-3 whitespace-pre-wrap">{node.content}</p></details> : <p className="whitespace-pre-wrap">{node.content}</p>}</div>}
        {node.references.length > 0 && <div className="mt-5 space-y-2">{node.references.map((reference) => <Link className="flex items-start gap-2 border-2 border-[var(--line)] bg-[var(--paper-deep)] px-3 py-2 text-sm text-[var(--soil)] hover:bg-[#f5ecd6]" href={`/events/${reference.target_event_id}#node-${reference.target_node_id}`} key={reference.id}><PixelIcon className="mt-0.5 size-4 shrink-0 text-[var(--sage)]" name="link" /><span><span className="font-bold text-[var(--forest)]">关联节点：{reference.target_title}</span>{reference.note && <span className="mt-1 block leading-5">{reference.note}</span>}</span></Link>)}</div>}
        {checklist.length > 0 && <section className="mt-5 border-2 border-dashed border-[var(--line)] bg-[var(--paper-deep)] p-3"><p className="flex items-center gap-2 text-sm font-bold text-[var(--forest)]"><PixelIcon className="size-4" name="journal" />节点清单 <span className="font-normal text-[var(--soil)]">{completedCount}/{checklist.length}</span></p><ul className="mt-3 space-y-2">{checklist.map((item) => <li className="flex gap-2 text-sm leading-6 text-[var(--soil)]" key={item.id}><span className={`mt-1 grid size-4 shrink-0 place-items-center border-2 ${item.is_completed ? "border-[var(--forest)] bg-[var(--sage)] text-white" : "border-[var(--line)] bg-[var(--card)]"}`}>{item.is_completed && "✓"}</span><span className={item.is_completed ? "text-[var(--soil)]/60 line-through" : ""}>{item.content}</span></li>)}</ul></section>}
        {images.length > 0 && <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">{images.map((image) => <a className="pixel-photo-frame" href={image.signed_url} key={image.id} rel="noreferrer" target="_blank"><img alt={image.file_name} className="aspect-square size-full object-cover" src={image.signed_url} /></a>)}</div>}
        {files.length > 0 && <div className="mt-5 space-y-2">{files.map((file) => <a className="flex min-h-11 items-center justify-between gap-3 rounded-md border-2 border-[var(--line)] bg-[var(--paper-deep)] px-3 text-sm font-medium text-[var(--soil)] hover:bg-[var(--wheat-light)]" download={file.file_name} href={file.signed_url} key={file.id}><span className="flex min-w-0 items-center gap-2 truncate"><PixelIcon className="size-4 shrink-0" name="file" />{file.file_name}</span><span className="shrink-0">下载</span></a>)}</div>}
        {node.link_url && <a className="mt-5 flex truncate text-sm font-bold text-[var(--forest)] underline underline-offset-4" href={node.link_url} rel="noreferrer" target="_blank"><PixelIcon className="mr-1.5 size-4 shrink-0" name="link" />{node.link_url}</a>}
        {tags.length > 0 && <div className="mt-5 flex flex-wrap gap-2">{tags.map((tag) => <span className="pixel-chip" key={tag}>{tag}</span>)}</div>}
      </article>
    </li>
  );
}
