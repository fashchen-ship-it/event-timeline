"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createEventReference, deleteEventReference, type ReferenceActionState } from "@/lib/events/actions";
import type { EventReference } from "@/lib/events/types";
import { PixelIcon } from "@/components/ui/pixel";

type ReferenceTarget = { id: string; title: string };
type EventRelationsProps = {
  eventId: string;
  targets: ReferenceTarget[];
  outgoing: EventReference[];
  incoming: EventReference[];
};

const initialState: ReferenceActionState = {};

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

export function EventRelations({ eventId, targets, outgoing, incoming }: EventRelationsProps) {
  const [state, formAction, isPending] = useActionState(createEventReference, initialState);
  return (
    <section className="pixel-paper mt-8 p-5 sm:p-6">
      <div className="flex items-center gap-2"><PixelIcon className="size-5 text-[var(--sage)]" name="link" /><h2 className="pixel-title text-xl">关联事线</h2></div>
      <p className="mt-2 text-sm leading-6 text-[var(--soil)]">把有关联的事串在一起，之后可以从这里来回查看。</p>

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
      {incoming.length > 0 && <div className="mt-6"><h3 className="text-sm font-bold text-[var(--ink)]">也被这些事关联</h3><RelationList direction="incoming" eventId={eventId} relations={incoming} /></div>}
    </section>
  );
}
