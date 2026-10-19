"use client";

import { useCallback, useRef, useState } from "react";
import { hardNavigate } from "@/lib/navigation";

type Status = "idle" | "streaming" | "done" | "error";

/**
 * POSTs JSON to a streaming text endpoint and exposes the text as it arrives.
 * `run` resolves with the full text (or null on error/abort) so callers can persist it.
 */
export function useStreamingText(endpoint: string) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => controllerRef.current?.abort(), []);

  const reset = useCallback(() => {
    setText("");
    setError(null);
    setStatus("idle");
  }, []);

  const run = useCallback(
    async (body: unknown): Promise<string | null> => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      setText("");
      setError(null);
      setCached(false);
      setStatus("streaming");

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        if (res.status === 401) hardNavigate("/login");
        if (!res.ok || !res.body) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(data?.error ?? "Something went wrong. Please try again.");
        }

        setCached(res.headers.get("X-Cache") === "HIT");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let received = "";
        // Render at most once per animation frame, however many tokens arrive in between.
        let frame = 0;
        const flush = () => {
          frame = 0;
          setText(received);
        };
        try {
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            received += decoder.decode(value, { stream: true });
            frame ||= requestAnimationFrame(flush);
          }
        } finally {
          cancelAnimationFrame(frame);
          setText(received);
        }
        if (!received.trim()) throw new Error("The AI returned an empty answer. Please try again.");
        setStatus("done");
        return received;
      } catch (err) {
        if (controller.signal.aborted) {
          setStatus("done");
          return null;
        }
        setError(err instanceof Error ? err.message : "Something went wrong.");
        setStatus("error");
        return null;
      }
    },
    [endpoint],
  );

  /** `cached` is true when the server answered from a stored result instead of a new model call. */
  return { text, status, error, cached, run, stop, reset, isStreaming: status === "streaming" };
}
