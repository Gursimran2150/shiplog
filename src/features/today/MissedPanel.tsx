"use client";

import { ExternalLink, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { MissedActivity } from "@/lib/domain/types";
import { safeGithubUrl } from "./github-links";
import { TOUCH_TARGET } from "./touch";

interface MissedPanelProps {
  missed: MissedActivity[];
  onAdd: (item: MissedActivity) => Promise<void>;
}

/** GitHub work the user did today but didn't mention, each one-click addable to Done. */
export function MissedPanel({ missed, onAdd }: MissedPanelProps) {
  const [adding, setAdding] = useState<string | null>(null);
  if (!missed.length) return null;

  async function add(item: MissedActivity) {
    setAdding(item.url);
    try {
      await onAdd(item);
    } finally {
      setAdding(null);
    }
  }

  return (
    <section aria-labelledby="missed-heading" className="surface border-warning/40 p-4">
      <h2 id="missed-heading" className="text-sm font-semibold">
        Missed from GitHub
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">You committed this but didn&apos;t mention it.</p>
      <ul className="mt-3 flex flex-col divide-y divide-border">
        {missed.map((item) => {
          const href = safeGithubUrl(item.url);
          return (
            <li key={item.url} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-w-0 items-center gap-1.5 rounded-sm text-sm text-link hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <span className="truncate">{item.text}</span>
                  <ExternalLink aria-hidden="true" className="size-3.5 shrink-0" />
                  <span className="sr-only">(opens GitHub in a new tab)</span>
                </a>
              ) : (
                <span className="text-sm">{item.text}</span>
              )}
              <Button
                variant="outline"
                size="sm"
                className={TOUCH_TARGET}
                disabled={adding !== null}
                onClick={() => void add(item)}
                aria-label={`Add to Done: ${item.text}`}
              >
                <Plus aria-hidden="true" />
                {adding === item.url ? "Adding…" : "Add to Done"}
              </Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
