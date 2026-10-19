import { currentStreak } from "@/lib/domain/dates";
import { SECTIONS, type DayCount, type Entry } from "@/lib/domain/types";

export interface PeriodStats {
  streak: number;
  daysLogged: number;
  items: number;
}

/** Streak, logged days and total items from per-day counts, in a single pass. */
export function summarizeDays(days: readonly DayCount[], today: string): PeriodStats {
  const logged = new Set<string>();
  let items = 0;
  for (const day of days) {
    if (day.entries > 0) logged.add(day.date);
    items += day.items;
  }
  return { streak: currentStreak(logged, today), daysLogged: logged.size, items };
}

/** The project with the most items across `entries` (ties go to the first seen), or null. */
export function topProject(entries: readonly Entry[]): { name: string; items: number } | null {
  const tally = new Map<string, number>();
  let best: { name: string; items: number } | null = null;
  for (const entry of entries) {
    for (const section of SECTIONS) {
      for (const { project } of entry.data[section]) {
        if (!project) continue;
        const items = (tally.get(project) ?? 0) + 1;
        tally.set(project, items);
        if (!best || items > best.items) best = { name: project, items };
      }
    }
  }
  return best;
}

/** Lower-cased text of everything searchable in an entry: summary, items and projects. */
export function entryHaystack(entry: Entry): string {
  const parts = [entry.data.summary];
  for (const section of SECTIONS) {
    for (const item of entry.data[section]) parts.push(item.text, item.project ?? "");
  }
  return parts.join("\n").toLowerCase();
}

interface DayGroup {
  date: string;
  entries: Entry[];
}

/** Groups entries by date, newest day first, keeping each day's entries newest first. */
export function groupByDate(entries: readonly Entry[]): DayGroup[] {
  const groups = new Map<string, Entry[]>();
  for (const entry of entries) {
    const list = groups.get(entry.date);
    if (list) list.push(entry);
    else groups.set(entry.date, [entry]);
  }
  return [...groups]
    .map(([date, list]) => ({ date, entries: list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)) }))
    .sort((a, b) => b.date.localeCompare(a.date));
}
