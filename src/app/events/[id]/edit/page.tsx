import Link from "next/link";
import { notFound } from "next/navigation";
import { archiveEvent } from "@/lib/events/actions";
import { getEventCollections, getEventForEdit } from "@/lib/events/queries";
import { DeleteEventButton } from "@/components/events/delete-event-button";
import { EventForm } from "@/components/events/event-form";
import { PageShell, PixelIcon } from "@/components/ui/pixel";

export const dynamic = "force-dynamic";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) notFound();
  const [event, collections] = await Promise.all([getEventForEdit(id), getEventCollections()]);
  return <PageShell><Link className="text-sm font-bold text-[var(--forest)] underline underline-offset-4" href="/events">← 返回事件</Link><div className="mt-5 flex items-center gap-2"><PixelIcon className="size-6 text-[var(--wheat)]" name="edit" /><h1 className="pixel-title text-3xl">编辑事件</h1></div><EventForm collections={collections} event={event} /><section className="pixel-paper mt-10 p-5"><h2 className="pixel-title text-lg">事件管理</h2><p className="mt-2 text-sm leading-6 text-[var(--soil)]">归档后不会在默认事件列表显示；永久删除会同时删除其下节点和附件。</p><div className="mt-5 flex flex-wrap gap-3">{event.status !== "archived" && <form action={archiveEvent}><input name="id" type="hidden" value={event.id} /><button className="pixel-button pixel-button-secondary text-sm" type="submit"><PixelIcon className="size-4" name="archive" />归档事件</button></form>}<DeleteEventButton id={event.id} /></div></section></PageShell>;
}
