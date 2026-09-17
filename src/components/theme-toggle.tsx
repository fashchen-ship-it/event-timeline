"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

const storageKey = "event-timeline-theme";
const themeChangeEvent = "event-timeline-theme-change";

function subscribe(onStoreChange: () => void) {
  window.addEventListener(themeChangeEvent, onStoreChange);
  return () => window.removeEventListener(themeChangeEvent, onStoreChange);
}

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(storageKey, theme);
  window.dispatchEvent(new Event(themeChangeEvent));
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, currentTheme, () => "light");

  function chooseTheme(nextTheme: Theme) {
    applyTheme(nextTheme);
  }

  return (
    <div className="mt-4 flex w-full max-w-sm border-2 border-[var(--line)] bg-[var(--paper-deep)] p-1 text-sm font-bold">
      <button aria-pressed={theme === "light"} className={`min-h-10 flex-1 rounded px-3 ${theme === "light" ? "bg-[var(--card)] text-[var(--forest)] shadow-[1px_1px_0_var(--line)]" : "text-[var(--soil)]"}`} onClick={() => chooseTheme("light")} type="button">亮色</button>
      <button aria-pressed={theme === "dark"} className={`min-h-10 flex-1 rounded px-3 ${theme === "dark" ? "bg-[var(--card)] text-[var(--forest)] shadow-[1px_1px_0_var(--line)]" : "text-[var(--soil)]"}`} onClick={() => chooseTheme("dark")} type="button">夜间</button>
    </div>
  );
}
