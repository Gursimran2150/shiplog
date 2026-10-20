"use client";

import { Hourglass, Send, UserRound } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TOUCH_TARGET } from "@/features/today/touch";
import { useWaiting } from "@/hooks/useTasks";
import { daysBetween } from "@/lib/domain/dates";
import type { WaitingItem } from "@/lib/domain/types";
import { groupByPerson } from "@/lib/domain/waiting";
import { cn } from "@/lib/utils";
import { NudgeDialog } from "./NudgeDialog";

/** Blocked this many days or more is worth chasing: shown in the warning colour. */
const STALE_DAYS = 3;

function waitLabel(since: string, today: string): { text: string; stale: boolean } {
  const days = Math.max(0, daysBetween(since, today));
  return { text: days === 0 ? "since today" : `${days} day${days === 1 ? "" : "s"}`, stale: days >= STALE_DAYS };
}

/**
 * "Waiting on": every open blocker grouped by who it's waiting on, longest wait first, with a
 * one-click follow-up message. Blockers leave the list as soon as a later log shows work moving.
 */
export function WaitingBoard({ today }: { today: string | null }) {
  const { items, isLoading } = useWaiting();
  const groups = useMemo(() => groupByPerson(items), [items]);
  const [nudging, setNudging] = useState<WaitingItem | null>(null);

  return (
    <section id="waiting" aria-labelledby="waiting-heading" aria-busy={isLoading} className="surface scroll-mt-24 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="waiting-heading" className="eyebrow flex items-center gap-1.5">
          <Hourglass aria-hidden="true" className="size-3.5" />
          Waiting on
        </h2>
        {items.length > 0 && (
          <span className="font-mono text-xs text-muted-foreground">
            {items.length} open blocker{items.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {isLoading || !today ? (
        <div role="status" aria-label="Loading blockers" className="mt-3 flex flex-col gap-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : groups.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Nothing blocked. When you log a blocker (“waiting on Rahul for the API”), it shows up here with a one-click
          follow-up.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-4">
          {groups.map((group) => (
            <li key={group.person ?? "unknown"}>
              <h3 className="flex items-center gap-1.5 text-sm font-semibold">
                <UserRound aria-hidden="true" className="size-3.5 text-muted-foreground" />
                {group.person ?? "Owner not mentioned"}
                <span className="font-mono text-xs font-normal text-muted-foreground">· {group.items.length}</span>
              </h3>
              <ul className="mt-1.5 flex flex-col gap-2">
                {group.items.map((item) => {
                  const wait = waitLabel(item.since, today);
                  return (
                    <li key={item.taskId} className="rounded-lg border border-border p-2.5">
                      <p className="text-sm leading-snug">{item.blocker}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 font-mono text-[11px]",
                            wait.stale ? "bg-warning-soft text-warning" : "bg-muted text-muted-foreground",
                          )}
                          title={`Blocked since ${item.since}`}
                        >
                          {wait.text}
                        </span>
                        <Link
                          href={`/journeys?task=${item.taskId}`}
                          className="min-w-0 truncate text-xs text-muted-foreground hover:text-foreground hover:underline max-sm:py-3"
                          aria-label={`See journey: ${item.title}`}
                        >
                          {item.title}
                        </Link>
                        <Button
                          variant="outline"
                          size="xs"
                          className={cn("ml-auto", TOUCH_TARGET)}
                          onClick={() => setNudging(item)}
                          aria-label={`Draft nudge${item.person ? ` to ${item.person}` : ""}: ${item.blocker}`}
                        >
                          <Send aria-hidden="true" />
                          Draft nudge
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}
      {nudging && today && (
        <NudgeDialog
          taskId={nudging.taskId}
          person={nudging.person}
          blocker={nudging.blocker}
          today={today}
          onClose={() => setNudging(null)}
        />
      )}
    </section>
  );
}
