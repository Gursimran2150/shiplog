import { describe, expect, it } from "vitest";
import { addDays, currentStreak, daysBetween, formatDay, localDate, weekStart } from "./dates";

describe("date helpers", () => {
  it("adds days across month and year boundaries", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("finds the Monday of a week", () => {
    expect(weekStart("2026-10-21")).toBe("2026-10-19"); // Wednesday
    expect(weekStart("2026-10-25")).toBe("2026-10-19"); // Sunday
    expect(weekStart("2026-10-19")).toBe("2026-10-19");
  });

  it("counts days between dates", () => {
    expect(daysBetween("2026-10-01", "2026-10-31")).toBe(30);
  });

  it("computes the local date in a time zone", () => {
    const lateUtc = new Date("2026-10-19T20:00:00Z"); // 01:30 next day in India
    expect(localDate(lateUtc, "Asia/Kolkata")).toBe("2026-10-20");
    expect(localDate(lateUtc, "Not/AZone")).toBe("2026-10-19");
  });

  it("formats a day label", () => {
    expect(formatDay("2026-10-19")).toMatch(/Mon/);
  });
});

describe("currentStreak", () => {
  it("counts consecutive weekdays and skips weekends", () => {
    // Fri 16, Mon 19, Tue 20 logged; Sat/Sun skipped.
    const logged = new Set(["2026-10-16", "2026-10-19", "2026-10-20"]);
    expect(currentStreak(logged, "2026-10-20")).toBe(3);
  });

  it("keeps yesterday's streak alive until today is logged", () => {
    expect(currentStreak(new Set(["2026-10-19"]), "2026-10-20")).toBe(1);
  });

  it("breaks on a missed weekday", () => {
    expect(currentStreak(new Set(["2026-10-15", "2026-10-20"]), "2026-10-20")).toBe(1);
  });
});
