import type { TaskEvent } from "./types";

/**
 * Who a blocker is waiting on, read from how it was logged: "(waiting on Rahul)",
 * "waiting for Priya from finance", "blocked on Karan". ShipLog's structuring prompt asks the
 * model to end blockers with "(waiting on <who>)" whenever the engineer said who.
 */
export function parseWaitingOn(text: string): string | null {
  const match =
    /\((?:still\s+)?(?:waiting|blocked)\s+(?:on|for)\s+([^)]+)\)/i.exec(text) ??
    /\b(?:waiting|blocked)\s+(?:on|for)\s+(?:the\s+)?([A-Z][\w.&-]*(?:\s+[A-Z][\w.&-]*)?)/.exec(text);
  if (!match) return null;
  const who = match[1]
    .split(/\s*(?:,|;|\bfrom\b|\bsince\b|\bto\b|\bfor\b|\babout\b)\s*/i)[0]
    .replace(/^(?:the|a|an)\s+/i, "")
    .trim();
  if (!who || who.length > 40) return null;
  return who.charAt(0).toUpperCase() + who.slice(1);
}

/**
 * First day of the task's current blocked stretch: the earliest blocker day after the last day
 * it was worked on without a blocker. Planning-only days don't break the stretch.
 */
export function blockedSince(events: readonly TaskEvent[]): string | null {
  const days = new Map<string, Set<string>>();
  for (const e of events) days.set(e.date, (days.get(e.date) ?? new Set()).add(e.section));
  let since: string | null = null;
  for (const [date, sections] of [...days].sort(([a], [b]) => a.localeCompare(b))) {
    if (sections.has("blockers")) since ??= date;
    else if (sections.has("done") || sections.has("inProgress")) since = null;
  }
  return since;
}

/** Open blockers grouped by who they wait on (longest wait first); unknown owners last. */
export function groupByPerson<T extends { person: string | null; since: string }>(
  items: readonly T[],
): { person: string | null; items: T[] }[] {
  const groups = new Map<string, { person: string | null; items: T[] }>();
  for (const item of [...items].sort((a, b) => a.since.localeCompare(b.since))) {
    const key = item.person?.toLowerCase() ?? "";
    const group = groups.get(key) ?? { person: item.person, items: [] };
    group.items.push(item);
    groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) => {
    if (!a.person !== !b.person) return a.person ? -1 : 1;
    return a.items[0].since.localeCompare(b.items[0].since);
  });
}
