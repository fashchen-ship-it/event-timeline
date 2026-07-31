import { EventForm } from "@/components/events/event-form";

export default function NewEventPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-5 py-8 sm:px-8">
      <p className="text-sm font-medium tracking-[0.18em] text-stone-500">NEW EVENT</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900">新建事件</h1>
      <p className="mt-3 text-base leading-7 text-stone-600">从一件已经开始发生的事写起。</p>
      <EventForm />
    </main>
  );
}
