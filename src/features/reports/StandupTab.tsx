"use client";

import { useMemo, useState } from "react";
import { useSettings } from "@/hooks/useData";
import type { StandupFormat } from "@/lib/domain/types";
import { FORMAT_OPTIONS } from "@/components/format-options";
import { standupRange } from "./ranges";
import { ReportGenerator } from "./ReportGenerator";
import { SegmentedControl } from "@/components/SegmentedControl";

export function StandupTab({ today }: { today: string }) {
  const { settings } = useSettings();
  // null until the user picks one here, so the saved preference applies as soon as it loads.
  const [picked, setPicked] = useState<StandupFormat | null>(null);
  const format = picked ?? settings.standupFormat;
  const range = useMemo(() => standupRange(today), [today]);

  return (
    <div className="flex flex-col gap-5">
      <SegmentedControl legend="Format" options={FORMAT_OPTIONS} value={format} onChange={setPicked} />
      <ReportGenerator
        key={`${range.from}:${format}`}
        kind="standup"
        range={range}
        format={format}
        buttonLabel="Generate standup"
      />
    </div>
  );
}
