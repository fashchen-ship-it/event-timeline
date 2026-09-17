"use client";

import { useEffect, useState } from "react";
import { getOfflineNodeDraftCount, subscribeToOfflineNodeQueue } from "@/lib/offline/node-queue";

export function OfflineRecordNotice({ message }: { message?: string }) {
  const [isOnline, setIsOnline] = useState(true);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    function refresh() {
      setIsOnline(navigator.onLine);
      void getOfflineNodeDraftCount().then(setPending).catch(() => undefined);
    }
    refresh();
    window.addEventListener("online", refresh);
    window.addEventListener("offline", refresh);
    window.addEventListener("shixian-offline-sync-complete", refresh);
    const unsubscribe = subscribeToOfflineNodeQueue(refresh);
    return () => {
      window.removeEventListener("online", refresh);
      window.removeEventListener("offline", refresh);
      window.removeEventListener("shixian-offline-sync-complete", refresh);
      unsubscribe();
    };
  }, []);

  if (message) return <p className="border-2 border-[var(--sage)] bg-[#edf3df] px-3 py-2 text-sm leading-6 text-[var(--forest)]">{message}</p>;
  if (!isOnline) return <p className="border-2 border-dashed border-[var(--wheat)] bg-[#fff7df] px-3 py-2 text-sm leading-6 text-[var(--soil)]">当前离线：新记录和所选附件会先保存在这台设备，恢复网络后自动同步。编辑已有记录需联网。</p>;
  if (pending) return <p className="border-2 border-dashed border-[var(--wheat)] bg-[#fff7df] px-3 py-2 text-sm leading-6 text-[var(--soil)]">有 {pending} 条离线记录等待自动同步，请保持登录并稍后联网。</p>;
  return null;
}
