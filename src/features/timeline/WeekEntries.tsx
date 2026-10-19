"use client";

import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { EntrySections } from "@/features/today/EntrySections";
import { TOUCH_TARGET } from "@/features/today/touch";
import { addDays, formatDay } from "@/lib/domain/dates";
import type { Entry } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { entryHaystack, groupByDate } from "./stats";

interface WeekEntriesProps {
  week: string;
  selected: string;
  entries: Entry[];
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  onShiftWeek: (weeks: number) => void;
}

/** The selected week's logs grouped by day (newest first), filterable by text or project. */
export function WeekEntries(props: WeekEntriesProps) {
  const { week, selected, entries, isLoading, canGoBack, canGoForward, onShiftWeek } = props;
  const searchId = useId();
  const [query, setQuery] = useState("");

  const indexed = useMemo(() => entries.map((entry) => ({ entry, text: entryHaystack(entry) })), [entries]);
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groupByDate(q ? indexed.filter((e) => e.text.includes(q)).map((e) => e.entry) : entries);
  }, [indexed, entries, query]);

  const range = `${formatDay(week, { day: "numeric", month: "short" })} – ${formatDay(addDays(week, 6), { day: "numeric", month: "short" })}`;

  return (
    <section aria-labelledby="week-heading" className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            className={TOUCH_TARGET}
            disabled={!canGoBack}
            onClick={() => onShiftWeek(-1)}
            aria-label="Previous week"
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <h2 id="week-heading" className="text-lg font-semibold tracking-[-0.03em]">
            Week of {range}
          </h2>
          <Button
            variant="ghost"
            size="icon-sm"
            className={TOUCH_TARGET}
            disabled={!canGoForward}
            onClick={() => onShiftWeek(1)}
            aria-label="Next week"
          >
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
        <div className="relative w-full sm:w-64">
          <Label htmlFor={searchId} className="sr-only">
            Search this week by text or project
          </Label>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search text or project"
            className="pl-8 max-sm:h-11"
          />
        </div>
      </div>

      <p role="status" className="sr-only">
        {isLoading ? "Loading this week…" : `${groups.length} ${groups.length === 1 ? "day" : "days"} with logs shown`}
      </p>
      <div aria-busy={isLoading}>
        {isLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        ) : groups.length === 0 ? (
          <div className="surface flex flex-col items-center gap-2 p-8 text-center text-sm">
            {query.trim() ? (
              <p className="text-muted-foreground">No logs this week match “{query.trim()}”.</p>
            ) : (
              <>
                <p className="text-muted-foreground">Nothing logged this week.</p>
                <Link href="/" className="font-medium text-link underline-offset-4 hover:underline">
                  Log today&apos;s work
                </Link>
              </>
            )}
          </div>
        ) : (
          <ol className="flex flex-col gap-6">
            {groups.map((group) => (
              <li key={group.date}>
                <h3
                  className={cn("eyebrow mb-2", group.date === selected && "text-foreground")}
                  aria-current={group.date === selected ? "date" : undefined}
                >
                  {formatDay(group.date, { weekday: "long", day: "numeric", month: "short" })}
                </h3>
                <ul className="flex flex-col gap-2">
                  {group.entries.map((entry) => (
                    <li key={entry.id} className="surface p-4">
                      {entry.data.summary && <p className="mb-3 text-sm font-medium">{entry.data.summary}</p>}
                      <EntrySections data={entry.data} />
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
