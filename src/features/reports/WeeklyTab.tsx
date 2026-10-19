"use client";

import { useMemo, useState } from "react";
import { weekStart } from "@/lib/domain/dates";
import { weekRange } from "./ranges";
import { ReportGenerator } from "./ReportGenerator";
import { WeekPicker } from "./WeekPicker";

export function WeeklyTab({ today }: { today: string }) {
  const [monday, setMonday] = useState(() => weekStart(today));
  const range = useMemo(() => weekRange(monday), [monday]);

  return (
    <div className="flex flex-col gap-5">
      <WeekPicker value={monday} today={today} onChange={setMonday} />
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
