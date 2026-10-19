"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

function todayLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Today's local date (YYYY-MM-DD) on the client; null during server prerender. */
export function useToday(): string | null {
  return useSyncExternalStore(noopSubscribe, todayLocal, () => null);
}

/** The browser's IANA time zone (e.g. "Asia/Kolkata"); null during server prerender. */
export function useTimeZone(): string | null {
  return useSyncExternalStore(
    noopSubscribe,
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    () => null,
  );
}
