"use client";

import { useEffect } from "react";
import { syncOfflineNodeDrafts } from "@/lib/offline/node-queue";

/** Quietly flushes locally saved records whenever the browser reconnects. */
export function OfflineSyncManager() {
  useEffect(() => {
    async function sync() {
      const result = await syncOfflineNodeDrafts();
      if (result.synced) window.dispatchEvent(new CustomEvent("shixian-offline-sync-complete", { detail: result }));
    }
    void sync();
    window.addEventListener("online", sync);
    return () => window.removeEventListener("online", sync);
  }, []);
  return null;
}
