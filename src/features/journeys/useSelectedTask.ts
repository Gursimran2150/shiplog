"use client";

import { useCallback, useSyncExternalStore } from "react";

const EVENT = "shiplog:task-param";

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

const read = () => new URLSearchParams(window.location.search).get("task");

/** The `?task=` in the URL, so a journey can be linked to and survives reloads and the back button. */
export function useSelectedTask(): [string | null, (id: string) => void] {
  const selected = useSyncExternalStore(subscribe, read, () => null);
  const select = useCallback((id: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("task", id);
    window.history.pushState(null, "", url);
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return [selected, select];
}
