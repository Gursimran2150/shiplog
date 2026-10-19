"use client";

import { useMemo, useState } from "react";
import { BRAG_PERIODS, bragRange, type BragPeriod } from "./ranges";
import { ReportGenerator } from "./ReportGenerator";
import { SegmentedControl } from "@/components/SegmentedControl";

export function BragTab({ today }: { today: string }) {
  const [period, setPeriod] = useState<BragPeriod>("30d");
  const range = useMemo(() => bragRange(period, today), [period, today]);

  return (
    <div className="flex flex-col gap-5">
      <SegmentedControl legend="Period" options={BRAG_PERIODS} value={period} onChange={setPeriod} />
      <ReportGenerator key={range.from} kind="brag" range={range} format="plain" buttonLabel="Generate brag doc" />
    </div>
  );
}
