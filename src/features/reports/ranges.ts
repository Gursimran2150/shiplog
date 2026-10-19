import { addDays, fromUtcMs, weekStart } from "@/lib/domain/dates";
import type { ReportKind } from "@/lib/domain/types";

/** An inclusive range of local calendar dates (YYYY-MM-DD). */
export interface DateRange {
  from: string;
  to: string;
}

export const BRAG_PERIODS = [
  { value: "30d", label: "Last 30 days" },
  { value: "quarter", label: "This quarter" },
  { value: "6m", label: "Last 6 months" },
] as const;
export type BragPeriod = (typeof BRAG_PERIODS)[number]["value"];

/** Standups cover yesterday and today. */
export function standupRange(today: string): DateRange {
  return { from: addDays(today, -1), to: today };
}

/** Monday to Sunday of the week containing `day`. */
export function weekRange(day: string): DateRange {
  const from = weekStart(day);
  return { from, to: addDays(from, 6) };
}

/** Same calendar day `months` months earlier, clamped to the end of shorter months (31 Mar - 1 = 28/29 Feb). */
function subtractMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, m - 1 - months + 1, 0)).getUTCDate();
  return fromUtcMs(Date.UTC(y, m - 1 - months, Math.min(d, lastDay)));
}

/** Brag doc periods all end today. */
export function bragRange(period: BragPeriod, today: string): DateRange {
  switch (period) {
    case "30d":
      return { from: addDays(today, -29), to: today };
    case "quarter": {
      const [y, m] = today.split("-").map(Number);
      const quarterMonth = Math.floor((m - 1) / 3) * 3 + 1;
      return { from: `${y}-${String(quarterMonth).padStart(2, "0")}-01`, to: today };
    }
    case "6m":
      return { from: subtractMonths(today, 6), to: today };
  }
}

/** e.g. "shiplog-weekly-2026-10-19-to-2026-10-25.md"; a single-day range keeps one date. */
export function reportFilename(kind: ReportKind, { from, to }: DateRange): string {
  return `shiplog-${kind}-${from === to ? from : `${from}-to-${to}`}.md`;
}
