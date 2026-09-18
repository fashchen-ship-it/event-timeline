"use client";

import { signOut } from "@/lib/auth/actions";
import { clearOfflineEventSnapshotSession } from "@/components/offline/offline-event-snapshot";

export function SignOutButton() {
  return <form action={signOut} onSubmit={clearOfflineEventSnapshotSession}><button className="pixel-button pixel-button-secondary text-base" type="submit">退出登录</button></form>;
}
