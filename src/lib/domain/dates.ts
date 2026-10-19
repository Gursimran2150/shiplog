/** Calendar helpers on YYYY-MM-DD strings (local dates, no time-of-day), shared by client and server. */

const DAY_MS = 86_400_000;

function toUtcMidnight(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function fromUtcMs(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  return fromUtcMs(toUtcMidnight(iso) + days * DAY_MS);
}

/** Monday of the week containing `iso`. */
export function weekStart(iso: string): string {
  const day = new Date(toUtcMidnight(iso)).getUTCDay(); // 0 = Sunday
  return addDays(iso, day === 0 ? -6 : 1 - day);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((toUtcMidnight(to) - toUtcMidnight(from)) / DAY_MS);
}

/** Today's date in an IANA time zone (falls back to UTC for an unknown zone). */
export function localDate(at: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(at);
  } catch {
    return at.toISOString().slice(0, 10);
  }
}

/**
 * Consecutive logged days ending today (or yesterday, so the streak survives until the
 * user logs today). Weekends are skipped: engineers shouldn't lose a streak on Saturday.
 */
export function currentStreak(loggedDates: ReadonlySet<string>, today: string): number {
  let cursor = loggedDates.has(today) ? today : addDays(today, -1);
  let streak = 0;
  for (let guard = 0; guard < 400; guard++) {
    const weekday = new Date(toUtcMidnight(cursor)).getUTCDay();
    if (weekday === 0 || weekday === 6) {
      cursor = addDays(cursor, -1);
      continue;
    }
    if (!loggedDates.has(cursor)) break;
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function formatDay(
  iso: string,
  opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" },
): string {
  return new Date(toUtcMidnight(iso)).toLocaleDateString("en-IN", { ...opts, timeZone: "UTC" });
}
