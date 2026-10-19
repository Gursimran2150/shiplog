"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SYNC_MS = 400;

/**
 * State for a text field that dictation tools write into.
 *
 * The field is uncontrolled on purpose: some dictation apps (Wispr Flow in certain modes, OS
 * dictation, accessibility tools) set the field's value directly without firing input events.
 * A controlled React field would then overwrite that text on the next render, keeping only the
 * first burst. Here the DOM is the source of truth; we mirror it on input events and, while the
 * field is focused, with a light poll that catches silent inserts.
 */
export function useDictationField<T extends HTMLTextAreaElement | HTMLInputElement>() {
  const ref = useRef<T>(null);
  const [value, setMirror] = useState("");

  const sync = useCallback(() => {
    const next = ref.current?.value ?? "";
    setMirror((prev) => (prev === next ? prev : next));
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let timer: number | undefined;
    const start = () => {
      window.clearInterval(timer);
      timer = window.setInterval(sync, SYNC_MS);
    };
    const stop = () => {
      window.clearInterval(timer);
      sync();
    };
    el.addEventListener("input", sync);
    el.addEventListener("change", sync);
    el.addEventListener("focus", start);
    el.addEventListener("blur", stop);
    if (document.activeElement === el) start();
    return () => {
      window.clearInterval(timer);
      el.removeEventListener("input", sync);
      el.removeEventListener("change", sync);
      el.removeEventListener("focus", start);
      el.removeEventListener("blur", stop);
    };
  }, [sync]);

  /** Replaces the text (e.g. after submit or a starter phrase) and keeps the mirror in step. */
  const setValue = useCallback((next: string) => {
    if (ref.current) ref.current.value = next;
    setMirror(next);
  }, []);

  /** Appends dictated text with a single separating space. */
  const append = useCallback(
    (chunk: string) => {
      const current = ref.current?.value ?? "";
      const piece = chunk.trim();
      if (!piece) return;
      const joiner = !current || /\s$/.test(current) ? "" : " ";
      setValue(`${current}${joiner}${piece}`);
    },
    [setValue],
  );

  /** The current text, read straight from the field (never stale). */
  const read = useCallback(() => ref.current?.value ?? "", []);

  return { ref, value, setValue, append, read, sync };
}
