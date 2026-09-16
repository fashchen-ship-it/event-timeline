import type { ReactNode } from "react";

export type PixelIconName = "archive" | "calendar" | "edit" | "file" | "home" | "hourglass" | "journal" | "link" | "plus" | "search" | "sprout" | "star" | "user" | "wheat";
export type PixelDoodleName = "bloom" | "cat" | "dog" | "field" | "flag";

type PixelIconProps = { name: PixelIconName; className?: string; label?: string };

export function PixelIcon({ name, className = "", label }: PixelIconProps) {
  const common = { fill: "currentColor", shapeRendering: "crispEdges" as const };
  const art = {
    archive: <><path {...common} d="M2 5h12v2H2zM3 8h10v6H3zM6 10h4v1H6z" /></>,
    calendar: <><path {...common} d="M2 3h12v12H2zM3 6h10v1H3zM4 1h2v4H4zM10 1h2v4h-2zM4 8h2v2H4zM8 8h2v2H8z" /></>,
    edit: <><path {...common} d="M2 11h3v3H2zM5 10l6-6 2 2-6 6H5zM11 3l1-1 2 2-1 1z" /></>,
    file: <><path {...common} d="M3 1h7l3 3v11H3zM9 2v3h3v1H8V2zM5 8h6v1H5zM5 10h6v1H5z" /></>,
    home: <><path {...common} d="M1 7l7-6 7 6v8H9v-4H7v4H1zM3 7v6h3V9h4v4h3V7L8 3z" /></>,
    hourglass: <><path {...common} d="M3 2h10v2H3zM5 4h6v2l-2 2 2 2v2H5v-2l2-2-2-2zM3 12h10v2H3z" /></>,
    journal: <><path {...common} d="M2 2h10v12H2zM3 3v10h8V3zM4 5h5v1H4zM4 8h5v1H4zM4 11h3v1H4zM13 3h1v11h-1z" /></>,
    link: <><path {...common} d="M4 5h5v2H5v2H3V6zM7 7h2v2H7zM9 5h3v1h1v3h-2V7H9zM7 9h2v2H5v-1H4V8h2v1z" /></>,
    plus: <><path {...common} d="M6 2h4v4h4v4h-4v4H6v-4H2V6h4z" /></>,
    search: <><path {...common} d="M2 2h8v8H2zM4 4v4h4V4zM9 9h2v2H9zM11 11h2v2h-2zM13 13h2v2h-2z" /></>,
    sprout: <><path {...common} d="M7 8h2v7H7zM3 3h4v4H3zM9 2h4v5H9zM5 5h2v2H5zM9 5h2v2H9z" /></>,
    star: <><path {...common} d="M7 1h2v4h4v2h2v2h-4v4H9v2H7v-2H5V9H1V7h4V5h2z" /></>,
    user: <><path {...common} d="M5 2h6v5H5zM3 8h10v6H3zM5 9h6v3H5z" /></>,
    wheat: <><path {...common} d="M7 1h2v14H7zM4 2h3v2H4zM9 3h3v2H9zM4 5h3v2H4zM9 6h3v2H9zM4 8h3v2H4zM9 9h3v2H9z" /></>,
  }[name];

  return <svg aria-hidden={label ? undefined : true} aria-label={label} className={className} role={label ? "img" : undefined} viewBox="0 0 16 16">{label && <title>{label}</title>}{art}</svg>;
}

export function PixelDoodle({ name, className = "" }: { name: PixelDoodleName; className?: string }) {
  const art = {
    bloom: <><path fill="#b86950" d="M13 2h6v6h-6zM6 9h7v7H6zM19 9h7v7h-7zM13 16h6v7h-6z" /><path fill="#d6a54a" d="M13 9h6v7h-6z" /><path fill="#416b49" d="M14 23h4v7h-4zM8 26h6v3H8zM18 26h6v3h-6z" /></>,
    cat: <><path fill="#3c3025" d="M5 8h4V4h4v3h6V4h4v4h4v18H5z" /><path fill="#e5b77e" d="M9 8h4V6h2v4h2V6h2v2h4v15H9z" /><path fill="#fff0d4" d="M12 16h8v6h-8z" /><path fill="#3c3025" d="M12 13h2v2h-2zM20 13h2v2h-2zM16 16h2v2h-2zM9 19h4v2H9zM20 19h4v2h-4zM3 23h10v2H3zM19 23h10v2H19z" /><path fill="#b86950" d="M15 8h2v2h-2z" /></>,
    dog: <><path fill="#3c3025" d="M6 7h5V4h4v3h6V3h5v13h-3v13H8V16H5V3h1z" /><path fill="#c98557" d="M9 9h4V7h2v3h2V7h2v2h3v16H9z" /><path fill="#fff0d4" d="M12 17h8v7h-8z" /><path fill="#3c3025" d="M12 14h2v2h-2zM19 14h2v2h-2zM16 18h2v2h-2zM14 22h2v2h-2zM18 22h2v2h-2z" /><path fill="#8da77a" d="M5 5h3v8H5z" /></>,
    field: <><path fill="#d6a54a" d="M2 2h9v9H2z" /><path fill="#fff6d6" d="M5 3h3v3H5z" /><path fill="#a9c9d7" d="M13 2h17v16H13z" /><path fill="#8da77a" d="M2 20h28v10H2z" /><path fill="#416b49" d="M4 17h4v10H4zM9 13h4v14H9zM18 16h4v11h-4zM23 12h4v15h-4z" /><path fill="#644632" d="M2 27h28v3H2z" /></>,
    flag: <><path fill="#644632" d="M4 2h4v28H4z" /><path fill="#b86950" d="M8 3h18v11H8z" /><path fill="#f4d892" d="M12 6h8v3h-8z" /><path fill="#8da77a" d="M1 26h12v4H1z" /></>,
  }[name];

  return <svg aria-hidden className={className} shapeRendering="crispEdges" viewBox="0 0 32 32">{art}</svg>;
}

export function PageShell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <main className={`pixel-page ${className}`}>{children}</main>;
}

export function PixelEmptyState({ icon, title, children }: { icon: PixelIconName; title: string; children?: ReactNode }) {
  return <section className="pixel-empty"><PixelIcon className="mx-auto size-10 text-[var(--sage)]" name={icon} /><h2 className="pixel-title mt-4 text-xl">{title}</h2>{children && <div className="mt-2 text-sm leading-7 text-[var(--soil)]">{children}</div>}</section>;
}
