"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { addDays, formatDay } from "@/lib/domain/dates";
import { weekRange } from "./ranges";
import { ReportGenerator } from "./ReportGenerator";

export function WeeklyTab({ today }: { today: string }) {
  /** 0 = this week, -1 = last week, … */
  const [offset, setOffset] = useState(0);
  const range = useMemo(() => weekRange(addDays(today, offset * 7)), [today, offset]);
  const label = `Week of ${formatDay(range.from, { day: "numeric", month: "short" })}`;

  return (
    <div className="flex flex-col gap-5">
      <div role="group" aria-label="Week" className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => setOffset((o) => o - 1)} aria-label="Previous week">
          <ChevronLeft aria-hidden="true" />
        </Button>
        <p className="min-w-32 text-center text-sm font-medium tabular-nums" aria-live="polite">
          {label}
          {offset === 0 && <span className="text-muted-foreground"> · this week</span>}
        </p>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setOffset((o) => Math.min(0, o + 1))}
          disabled={offset === 0}
          aria-label="Next week"
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
      <ReportGenerator
        key={range.from}
        kind="weekly"
        range={range}
        format="plain"
        buttonLabel="Generate weekly report"
      />
    </div>
  );
}
