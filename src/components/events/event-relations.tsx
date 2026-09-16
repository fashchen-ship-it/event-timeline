"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createEventReference, deleteEventReference, type ReferenceActionState } from "@/lib/events/actions";
import { EVENT_STATUS_LABELS, type EventReference } from "@/lib/events/types";
import { PixelIcon } from "@/components/ui/pixel";

type ReferenceTarget = { id: string; title: string };
type EventRelationsProps = {
  eventId: string;
  targets: ReferenceTarget[];
  outgoing: EventReference[];
  incoming: EventReference[];
};

const initialState: ReferenceActionState = {};

function relativeUpdate(value: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 1) return "刚刚更新";
  if (minutes < 60) return `${minutes} 分钟前更新`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前更新`;
  return `${Math.floor(hours / 24)} 天前更新`;
}

function nodeDateLabel(date: string, time: string | null) {
  const [, month, day] = date.split("-");
  return `${Number(month)} 月 ${Number(day)} 日${time ? ` ${time.slice(0, 5)}` : ""}`;
}

function RelationList({ eventId, relations, direction }: { eventId: string; relations: EventReference[]; direction: "outgoing" | "incoming" }) {
  if (!relations.length) return null;
  return (
    <ul className="mt-3 space-y-2">
      {relations.map((relation) => (
        <li className="flex items-start gap-3 border-t border-dashed border-[var(--line)] pt-3 first:border-t-0 first:pt-0" key={relation.id}>
          <PixelIcon className="mt-0.5 size-4 shrink-0 text-[var(--sage)]" name={direction === "outgoing" ? "link" : "journal"} />
          <div className="min-w-0 flex-1">
            <Link className="font-bold text-[var(--forest)] underline underline-offset-4" href={`/events/${relation.event_id}`}>{relation.event_title}</Link>
            {relation.note && <p className="mt-1 text-sm leading-6 text-[var(--soil)]">{relation.note}</p>}
          </div>
          {direction === "outgoing" && <form action={deleteEventReference}><input name="sourceEventId" type="hidden" value={eventId} /><input name="referenceId" type="hidden" value={relation.id} /><button aria-label={`删除与 ${relation.event_title} 的关联`} className="text-xs font-bold text-[var(--brick)] underline underline-offset-2" type="submit">删除</button></form>}
        </li>
      ))}
    </ul>
  );
}

function RelatedProjectCards({ eventId, relations }: { eventId: string; relations: EventReference[] }) {
  if (!relations.length) return null;
  return <div className="mt-3 grid gap-3 sm:grid-cols-2">{relations.map((relation) => <article className="pixel-card p-4" key={relation.id}>
    <Link className="block" href={`/events/${relation.event_id}`}><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center border-2 border-[var(--line)] bg-[var(--paper-deep)] text-lg text-[var(--forest)]">{relation.event_icon || <PixelIcon className="size-5" name="briefcase" />}</span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><h4 className="pixel-title truncate text-base">{relation.event_title}</h4><PixelIcon className="mt-0.5 size-4 shrink-0 text-[var(--soil)]" name="link" /></div><p className="mt-1 text-xs font-bold text-[var(--forest)]">{EVENT_STATUS_LABELS[relation.event_status]} · {relativeUpdate(relation.event_updated_at)}</p></div></div><div className="mt-3 flex flex-wrap gap-2 border-t-2 border-dashed border-[var(--line)] pt-3 text-xs font-bold text-[var(--soil)]"><span>开始于 {relation.event_start_date}</span><span>{relation.node_count} 个节点</span></div>{relation.note && <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--soil)]">{relation.note}</p>}</Link>
    {relation.recent_nodes.length > 0 && <details className="mt-3 border-t border-dashed border-[var(--line)] pt-3"><summary className="cursor-pointer text-sm font-bold text-[var(--forest)]">展开最近节点（{relation.recent_nodes.length}）</summary><ol className="mt-3 space-y-2">{relation.recent_nodes.map((node) => <li key={node.id}><Link className="block rounded border border-[var(--line)] bg-[var(--paper-deep)] px-3 py-2 hover:bg-[var(--wheat-light)]" href={`/events/${relation.event_id}#node-${node.id}`}><p className="text-xs font-bold text-[var(--sage)]">{nodeDateLabel(node.event_date, node.event_time)}{node.is_important && " · 重要"}</p><p className="mt-1 truncate text-sm font-bold text-[var(--ink)]">{node.title}</p></Link></li>)}</ol></details>}
    <form action={deleteEventReference} className="mt-3"><input name="sourceEventId" type="hidden" value={relation.event_id} /><input name="referenceId" type="hidden" value={relation.id} /><input name="returnEventId" type="hidden" value={eventId} /><button aria-label={`移除项目 ${relation.event_title}`} className="text-xs font-bold text-[var(--brick)] underline underline-offset-2" type="submit">移除关联</button></form>
  </article>)}</div>;
}

export function EventRelations({ eventId, targets, outgoing, incoming }: EventRelationsProps) {
  const [state, formAction, isPending] = useActionState(createEventReference, initialState);
  return (
    <section className="pixel-paper mt-8 p-5 sm:p-6">
      <div className="flex items-center gap-2"><PixelIcon className="size-5 text-[var(--sage)]" name="link" /><h2 className="pixel-title text-xl">关联事线</h2></div>
      <p className="mt-2 text-sm leading-6 text-[var(--soil)]">把有关联的事串在一起，之后可以从这里来回查看。若要把项目放进总事线，请在项目里选择总事线。</p>

      {targets.length > 0 ? (
        <form action={formAction} className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <input name="sourceEventId" type="hidden" value={eventId} />
          <select aria-label="选择要关联的事件" className="pixel-select text-base" defaultValue="" name="targetEventId" required>
            <option disabled value="">选择另一件事线</option>
            {targets.map((target) => <option key={target.id} value={target.id}>{target.title}</option>)}
          </select>
          <input className="pixel-input text-base" maxLength={300} name="note" placeholder="关联说明（选填）" />
          <button className="pixel-button pixel-button-primary min-h-12 px-4 text-base disabled:opacity-60" disabled={isPending} type="submit">{isPending ? "正在关联…" : "添加关联"}</button>
        </form>
      ) : <p className="pixel-empty mt-5 text-sm text-[var(--soil)]">先创建另一件未归档的事线，才能把它关联到这里。</p>}
      {(state.error || state.success) && <p className={`mt-3 text-sm ${state.error ? "text-[var(--brick)]" : "text-[var(--forest)]"}`}>{state.error ?? state.success}</p>}

      {outgoing.length > 0 && <div className="mt-6"><h3 className="text-sm font-bold text-[var(--ink)]">这件事关联到</h3><RelationList direction="outgoing" eventId={eventId} relations={outgoing} /></div>}
      {incoming.length > 0 && <div className="mt-6"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-bold text-[var(--ink)]">关联项目</h3><span className="pixel-chip">{incoming.length} 项</span></div><p className="mt-2 text-sm leading-6 text-[var(--soil)]">这些事线把当前事线作为共同的总线；点开卡片即可查看各自完整记录。</p><div className="mt-3 grid grid-cols-3 gap-2"><span className="pixel-chip justify-center">{incoming.filter((relation) => relation.event_status === "active").length} 进行中</span><span className="pixel-chip justify-center">{incoming.filter((relation) => relation.event_status === "paused").length} 已暂停</span><span className="pixel-chip justify-center">{incoming.reduce((total, relation) => total + relation.node_count, 0)} 个节点</span></div><RelatedProjectCards eventId={eventId} relations={incoming} /></div>}
    </section>
  );
}
