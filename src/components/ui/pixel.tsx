import type { ReactNode } from "react";
import Link from "next/link";

export type PixelIconName = "archive" | "briefcase" | "calendar" | "coin" | "edit" | "file" | "heart" | "home" | "hourglass" | "journal" | "leaf" | "link" | "map" | "plus" | "search" | "sprout" | "star" | "study" | "user" | "wheat";

type PixelIconProps = { name: PixelIconName; className?: string; label?: string };

export function PixelIcon({ name, className = "", label }: PixelIconProps) {
  const common = { fill: "currentColor", shapeRendering: "crispEdges" as const };
  const art = {
    archive: <><path {...common} d="M2 5h12v2H2zM3 8h10v6H3zM6 10h4v1H6z" /></>,
    briefcase: <><path {...common} d="M2 5h12v9H2zM5 3h6v2H5zM2 8h12v2H2zM7 9h2v2H7z" /></>,
    calendar: <><path {...common} d="M2 3h12v12H2zM3 6h10v1H3zM4 1h2v4H4zM10 1h2v4h-2zM4 8h2v2H4zM8 8h2v2H8z" /></>,
    edit: <><path {...common} d="M2 11h3v3H2zM5 10l6-6 2 2-6 6H5zM11 3l1-1 2 2-1 1z" /></>,
    coin: <><path {...common} d="M3 3h10v10H3zM5 5h6v6H5zM7 6h2v4H7z" /></>,
    file: <><path {...common} d="M3 1h7l3 3v11H3zM9 2v3h3v1H8V2zM5 8h6v1H5zM5 10h6v1H5z" /></>,
    heart: <><path {...common} d="M2 4h3v2H3v2H2zM5 3h2v2H5zM9 3h2v2H9zM11 4h3v4h-1v2h-2v2H9v2H7v-2H5v-2H3V8H2z" /></>,
    home: <><path {...common} d="M1 7l7-6 7 6v8H9v-4H7v4H1zM3 7v6h3V9h4v4h3V7L8 3z" /></>,
    hourglass: <><path {...common} d="M3 2h10v2H3zM5 4h6v2l-2 2 2 2v2H5v-2l2-2-2-2zM3 12h10v2H3z" /></>,
    journal: <><path {...common} d="M2 2h10v12H2zM3 3v10h8V3zM4 5h5v1H4zM4 8h5v1H4zM4 11h3v1H4zM13 3h1v11h-1z" /></>,
    leaf: <><path {...common} d="M7 7h2v8H7zM2 2h5v5H2zM9 3h5v5H9zM4 4h3v2H4zM9 5h3v2H9z" /></>,
    link: <><path {...common} d="M4 5h5v2H5v2H3V6zM7 7h2v2H7zM9 5h3v1h1v3h-2V7H9zM7 9h2v2H5v-1H4V8h2v1z" /></>,
    map: <><path {...common} d="M2 3l4-2 4 2 4-2v12l-4 2-4-2-4 2zM5 3v9h2V3zM9 3v9h2V3z" /></>,
    plus: <><path {...common} d="M6 2h4v4h4v4h-4v4H6v-4H2V6h4z" /></>,
    search: <><path {...common} d="M2 2h8v8H2zM4 4v4h4V4zM9 9h2v2H9zM11 11h2v2h-2zM13 13h2v2h-2z" /></>,
    sprout: <><path {...common} d="M7 8h2v7H7zM3 3h4v4H3zM9 2h4v5H9zM5 5h2v2H5zM9 5h2v2H9z" /></>,
    star: <><path {...common} d="M7 1h2v4h4v2h2v2h-4v4H9v2H7v-2H5V9H1V7h4V5h2z" /></>,
    study: <><path {...common} d="M2 3h5v10H2zM9 3h5v10H9zM7 5h2v8H7zM3 5h3v1H3zM10 5h3v1h-3z" /></>,
    user: <><path {...common} d="M5 2h6v5H5zM3 8h10v6H3zM5 9h6v3H5z" /></>,
    wheat: <><path {...common} d="M7 1h2v14H7zM4 2h3v2H4zM9 3h3v2H9zM4 5h3v2H4zM9 6h3v2H9zM4 8h3v2H4zM9 9h3v2H9z" /></>,
  }[name];

  return <svg aria-hidden={label ? undefined : true} aria-label={label} className={className} role={label ? "img" : undefined} viewBox="0 0 16 16">{label && <title>{label}</title>}{art}</svg>;
}

export function PageShell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <main className={`pixel-page ${className}`}><nav aria-label="桌面主导航" className="mb-6 hidden items-center gap-2 border-b-2 border-dashed border-[var(--line)] pb-4 sm:flex"><Link className="pixel-desktop-nav-link" href="/events">事线</Link><Link className="pixel-desktop-nav-link" href="/projects">项目</Link><Link className="pixel-desktop-nav-link" href="/calendar">月历</Link><Link className="pixel-desktop-nav-link" href="/archive">归档</Link><Link className="pixel-desktop-nav-link" href="/me">我的</Link></nav>{children}</main>;
}

export function PixelEmptyState({ icon, title, children }: { icon: PixelIconName; title: string; children?: ReactNode }) {
  return <section className="pixel-empty"><PixelIcon className="mx-auto size-10 text-[var(--sage)]" name={icon} /><h2 className="pixel-title mt-4 text-xl">{title}</h2>{children && <div className="mt-2 text-sm leading-7 text-[var(--soil)]">{children}</div>}</section>;
}
