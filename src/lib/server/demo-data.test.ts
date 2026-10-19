import { describe, expect, it } from "vitest";
import { entryDataSchema } from "@/lib/server/schemas";
import { demoEntries } from "./demo-data";
import { demoHistory } from "./demo-history";

describe("demoEntries", () => {
  const entries = demoEntries("2026-10-20"); // a Tuesday
  const dates = entries.map((e) => e.date);

  it("covers about a year and a half of past weekdays, oldest first, ending yesterday", () => {
    expect(dates.at(-1)).toBe("2026-10-19");
    expect(dates[0] < "2025-05-15").toBe(true);
    expect(entries.length).toBeGreaterThan(300);
    expect([...dates].sort()).toEqual(dates);
    expect(new Set(dates).size).toBe(dates.length);
    for (const d of dates) expect([0, 6]).not.toContain(new Date(`${d}T00:00:00Z`).getUTCDay());
  });

  it("only contains entries that match the stored schema", () => {
    for (const e of entries) expect(entryDataSchema.safeParse(e.data).success, e.date).toBe(true);
  });

  it("reads like real work: projects, blockers, shipped outcomes and days off", () => {
    const projects = new Set(entries.flatMap((e) => e.data.done.map((i) => i.project)).filter(Boolean));
    expect(projects.size).toBeGreaterThan(10);
    expect(entries.filter((e) => e.data.blockers.length).length).toBeGreaterThan(10);
    expect(dates).not.toContain("2025-08-15"); // Independence Day off
  });
});

describe("demoHistory", () => {
  it("is deterministic for a seed", () => {
    expect(demoHistory("2026-01-01", "2026-03-01")).toEqual(demoHistory("2026-01-01", "2026-03-01"));
  });
});
