"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDayCounts } from "@/hooks/useData";
import { addDays, formatDay, weekStart } from "@/lib/domain/dates";
import { cn } from "@/lib/utils";
import { monthStart, monthWeeks, shiftMonth } from "./week-calendar";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const QUICK = [
  { weeks: 0, label: "This week" },
  { weeks: -1, label: "Last week" },
  { weeks: -2, label: "2 weeks ago" },
  { weeks: -4, label: "4 weeks ago" },
];

const short = (iso: string) => formatDay(iso, { day: "numeric", month: "short" });
const rangeLabel = (monday: string) => `${short(monday)} – ${short(addDays(monday, 6))}`;

interface WeekPickerProps {
  /** Monday of the selected week. */
  value: string;
  today: string;
  onChange: (monday: string) => void;
}

/**
 * Week selection for reports: previous/next arrows, plus a calendar popover where each row is a
 * week (days you logged are marked) and shortcuts for recent weeks. Future weeks can't be picked.
 */
export function WeekPicker({ value, today, onChange }: WeekPickerProps) {
  const thisWeek = weekStart(today);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => monthStart(value));
  const rows = useRef<(HTMLButtonElement | null)[]>([]);

  const weeks = useMemo(() => monthWeeks(month), [month]);
  const { days } = useDayCounts(
    open ? (weeks[0]?.monday ?? null) : null,
    open ? addDays(weeks.at(-1)?.monday ?? month, 6) : null,
  );
  const logged = useMemo(() => new Map(days.map((d) => [d.date, d.entries])), [days]);

  const pick = (monday: string) => {
    onChange(monday);
    setOpen(false);
  };

  function onRowKey(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    const step = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    rows.current[i + step]?.focus();
  }

  return (
    <div role="group" aria-label="Week" className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="icon" onClick={() => onChange(addDays(value, -7))} aria-label="Previous week">
        <ChevronLeft aria-hidden="true" />
      </Button>
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (next) setMonth(monthStart(value));
          setOpen(next);
        }}
      >
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-9 min-w-52 justify-start gap-2 font-medium tabular-nums">
            <CalendarDays aria-hidden="true" className="text-muted-foreground" />
            <span aria-live="polite">
              {rangeLabel(value)}
              {value === thisWeek && <span className="font-normal text-muted-foreground"> · this week</span>}
            </span>
            <span className="sr-only">, choose a week</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent aria-label="Choose a week" className="w-[19rem]">
          <div className="mb-2 flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setMonth(shiftMonth(month, -1))}
              aria-label="Previous month"
            >
              <ChevronLeft aria-hidden="true" />
            </Button>
            <p className="text-sm font-semibold" aria-live="polite">
              {formatDay(month, { month: "long", year: "numeric" })}
            </p>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setMonth(shiftMonth(month, 1))}
              disabled={shiftMonth(month, 1) > today}
              aria-label="Next month"
            >
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
          <div
            aria-hidden="true"
            className="grid grid-cols-7 px-1 pb-1 text-center font-mono text-[10px] text-muted-foreground"
          >
            {WEEKDAYS.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <ul className="flex flex-col gap-0.5">
            {weeks.map((week, i) => {
              const future = week.monday > thisWeek;
              const selected = week.monday === value;
              const count = week.days.reduce((n, d) => n + (d ? (logged.get(d) ?? 0) : 0), 0);
              return (
                <li key={week.monday}>
                  <button
                    ref={(el) => {
                      rows.current[i] = el;
                    }}
                    type="button"
                    disabled={future}
                    onClick={() => pick(week.monday)}
                    onKeyDown={(e) => onRowKey(e, i)}
                    aria-pressed={selected}
                    aria-label={`Week of ${rangeLabel(week.monday)}${count ? `, ${count} ${count === 1 ? "log" : "logs"}` : ", no logs"}`}
                    className={cn(
                      "grid w-full cursor-pointer grid-cols-7 rounded-lg px-1 py-1 text-center text-sm tabular-nums transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent",
                      selected && "bg-primary text-primary-foreground hover:bg-primary/90",
                    )}
                  >
                    {week.days.map((d, j) => (
                      <span key={j} className="relative flex h-7 items-center justify-center">
                        {d ? Number(d.slice(8)) : ""}
                        {d && logged.get(d) ? (
                          <span
                            className={cn(
                              "absolute bottom-0.5 size-1 rounded-full",
                              selected ? "bg-primary-foreground" : "bg-link",
                            )}
                          />
                        ) : null}
                        {d === today && <span className="absolute inset-x-2 top-0.5 h-px bg-current opacity-50" />}
                      </span>
                    ))}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3">
            {QUICK.map((q) => {
              const monday = addDays(thisWeek, q.weeks * 7);
              return (
                <Button
                  key={q.label}
                  variant={monday === value ? "secondary" : "ghost"}
                  size="xs"
                  onClick={() => pick(monday)}
                >
                  {q.label}
                </Button>
              );
            })}
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span aria-hidden="true" className="size-1 rounded-full bg-link" /> Days you logged
          </p>
        </PopoverContent>
      </Popover>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onChange(addDays(value, 7))}
        disabled={value >= thisWeek}
        aria-label="Next week"
      >
        <ChevronRight aria-hidden="true" />
      </Button>
    </div>
  );
}
