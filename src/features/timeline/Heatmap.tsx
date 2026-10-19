"use client";

import { memo, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { addDays } from "@/lib/domain/dates";
import { cn } from "@/lib/utils";
import { cellLabel, HEAT_CLASSES, type HeatmapGrid } from "./heatmap-grid";

const ROW_LABELS = ["Mon", "", "Wed", "", "Fri", "", ""];
const KEY_STEPS: Record<string, number> = { ArrowUp: -1, ArrowDown: 1, ArrowLeft: -7, ArrowRight: 7 };

interface HeatmapProps {
  grid: HeatmapGrid;
  first: string;
  today: string;
  selected: string;
  onSelect: (date: string) => void;
}

/**
 * GitHub-style contribution grid. One tab stop (roving tabindex): arrow keys move by day/week,
 * Home/End jump to the first day/today, and each button's label states the day and its count.
 */
export const Heatmap = memo(function Heatmap({ grid, first, today, selected, onSelect }: HeatmapProps) {
  const helpId = useId();
  const container = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  // One shared readout instead of a tooltip per cell (364 cells): far fewer DOM nodes and listeners.
  const [hovered, setHovered] = useState<string | null>(null);
  const labels = useMemo(
    () =>
      new Map(
        grid.weeks.flatMap((week) => week.flatMap((cell) => (cell ? [[cell.date, cellLabel(cell)] as const] : []))),
      ),
    [grid],
  );

  // A year doesn't fit on small screens: start scrolled to the most recent weeks, like GitHub.
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  function move(date: string) {
    const next = date < first ? first : date > today ? today : date;
    onSelect(next);
    container.current?.querySelector<HTMLButtonElement>(`[data-date="${next}"]`)?.focus();
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const step = KEY_STEPS[e.key];
    if (step !== undefined) move(addDays(selected, step));
    else if (e.key === "Home") move(first);
    else if (e.key === "End") move(today);
    else return;
    e.preventDefault();
  }

  return (
    <div ref={scroller} className="overflow-x-auto pb-1">
      <p id={helpId} className="sr-only">
        Each button is one day. Use the arrow keys to move between days and Enter to show that week below.
      </p>
      <div className="flex w-max gap-2">
        <div aria-hidden="true" className="mt-5 grid grid-rows-7 gap-[3px] font-mono text-[10px] text-muted-foreground">
          {ROW_LABELS.map((label, i) => (
            <span key={i} className="flex h-3 items-center leading-none">
              {label}
            </span>
          ))}
        </div>
        <div>
          <div
            aria-hidden="true"
            className="grid h-5 gap-[3px] font-mono text-[10px] text-muted-foreground"
            style={{ gridTemplateColumns: `repeat(${grid.weeks.length}, 0.75rem)` }}
          >
            {grid.months.map((m) => (
              <span key={m.column} className="whitespace-nowrap" style={{ gridColumnStart: m.column + 1 }}>
                {m.label}
              </span>
            ))}
          </div>
          <div
            ref={container}
            role="group"
            aria-label="Logged items per day, last 12 months"
            aria-describedby={helpId}
            onKeyDown={onKeyDown}
            className="grid grid-flow-col grid-rows-7 gap-[3px]"
          >
            {grid.weeks.flatMap((week, w) =>
              week.map((cell, d) =>
                cell ? (
                  <button
                    key={cell.date}
                    type="button"
                    data-date={cell.date}
                    tabIndex={cell.date === selected ? 0 : -1}
                    aria-label={cellLabel(cell)}
                    aria-pressed={cell.date === selected}
                    onClick={() => onSelect(cell.date)}
                    onMouseEnter={() => setHovered(cell.date)}
                    onMouseLeave={() => setHovered(null)}
                    className={cn(
                      "size-3 rounded-[3px] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                      HEAT_CLASSES[cell.level],
                      cell.date === selected && "ring-2 ring-foreground ring-offset-1 ring-offset-background",
                    )}
                  />
                ) : (
                  <span key={`empty-${w}-${d}`} aria-hidden="true" className="size-3" />
                ),
              ),
            )}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
        <span aria-hidden="true" className="mr-auto font-mono">
          {labels.get(hovered ?? selected) ?? ""}
        </span>
        <span>Less</span>
        {HEAT_CLASSES.map((cls) => (
          <span key={cls} aria-hidden="true" className={cn("size-3 rounded-[3px]", cls)} />
        ))}
        <span>More</span>
        <span className="sr-only">(darker cells mean more logged items)</span>
      </div>
    </div>
  );
});
