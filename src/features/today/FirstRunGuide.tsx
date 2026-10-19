"use client";

import { X } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useDayCounts } from "@/hooks/useData";
import { addDays } from "@/lib/domain/dates";
import { cn } from "@/lib/utils";
import { readDismissed, writeDismissed } from "./dismissal";
import { TOUCH_TARGET } from "./touch";

const DISMISS_KEY = "shiplog:first-run-guide-dismissed";
const LOOKBACK_DAYS = 365;

const STEPS = [
  { title: "Speak your day", body: "Hold your Wispr Flow key and talk into the box below." },
  { title: "Review the structured log", body: "ShipLog sorts it into Done, In progress, Blockers and Tomorrow." },
  { title: "Generate your standup", body: "Turn today’s log into a ready-to-paste update in Reports." },
] as const;

/** "How ShipLog works" for someone with no entries yet. Dismissal is remembered on this device. */
export function FirstRunGuide({ today }: { today: string | null }) {
  const headingId = useId();
  const { days, isLoading } = useDayCounts(today && addDays(today, -LOOKBACK_DAYS), today);
  const hasEntries = useMemo(() => days.some((day) => day.entries > 0), [days]);
  // Nothing renders until stats load on the client, so reading storage here can't cause a hydration mismatch.
  const [dismissed, setDismissed] = useState(() => typeof window !== "undefined" && readDismissed(DISMISS_KEY));

  if (isLoading || hasEntries || dismissed) return null;

  function dismiss() {
    writeDismissed(DISMISS_KEY);
    setDismissed(true);
  }

  return (
    <section aria-labelledby={headingId} className="surface relative p-4 sm:p-5">
      <h2 id={headingId} className="eyebrow pr-10">
        How ShipLog works
      </h2>
      <ol className="mt-3 grid gap-3 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex gap-3">
            <span
              aria-hidden="true"
              className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border font-mono text-xs"
            >
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium tracking-[-0.01em]">{step.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={dismiss}
        aria-label="Dismiss how ShipLog works"
        className={cn("absolute top-2.5 right-2.5 text-muted-foreground", TOUCH_TARGET)}
      >
        <X aria-hidden="true" />
      </Button>
    </section>
  );
}
