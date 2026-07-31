export default function Loading() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-5 py-8 sm:px-8">
      <div className="h-4 w-28 animate-pulse rounded bg-stone-200" />
      <div className="mt-4 h-9 w-40 animate-pulse rounded bg-stone-200" />
      <div className="mt-9 space-y-4">
        <div className="h-36 animate-pulse rounded-3xl bg-stone-200/80" />
        <div className="h-28 animate-pulse rounded-3xl bg-stone-200/80" />
      </div>
    </main>
  );
}
