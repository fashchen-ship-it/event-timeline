import { PageShell } from "@/components/ui/pixel";

/** Shows immediately during server navigation, instead of leaving a blank page on slower mobile networks. */
export default function Loading() {
  return (
    <PageShell aria-busy="true" aria-label="正在载入">
      <div className="pixel-paper animate-pulse p-5 sm:p-6">
        <div className="h-3 w-28 bg-[var(--wheat-light)]" />
        <div className="mt-4 h-10 w-48 bg-[var(--paper-deep)]" />
        <div className="mt-4 h-5 max-w-md bg-[var(--paper-deep)]" />
        <div className="mt-7 h-12 w-full bg-[var(--paper-deep)]" />
      </div>
      <div className="mt-8 space-y-4 animate-pulse">
        <div className="h-7 w-28 bg-[var(--wheat-light)]" />
        <div className="pixel-paper h-40 bg-[var(--card)]" />
        <div className="pixel-paper h-40 bg-[var(--card)]" />
      </div>
      <p className="mt-5 text-center text-sm text-[var(--soil)]">正在翻开你的记录…</p>
    </PageShell>
  );
}
