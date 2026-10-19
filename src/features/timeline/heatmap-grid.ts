import { addDays, formatDay, weekStart } from "@/lib/domain/dates";
import type { DayCount } from "@/lib/domain/types";

const HEATMAP_WEEKS = 52;

/** Literal class names so Tailwind picks them up; index = heat level. */
export const HEAT_CLASSES = ["bg-heat-0", "bg-heat-1", "bg-heat-2", "bg-heat-3", "bg-heat-4"] as const;
type HeatLevel = 0 | 1 | 2 | 3 | 4;

export interface HeatCell {
  date: string;
  items: number;
  entries: number;
  level: HeatLevel;
}

export interface HeatmapGrid {
  /** One column per week (Monday first); each has 7 slots, null for days after today. */
  weeks: (HeatCell | null)[][];
  /** Month label above the first column that starts in that month. */
  months: { column: number; label: string }[];
}

const MIN_LABEL_GAP = 3;

/** Fixed thresholds keep colours stable as data grows: 0, 1–2, 3–5, 6–9, 10+ items. */
export function heatLevel(items: number): HeatLevel {
  if (items <= 0) return 0;
  if (items <= 2) return 1;
  if (items <= 5) return 2;
  if (items <= 9) return 3;
  return 4;
}

/** First day shown: the Monday `weeks - 1` weeks before this week's Monday. */
export function heatmapStart(today: string, weeks = HEATMAP_WEEKS): string {
  return addDays(weekStart(today), -7 * (weeks - 1));
}

const monthName = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", { month: "short", timeZone: "UTC" });

/** Lays day counts out as week columns × Mon–Sun rows in one pass over the range. */
export function buildHeatmap(days: readonly DayCount[], today: string, weeks = HEATMAP_WEEKS): HeatmapGrid {
  const byDate = new Map(days.map((d) => [d.date, d]));
  const grid: HeatmapGrid = { weeks: [], months: [] };
  let date = heatmapStart(today, weeks);
  let lastMonth = "";

  for (let w = 0; w < weeks; w++) {
    const column: (HeatCell | null)[] = [];
    const month = date.slice(0, 7);
    if (month !== lastMonth) {
      // A label needs ~3 columns of room: drop a partial leading month instead of overlapping (as GitHub does).
      const previous = grid.months.at(-1);
      if (previous && w - previous.column < MIN_LABEL_GAP) grid.months.pop();
      grid.months.push({ column: w, label: monthName(date) });
      lastMonth = month;
    }
    for (let d = 0; d < 7; d++) {
      if (date > today) {
        column.push(null);
      } else {
        const count = byDate.get(date);
        const items = count?.items ?? 0;
        column.push({ date, items, entries: count?.entries ?? 0, level: heatLevel(items) });
      }
      date = addDays(date, 1);
    }
    grid.weeks.push(column);
  }
  return grid;
}

/** Accessible name and tooltip for a day cell, e.g. "3 items on Wed, 14 Oct". */
export function cellLabel(cell: HeatCell): string {
  const day = formatDay(cell.date, { weekday: "short", day: "numeric", month: "short" });
  if (!cell.entries) return `No logs on ${day}`;
  return `${cell.items} item${cell.items === 1 ? "" : "s"} on ${day}`;
}
