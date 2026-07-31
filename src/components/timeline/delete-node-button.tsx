"use client";

import { deleteNode } from "@/lib/timeline/actions";

export function DeleteNodeButton({ eventId, nodeId }: { eventId: string; nodeId: string }) {
  return (
    <form
      action={deleteNode}
      onSubmit={(event) => {
        if (!window.confirm("确定要删除这个节点吗？其附件也会被永久删除。")) {
          event.preventDefault();
          return;
        }
        if (!window.confirm("请再次确认：此操作无法恢复，仍要删除吗？")) event.preventDefault();
      }}
    >
      <input name="eventId" type="hidden" value={eventId} />
      <input name="nodeId" type="hidden" value={nodeId} />
      <button className="min-h-11 rounded-xl border border-rose-200 px-4 text-sm font-medium text-rose-700 transition hover:bg-rose-50" type="submit">删除节点</button>
    </form>
  );
}
