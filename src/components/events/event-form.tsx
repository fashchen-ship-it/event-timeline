"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createEvent, updateEvent } from "@/lib/events/actions";
import { EVENT_STATUSES, EVENT_STATUS_LABELS, type EditableEvent, type EventCollection } from "@/lib/events/types";
import type { EventActionState } from "@/lib/events/schema";

type EventFormProps = { event?: EditableEvent; collections?: EventCollection[] };
const initialState: EventActionState = {};

export function EventForm({ event, collections = [] }: EventFormProps) {
  const action = event ? updateEvent : createEvent;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const tags = event?.tags.flatMap(({ tag }) => (tag ? [tag.name] : [])).join(",") ?? "";

  return (
    <form action={formAction} className="pixel-paper mt-7 space-y-6 p-4 sm:p-6" noValidate>
      {event && <input name="id" type="hidden" value={event.id} />}
      <div>
        <label className="pixel-label" htmlFor="title">事件名称</label>
        <input className="pixel-input text-base" defaultValue={event?.title} id="title" maxLength={120} name="title" required />
        {state.fieldErrors?.title && <p className="mt-2 text-sm text-[#a94e43]">{state.fieldErrors.title}</p>}
      </div>
      <div>
        <label className="pixel-label" htmlFor="description">简短描述 <span className="font-normal text-[var(--soil)]/70">（选填）</span></label>
        <textarea className="pixel-textarea text-base" defaultValue={event?.description ?? ""} id="description" maxLength={1000} name="description" />
        {state.fieldErrors?.description && <p className="mt-2 text-sm text-[#a94e43]">{state.fieldErrors.description}</p>}
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="pixel-label" htmlFor="startDate">开始日期</label>
          <input className="pixel-input text-base" defaultValue={event?.start_date ?? new Date().toISOString().slice(0, 10)} id="startDate" name="startDate" type="date" required />
          {state.fieldErrors?.startDate && <p className="mt-2 text-sm text-[#a94e43]">{state.fieldErrors.startDate}</p>}
        </div>
        <div>
          <label className="pixel-label" htmlFor="status">当前状态</label>
          <select className="pixel-select text-base" defaultValue={event?.status ?? "active"} id="status" name="status">
            {EVENT_STATUSES.filter((status) => status !== "archived").map((status) => <option key={status} value={status}>{EVENT_STATUS_LABELS[status]}</option>)}
            {event?.status === "archived" && <option value="archived">已归档</option>}
          </select>
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-[120px_1fr]">
        <div>
          <label className="pixel-label" htmlFor="icon">图标 <span className="font-normal text-[var(--soil)]/70">（选填）</span></label>
          <input className="pixel-input text-center text-xl" defaultValue={event?.icon ?? ""} id="icon" maxLength={16} name="icon" placeholder="✦" />
          {state.fieldErrors?.icon && <p className="mt-2 text-sm text-[#a94e43]">{state.fieldErrors.icon}</p>}
        </div>
        <div>
          <label className="pixel-label" htmlFor="collection">分类 <span className="font-normal text-[var(--soil)]/70">（选填）</span></label>
          <input className="pixel-input text-base" defaultValue={event?.collection?.name ?? ""} id="collection" list="event-collections" maxLength={30} name="collection" placeholder="例如：工作、健康或家人" />
          {collections.length > 0 && <datalist id="event-collections">{collections.map((collection) => <option key={collection.id} value={collection.name} />)}</datalist>}
          {state.fieldErrors?.collection && <p className="mt-2 text-sm text-[#a94e43]">{state.fieldErrors.collection}</p>}
          <p className="mt-2 text-xs leading-5 text-[var(--soil)]/75">输入新名称会自动创建分类；也可以从已有分类中选择。</p>
        </div>
      </div>
      <div>
        <label className="pixel-label" htmlFor="tags">标签 <span className="font-normal text-[var(--soil)]/70">（选填，用逗号分隔）</span></label>
        <input className="pixel-input text-base" defaultValue={tags} id="tags" maxLength={400} name="tags" placeholder="例如：工作，重要" />
        {state.fieldErrors?.tags && <p className="mt-2 text-sm text-[#a94e43]">{state.fieldErrors.tags}</p>}
      </div>
      {state.error && <p className="rounded-md border-2 border-[#b86950] bg-[#fff1e9] px-3 py-2 text-sm leading-6 text-[#8c3e35]">{state.error}</p>}
      <div className="flex gap-3 pt-2">
        <Link className="pixel-button pixel-button-secondary flex-1 text-base" href="/events">取消</Link>
        <button className="pixel-button pixel-button-primary flex-1 text-base disabled:cursor-not-allowed disabled:opacity-60" disabled={isPending} type="submit">{isPending ? "正在保存…" : "保存事件"}</button>
      </div>
    </form>
  );
}
