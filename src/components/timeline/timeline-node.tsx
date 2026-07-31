import Link from "next/link";
import type { TimelineNode } from "@/lib/timeline/types";

function dateLabel(date: string, time: string | null) {
  const [year, month, day] = date.slice(0, 10).split("-");
  return `${year}年${Number(month)}月${Number(day)}日${time ? ` ${time.slice(0, 5)}` : ""}`;
}

export function TimelineNodeCard({ eventId, node }: { eventId: string; node: TimelineNode }) {
  const tags = node.node_tags.flatMap(({ tag }) => (tag ? [tag.name] : []));
  const images = node.attachments.filter((attachment) => attachment.file_type.startsWith("image/") && attachment.signed_url);
  const files = node.attachments.filter((attachment) => !attachment.file_type.startsWith("image/") && attachment.signed_url);
  const longContent = (node.content?.length ?? 0) > 220;

  return (
    <li className="relative pl-8 sm:pl-10">
      <span className={`absolute left-0 top-6 flex size-4 -translate-x-[5px] items-center justify-center rounded-full border-4 border-[#f7f6f2] ${node.is_important ? "bg-amber-600" : "bg-stone-400"}`} />
      <article className={`rounded-2xl border p-5 ${node.is_important ? "border-amber-200 bg-amber-50/40" : "border-stone-200 bg-white"}`} id={`node-${node.id}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-stone-500">{dateLabel(node.event_date, node.event_time)}</p>
            <h2 className="mt-2 text-lg font-semibold text-stone-900">{node.title}</h2>
          </div>
          <Link className="shrink-0 rounded-lg px-2 py-1 text-sm font-medium text-stone-600 hover:bg-stone-100" href={`/events/${eventId}/nodes/${node.id}/edit`}>编辑</Link>
        </div>

        {node.is_important && <p className="mt-3 inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">重要节点</p>}
        {node.content && (
          <div className="mt-4 text-base leading-7 text-stone-700">
            {longContent ? (
              <details>
                <summary className="cursor-pointer text-sm font-medium text-stone-600">展开详细内容</summary>
                <p className="mt-3 whitespace-pre-wrap">{node.content}</p>
              </details>
            ) : <p className="whitespace-pre-wrap">{node.content}</p>}
          </div>
        )}

        {images.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {images.map((image) => (
              <a className="overflow-hidden rounded-xl bg-stone-100" href={image.signed_url} key={image.id} rel="noreferrer" target="_blank">
                {/* A direct image link preserves the original file and works on small screens. */}
                <img alt={image.file_name} className="aspect-square size-full object-cover" src={image.signed_url} />
              </a>
            ))}
          </div>
        )}

        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            {files.map((file) => (
              <a className="flex min-h-11 items-center justify-between gap-3 rounded-xl bg-stone-100 px-3 text-sm text-stone-700 hover:bg-stone-200" download={file.file_name} href={file.signed_url} key={file.id}>
                <span className="min-w-0 truncate">{file.file_name}</span>
                <span className="shrink-0 text-stone-500">下载</span>
              </a>
            ))}
          </div>
        )}

        {node.link_url && <a className="mt-4 block truncate text-sm font-medium text-stone-700 underline underline-offset-4" href={node.link_url} rel="noreferrer" target="_blank">{node.link_url}</a>}
        {tags.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{tags.map((tag) => <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-600" key={tag}>{tag}</span>)}</div>}
      </article>
    </li>
  );
}
