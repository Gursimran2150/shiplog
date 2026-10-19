"use client";

import { useCallback, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { useDayCounts, useEntries } from "@/hooks/useData";
import { useToday } from "@/hooks/useToday";
import { addDays, weekStart } from "@/lib/domain/dates";
import { Heatmap } from "./Heatmap";
import { buildHeatmap, heatmapStart } from "./heatmap-grid";
import { summarizeDays, topProject } from "./stats";
import { TimelineStats } from "./TimelineStats";
import { WeekEntries } from "./WeekEntries";

const EMPTY_STATS = { streak: 0, daysLogged: 0, items: 0 };

/** Timeline: 12-month heatmap, period stats, and the selected week's logs. */
export function TimelineView() {
  const today = useToday();
  const [picked, setPicked] = useState<string | null>(null);
  const selected = picked ?? today;
  const first = today && heatmapStart(today);

  const { days, isLoading: daysLoading } = useDayCounts(first, today);
  const grid = useMemo(() => (today ? buildHeatmap(days, today) : null), [days, today]);
  const period = useMemo(() => (today ? summarizeDays(days, today) : EMPTY_STATS), [days, today]);

  const week = selected && weekStart(selected);
  const { entries, isLoading: weekLoading } = useEntries(week, week && addDays(week, 6));
  const top = useMemo(() => topProject(entries), [entries]);

  const shiftWeek = useCallback(
    (weeks: number) => {
      if (!selected || !first || !today) return;
      const next = addDays(selected, weeks * 7);
      setPicked(next < first ? first : next > today ? today : next);
    },
    [first, selected, today],
  );

  return (
    <>
      <PageHeader
        eyebrow="Last 12 months"
        title="Timeline"
        description="Every day you logged, at a glance. Pick a day to see that week's work."
      />
      <div className="flex flex-col gap-6">
        <section aria-labelledby="heatmap-heading" className="surface min-w-0 p-4 sm:p-5">
          <h2 id="heatmap-heading" className="eyebrow mb-3">
            Activity
          </h2>
          {grid && today && selected && first && !daysLoading ? (
            <Heatmap grid={grid} first={first} today={today} selected={selected} onSelect={setPicked} />
          ) : (
            <Skeleton className="h-32 w-full" />
          )}
        </section>
        <TimelineStats period={period} periodLoading={daysLoading} topProject={top} weekLoading={weekLoading} />
        {week && selected && first && today ? (
          <WeekEntries
            week={week}
            selected={selected}
            entries={entries}
            isLoading={weekLoading}
            canGoBack={week > first}
            canGoForward={addDays(week, 7) <= today}
            onShiftWeek={shiftWeek}
          />
        ) : (
          <Skeleton className="h-40 w-full rounded-xl" />
        )}
      </div>
    </>
  );
}
