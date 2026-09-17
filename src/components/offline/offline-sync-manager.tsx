"use client";

import { useEffect } from "react";
import { getOfflineNodeDraftCount, syncOfflineNodeDrafts } from "@/lib/offline/node-queue";

/** Quietly flushes locally saved records whenever the browser reconnects. */
export function OfflineSyncManager() {
  useEffect(() => {
    async function sync() {
      if (!navigator.onLine || await getOfflineNodeDraftCount() === 0) return;
      const result = await syncOfflineNodeDrafts();
      if (result.synced) window.dispatchEvent(new CustomEvent("shixian-offline-sync-complete", { detail: result }));
    }
    const idle = window.requestIdleCallback?.(() => { void sync(); }, { timeout: 1_500 });
    const fallback = idle === undefined ? window.setTimeout(() => { void sync(); }, 1_000) : undefined;
    window.addEventListener("online", sync);
    return () => {
      window.removeEventListener("online", sync);
      if (idle !== undefined) window.cancelIdleCallback?.(idle);
      if (fallback !== undefined) window.clearTimeout(fallback);
    };
  }, []);
  return null;
}
