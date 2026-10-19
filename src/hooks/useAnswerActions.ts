"use client";

import { useCallback, useEffect, useState } from "react";

/** Strips markdown emphasis so copied text pastes cleanly into Slack, Teams or email. */
export function toPlainText(markdown: string): string {
  return markdown.replaceAll("**", "*");
}

/** Copy-to-clipboard with a short-lived "copied" flag for feedback. */
export function useCopy(text: string, resetMs = 2000) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), resetMs);
    return () => clearTimeout(timer);
  }, [copied, resetMs]);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(toPlainText(text));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }, [text]);

  return { copied, copy };
}
