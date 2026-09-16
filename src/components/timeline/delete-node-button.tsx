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
      <button className="pixel-button pixel-button-danger text-sm" type="submit">删除节点</button>
    </form>
  );
}
