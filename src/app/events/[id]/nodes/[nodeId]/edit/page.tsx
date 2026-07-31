import Link from "next/link";
import { notFound } from "next/navigation";
import { NodeForm } from "@/components/timeline/node-form";
import { DeleteNodeButton } from "@/components/timeline/delete-node-button";
import { getNodeForEdit } from "@/lib/events/queries";

export const dynamic = "force-dynamic";

export default async function EditNodePage({ params }: { params: Promise<{ id: string; nodeId: string }> }) {
  const { id, nodeId } = await params;
  if (!id || !nodeId) notFound();
  const node = await getNodeForEdit(id, nodeId);

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-5 py-8 sm:px-8">
      <Link className="text-sm font-medium text-stone-600 underline underline-offset-4" href={`/events/${id}`}>返回事件</Link>
      <h1 className="mt-5 text-3xl font-semibold tracking-tight text-stone-900">编辑节点</h1>
      <NodeForm eventId={id} node={node} />
      <section className="mt-10 border-t border-stone-200 pt-7">
        <h2 className="text-base font-semibold text-stone-900">节点管理</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">删除节点会同时删除其所有附件，且无法恢复。</p>
        <div className="mt-5"><DeleteNodeButton eventId={id} nodeId={nodeId} /></div>
      </section>
    </main>
  );
}
