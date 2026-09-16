"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PixelIcon, type PixelIconName } from "@/components/ui/pixel";

const items: { href: string; label: string; icon: PixelIconName }[] = [
  { href: "/events", label: "事件", icon: "journal" },
  { href: "/archive", label: "归档", icon: "archive" },
  { href: "/me", label: "我的", icon: "home" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="主导航" className="pixel-bottom-nav fixed inset-x-0 bottom-0 z-20 px-4 pb-[max(0.55rem,env(safe-area-inset-bottom))] pt-2 sm:hidden">
      <div className="mx-auto flex max-w-md items-center justify-around">
        {items.map((item) => {
          const active = pathname === item.href || (item.href === "/events" && pathname.startsWith("/events"));
          return <Link className={`flex min-h-12 min-w-16 flex-col items-center justify-center gap-0.5 rounded-md text-xs font-bold ${active ? "bg-[var(--wheat-light)] text-[var(--forest)]" : "text-[var(--soil)]"}`} href={item.href} key={item.href}><PixelIcon className="size-5" name={item.icon} /><span>{item.label}</span></Link>;
        })}
      </div>
    </nav>
  );
}
