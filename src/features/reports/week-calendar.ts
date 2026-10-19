import { addDays, weekStart } from "@/lib/domain/dates";

/** One week row in the month view: Monday's date and its seven days (null outside the month). */
interface CalendarWeek {
  monday: string;
  days: (string | null)[];
}

/** First day of the month containing `iso`. */
export const monthStart = (iso: string) => `${iso.slice(0, 7)}-01`;

/** First day of the month `delta` months from the one containing `iso`. */
export function shiftMonth(iso: string, delta: number): string {
  const [y, m] = iso.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 10);
}

/** The Monday-first week rows that cover a month. */
export function monthWeeks(month: string): CalendarWeek[] {
  const first = monthStart(month);
  const key = first.slice(0, 7);
  const weeks: CalendarWeek[] = [];
  for (let monday = weekStart(first); monday.slice(0, 7) <= key; monday = addDays(monday, 7)) {
    if (addDays(monday, 6).slice(0, 7) < key) continue;
    weeks.push({
      monday,
      days: Array.from({ length: 7 }, (_, i) => {
        const day = addDays(monday, i);
        return day.slice(0, 7) === key ? day : null;
      }),
    });
  }
  return weeks;
}
