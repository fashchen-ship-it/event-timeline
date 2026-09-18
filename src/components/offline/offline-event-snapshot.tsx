"use client";

import { useEffect } from "react";
import type { EventStatus } from "@/lib/events/types";

const USER_KEY = "shixian-offline-snapshot-user";
const SNAPSHOT_PREFIX = "shixian-offline-events-";

type SnapshotEvent = { id: string; title: string; status: EventStatus; nodeCount: number; updatedAt: string };

/** Stores only a compact, current-user event index for the static offline fallback. */
export function OfflineEventSnapshot({ userId, events }: { userId: string; events: SnapshotEvent[] }) {
  useEffect(() => {
    try {
      sessionStorage.setItem(USER_KEY, userId);
      localStorage.setItem(`${SNAPSHOT_PREFIX}${userId}`, JSON.stringify({ savedAt: new Date().toISOString(), events: events.slice(0, 50) }));
    } catch {
      // Offline browsing remains optional when browser storage is unavailable.
    }
  }, [events, userId]);
  return null;
}

export function clearOfflineEventSnapshotSession() {
  try {
    sessionStorage.removeItem(USER_KEY);
  } catch {
    // Nothing else is needed when session storage is unavailable.
  }
}
