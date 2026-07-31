"use client";

import { useEffect } from "react";

/** Registers the small app-shell cache only in browsers that support service workers. */
export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js");
    }
  }, []);

  return null;
}
