import { describe, expect, it } from "vitest";
import { buildHeatmap, cellLabel, heatLevel, heatmapStart } from "./heatmap-grid";

describe("heatLevel", () => {
  it("buckets item counts", () => {
    expect([0, 1, 2, 3, 5, 6, 9, 10, 40].map(heatLevel)).toEqual([0, 1, 1, 2, 2, 3, 3, 4, 4]);
  });
});

describe("buildHeatmap", () => {
  const today = "2026-10-21"; // Wednesday

  it("starts on a Monday and has 7 rows per week", () => {
    expect(heatmapStart(today, 2)).toBe("2026-10-12");
    const grid = buildHeatmap([], today, 2);
    expect(grid.weeks).toHaveLength(2);
    expect(grid.weeks.every((w) => w.length === 7)).toBe(true);
    expect(grid.weeks[0][0]?.date).toBe("2026-10-12");
  });

  it("leaves days after today empty", () => {
    const week = buildHeatmap([], today, 1).weeks[0];
    expect(week.map((c) => c?.date ?? null)).toEqual([
      "2026-10-19",
      "2026-10-20",
      "2026-10-21",
      null,
      null,
      null,
      null,
    ]);
  });

  it("fills counts and levels from the data", () => {
    const grid = buildHeatmap([{ date: "2026-10-20", entries: 2, items: 7 }], today, 1);
    expect(grid.weeks[0][1]).toEqual({ date: "2026-10-20", entries: 2, items: 7, level: 3 });
    expect(grid.weeks[0][0]?.level).toBe(0);
  });

  it("labels each new month once, dropping a cramped leading partial month", () => {
    const grid = buildHeatmap([], "2026-11-04", 6); // starts Mon 28 Sep: one Sep column, then Oct
    expect(grid.months.map((m) => m.column)).toEqual([1, 5]);
    expect(grid.months.map((m) => m.label)).toEqual(["Oct", "Nov"]);
  });
});

describe("cellLabel", () => {
  it("states the count and the day", () => {
    expect(cellLabel({ date: "2026-10-14", items: 3, entries: 1, level: 2 })).toMatch(/^3 items on Wed,? 14 Oct$/);
    expect(cellLabel({ date: "2026-10-14", items: 1, entries: 1, level: 1 })).toMatch(/^1 item on /);
    expect(cellLabel({ date: "2026-10-14", items: 0, entries: 0, level: 0 })).toMatch(/^No logs on /);
  });
});

describe("month labels", () => {
  it("never places two labels closer than three columns", () => {
    const { months } = buildHeatmap([], "2026-10-19");
    for (let i = 1; i < months.length; i++) expect(months[i].column - months[i - 1].column).toBeGreaterThanOrEqual(3);
  });
});
