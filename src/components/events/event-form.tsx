"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createEvent, updateEvent } from "@/lib/events/actions";
import { EVENT_STATUSES, EVENT_STATUS_LABELS, type EditableEvent } from "@/lib/events/types";
import type { EventActionState } from "@/lib/events/schema";

type EventFormProps = {
  event?: EditableEvent;
};

const initialState: EventActionState = {};

export function EventForm({ event }: EventFormProps) {
  const action = event ? updateEvent : createEvent;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const tags = event?.tags.flatMap(({ tag }) => (tag ? [tag.name] : [])).join("，") ?? "";

  return (
    <form action={formAction} className="mt-7 space-y-6" noValidate>
      {event && <input name="id" type="hidden" value={event.id} />}
      <div>
        <label className="mb-2 block text-sm font-medium text-stone-700" htmlFor="title">事件名称</label>
        <input
          className="h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
          defaultValue={event?.title}
          id="title"
          maxLength={120}
          name="title"
          required
        />
        {state.fieldErrors?.title && <p className="mt-2 text-sm text-rose-700">{state.fieldErrors.title}</p>}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-stone-700" htmlFor="description">简短描述 <span className="font-normal text-stone-400">（选填）</span></label>
        <textarea
          className="min-h-28 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-base leading-7 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
          defaultValue={event?.description ?? ""}
          id="description"
          maxLength={1000}
          name="description"
        />
        {state.fieldErrors?.description && <p className="mt-2 text-sm text-rose-700">{state.fieldErrors.description}</p>}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700" htmlFor="startDate">开始日期</label>
          <input
            className="h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
            defaultValue={event?.start_date ?? new Date().toISOString().slice(0, 10)}
            id="startDate"
            name="startDate"
            type="date"
            required
          />
          {state.fieldErrors?.startDate && <p className="mt-2 text-sm text-rose-700">{state.fieldErrors.startDate}</p>}
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700" htmlFor="status">当前状态</label>
          <select className="h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200" defaultValue={event?.status ?? "active"} id="status" name="status">
            {EVENT_STATUSES.filter((status) => status !== "archived").map((status) => (
              <option key={status} value={status}>{EVENT_STATUS_LABELS[status]}</option>
            ))}
            {event?.status === "archived" && <option value="archived">已归档</option>}
          </select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-[120px_1fr]">
        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700" htmlFor="icon">图标 <span className="font-normal text-stone-400">（选填）</span></label>
          <input className="h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-center text-xl outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200" defaultValue={event?.icon ?? ""} id="icon" maxLength={16} name="icon" placeholder="✦" />
          {state.fieldErrors?.icon && <p className="mt-2 text-sm text-rose-700">{state.fieldErrors.icon}</p>}
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700" htmlFor="tags">标签 <span className="font-normal text-stone-400">（选填，用逗号分隔）</span></label>
          <input className="h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200" defaultValue={tags} id="tags" maxLength={400} name="tags" placeholder="例如：工作，重要" />
          {state.fieldErrors?.tags && <p className="mt-2 text-sm text-rose-700">{state.fieldErrors.tags}</p>}
        </div>
      </div>

      {state.error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm leading-6 text-rose-800">{state.error}</p>}

      <div className="flex gap-3 pt-2">
        <Link className="flex h-12 flex-1 items-center justify-center rounded-xl border border-stone-300 px-4 text-base font-medium text-stone-700 transition hover:bg-stone-100" href="/events">取消</Link>
        <button className="h-12 flex-1 rounded-xl bg-stone-800 px-4 text-base font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-400" disabled={isPending} type="submit">
          {isPending ? "正在保存…" : "保存事件"}
        </button>
      </div>
    </form>
  );
}
