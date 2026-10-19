import { describe, expect, it } from "vitest";
import { monthWeeks, shiftMonth } from "./week-calendar";

describe("week calendar", () => {
  it("lays out a month as Monday-first week rows, blanking days outside it", () => {
    const weeks = monthWeeks("2026-10-19"); // October 2026 starts on a Thursday
    expect(weeks.map((w) => w.monday)).toEqual(["2026-09-28", "2026-10-05", "2026-10-12", "2026-10-19", "2026-10-26"]);
    expect(weeks[0].days).toEqual([null, null, null, "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"]);
    expect(weeks.at(-1)?.days.slice(-1)).toEqual([null]);
  });

  it("moves between months across year ends", () => {
    expect(shiftMonth("2026-01-15", -1)).toBe("2025-12-01");
    expect(shiftMonth("2026-12-31", 1)).toBe("2027-01-01");
  });
});
