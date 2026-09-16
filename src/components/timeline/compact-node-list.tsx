import Link from "next/link";
import type { TimelineNode } from "@/lib/timeline/types";
import { PixelIcon } from "@/components/ui/pixel";
import { nodeGapLabel } from "@/components/timeline/timeline-node";

function dateLabel(date: string, time: string | null) {
  const [year, month, day] = date.slice(0, 10).split("-");
  return `${year}.${month}.${day}${time ? ` ${time.slice(0, 5)}` : ""}`;
}

export function CompactNodeList({ eventId, nodes }: { eventId: string; nodes: TimelineNode[] }) {
  return (
    <ol className="mt-7 divide-y-2 divide-dashed divide-[var(--line)] border-2 border-[var(--line)] bg-[var(--card)]">
      {nodes.map((node, index) => (
        <li data-timeline-node key={node.id}>
          {index > 0 && nodeGapLabel(nodes[index - 1], node) && <p className="border-b-2 border-dashed border-[var(--line)] px-4 py-2 text-xs font-bold text-[var(--soil)]"><span className="inline-flex items-center gap-1"><PixelIcon className="size-3" name="hourglass" />{nodeGapLabel(nodes[index - 1], node)}</span></p>}
          <Link className="flex min-h-18 items-center gap-3 px-4 py-3 hover:bg-[var(--paper-deep)]" href={`/events/${eventId}#node-${node.id}`}>
            <span className="w-24 shrink-0 font-mono text-xs font-bold text-[var(--soil)] sm:w-32">{dateLabel(node.event_date, node.event_time)}</span>
            <span className="min-w-0 flex-1"><span className="flex items-center gap-1.5 font-bold text-[var(--ink)]">{node.is_important && <PixelIcon className="size-3.5 shrink-0 text-[#a97d30]" name="star" />}{node.title}</span>{node.content && <span className="mt-1 block truncate text-sm text-[var(--soil)]">{node.content}</span>}</span>
            <span aria-hidden className="text-lg text-[var(--sage)]">›</span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
