"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/events", label: "事件", icon: "◦" },
  { href: "/archive", label: "归档", icon: "□" },
  { href: "/me", label: "我的", icon: "○" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="主导航" className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-[#f7f6f2]/95 px-6 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur sm:hidden">
      <div className="mx-auto flex max-w-md items-center justify-around">
        {items.map((item) => {
          const active = pathname === item.href || (item.href === "/events" && pathname.startsWith("/events"));
          return (
            <Link className={`flex min-h-12 min-w-16 flex-col items-center justify-center gap-0.5 rounded-xl text-xs ${active ? "font-semibold text-stone-900" : "text-stone-500"}`} href={item.href} key={item.href}>
              <span aria-hidden="true" className="text-lg leading-none">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
