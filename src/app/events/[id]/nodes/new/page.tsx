import Link from "next/link";
import { notFound } from "next/navigation";
import { NodeForm } from "@/components/timeline/node-form";
import { getNodeReferenceTargets } from "@/lib/events/queries";
import { PageShell, PixelIcon } from "@/components/ui/pixel";

export default async function NewNodePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) notFound();
  const referenceTargets = await getNodeReferenceTargets();
  return <PageShell><Link className="text-sm font-bold text-[var(--forest)] underline underline-offset-4" href={`/events/${id}`}>← 返回事件</Link><div className="mt-5 flex items-center gap-2"><PixelIcon className="size-6 text-[var(--wheat)]" name="plus" /><h1 className="pixel-title text-3xl">添加节点</h1></div><p className="mt-3 text-base leading-7 text-[var(--soil)]">把已经发生的重要变化记录下来。</p><NodeForm eventId={id} referenceTargets={referenceTargets} /></PageShell>;
}
