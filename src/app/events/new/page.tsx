import { EventForm } from "@/components/events/event-form";
import { PageShell, PixelIcon } from "@/components/ui/pixel";
import { getEventCollections } from "@/lib/events/queries";

export default async function NewEventPage() {
  const collections = await getEventCollections();
  return <PageShell><div className="flex items-center gap-2"><PixelIcon className="size-6 text-[var(--sage)]" name="sprout" /><p className="pixel-eyebrow">NEW EVENT</p></div><h1 className="pixel-title mt-3 text-3xl">新建事件</h1><p className="mt-3 text-base leading-7 text-[var(--soil)]">从一件已经开始发生的事写起。</p><EventForm collections={collections} /></PageShell>;
}
