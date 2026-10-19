import { describe, expect, it } from "vitest";
import type { Entry, EntryData } from "@/lib/domain/types";
import { entryHaystack, groupByDate, summarizeDays, topProject } from "./stats";

function entry(id: string, date: string, createdAt: string, data: Partial<EntryData> = {}): Entry {
  return {
    id,
    date,
    raw: "",
    words: 0,
    createdAt,
    data: { summary: "", done: [], inProgress: [], blockers: [], tomorrow: [], ...data },
  };
}

describe("summarizeDays", () => {
  it("counts logged days, items and the streak", () => {
    const days = [
      { date: "2026-10-16", entries: 1, items: 3 }, // Fri
      { date: "2026-10-19", entries: 2, items: 5 }, // Mon
      { date: "2026-10-20", entries: 0, items: 0 },
    ];
    expect(summarizeDays(days, "2026-10-20")).toEqual({ streak: 2, daysLogged: 2, items: 8 });
  });
});

describe("topProject", () => {
  it("tallies items per project across sections", () => {
    const entries = [
      entry("1", "2026-10-19", "a", {
        done: [{ text: "a", project: "web" }],
        blockers: [{ text: "b", project: "api" }],
      }),
      entry("2", "2026-10-20", "b", {
        tomorrow: [
          { text: "c", project: "api" },
          { text: "d", project: null },
        ],
      }),
    ];
    expect(topProject(entries)).toEqual({ name: "api", items: 2 });
  });
  it("returns null without projects", () => {
    expect(topProject([entry("1", "2026-10-19", "a")])).toBeNull();
  });
});

describe("groupByDate", () => {
  it("groups newest day first with newest entries first", () => {
    const groups = groupByDate([
      entry("a", "2026-10-19", "2026-10-19T09:00:00Z"),
      entry("b", "2026-10-20", "2026-10-20T09:00:00Z"),
      entry("c", "2026-10-19", "2026-10-19T18:00:00Z"),
    ]);
    expect(groups.map((g) => [g.date, g.entries.map((e) => e.id)])).toEqual([
      ["2026-10-20", ["b"]],
      ["2026-10-19", ["c", "a"]],
    ]);
  });
});

describe("entryHaystack", () => {
  it("includes summary, item text and projects in lower case", () => {
    const hay = entryHaystack(
      entry("1", "d", "c", { summary: "Big Day", done: [{ text: "Fixed Login", project: "Web" }] }),
    );
    expect(hay).toContain("big day");
    expect(hay).toContain("fixed login");
    expect(hay).toContain("web");
  });
});
