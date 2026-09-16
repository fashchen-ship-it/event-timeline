import Link from "next/link";
import { notFound } from "next/navigation";
import { NodeForm } from "@/components/timeline/node-form";
import { DeleteNodeButton } from "@/components/timeline/delete-node-button";
import { getNodeForEdit, getNodeReferenceTargets } from "@/lib/events/queries";
import { PageShell, PixelIcon } from "@/components/ui/pixel";

export const dynamic = "force-dynamic";
export default async function EditNodePage({ params }: { params: Promise<{ id: string; nodeId: string }> }) {
  const { id, nodeId } = await params;
  if (!id || !nodeId) notFound();
  const [node, referenceTargets] = await Promise.all([getNodeForEdit(id, nodeId), getNodeReferenceTargets()]);
  return <PageShell><Link className="text-sm font-bold text-[var(--forest)] underline underline-offset-4" href={`/events/${id}`}>← 返回事件</Link><div className="mt-5 flex items-center gap-2"><PixelIcon className="size-6 text-[var(--wheat)]" name="edit" /><h1 className="pixel-title text-3xl">编辑节点</h1></div><NodeForm eventId={id} node={node} referenceTargets={referenceTargets} /><section className="pixel-paper mt-10 p-5"><h2 className="pixel-title text-lg">节点管理</h2><p className="mt-2 text-sm leading-6 text-[var(--soil)]">删除节点会同时删除所有附件，且无法恢复。</p><div className="mt-5"><DeleteNodeButton eventId={id} nodeId={node.id} /></div></section></PageShell>;
}
