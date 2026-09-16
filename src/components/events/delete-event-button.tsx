"use client";

import { deleteEvent } from "@/lib/events/actions";

export function DeleteEventButton({ id }: { id: string }) {
  return (
    <form
      action={deleteEvent}
      onSubmit={(event) => {
        if (!window.confirm("确定要删除这条事件吗？相关节点和附件也会被永久删除。")) {
          event.preventDefault();
          return;
        }
        if (!window.confirm("请再次确认：此操作无法恢复，仍要删除吗？")) event.preventDefault();
      }}
    >
      <input name="id" type="hidden" value={id} />
      <button className="pixel-button pixel-button-danger text-sm" type="submit">
        永久删除
      </button>
    </form>
  );
}
