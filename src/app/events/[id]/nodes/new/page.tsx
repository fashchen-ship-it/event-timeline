import Link from "next/link";
import { notFound } from "next/navigation";
import { NodeForm } from "@/components/timeline/node-form";

export default async function NewNodePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) notFound();

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-5 py-8 sm:px-8">
      <Link className="text-sm font-medium text-stone-600 underline underline-offset-4" href={`/events/${id}`}>返回事件</Link>
      <h1 className="mt-5 text-3xl font-semibold tracking-tight text-stone-900">添加节点</h1>
      <p className="mt-3 text-base leading-7 text-stone-600">把已经发生的重要变化记录下来。</p>
      <NodeForm eventId={id} />
    </main>
  );
}
