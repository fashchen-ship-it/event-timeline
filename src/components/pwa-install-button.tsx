"use client";

import { useEffect, useState } from "react";
import { PixelIcon } from "@/components/ui/pixel";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches || ("standalone" in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true);
}

export function PwaInstallButton() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(() => typeof window !== "undefined" && isStandaloneMode());

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => { setIsInstalled(true); setInstallEvent(null); };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onBeforeInstall); window.removeEventListener("appinstalled", onInstalled); };
  }, []);

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  }

  if (isInstalled) return <p className="mt-3 flex items-center gap-2 text-sm font-bold text-[var(--forest)]"><PixelIcon className="size-4" name="sprout" />已作为应用安装到此设备。</p>;
  if (!installEvent) return <p className="mt-3 text-sm leading-6 text-[var(--soil)]">在安卓 Chrome 中打开菜单，选择“安装应用”或“添加到主屏幕”，即可像普通 App 一样使用。</p>;
  return <button className="pixel-button pixel-button-primary mt-4 min-h-11 px-4 text-sm" onClick={install} type="button"><PixelIcon className="size-4" name="plus" />安装到桌面</button>;
}
