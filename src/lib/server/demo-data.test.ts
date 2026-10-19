import { describe, expect, it } from "vitest";
import { SECTIONS } from "@/lib/domain/types";
import { entryDataSchema } from "@/lib/server/schemas";
import { demoJournal, materializeJournal } from "./demo-data";
import { demoHistory } from "./demo-history";

describe("demo journal", () => {
  let n = 0;
  const seed = materializeJournal(
    demoJournal("2026-10-20"),
    () => `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`,
  );
  const dates = seed.entries.map((e) => e.date);

  it("covers ~18 months of weekdays, oldest first, ending with a log for today", () => {
    expect(dates.at(-1)).toBe("2026-10-20");
    expect(dates.at(-2)).toBe("2026-10-19");
    expect(dates[0] < "2025-05-15").toBe(true);
    expect(seed.entries.length).toBeGreaterThan(300);
    expect([...dates].sort()).toEqual(dates);
    expect(new Set(dates).size).toBe(dates.length);
    for (const d of dates) expect([0, 6]).not.toContain(new Date(`${d}T00:00:00Z`).getUTCDay());
  });

  it("only contains entries that match the stored schema", () => {
    for (const e of seed.entries) expect(entryDataSchema.safeParse(e.data).success, e.date).toBe(true);
  });

  it("links project work to tasks that exist, and leaves routine work unlinked", () => {
    const ids = new Set(seed.tasks.map((t) => t.id));
    const items = seed.entries.flatMap((e) => SECTIONS.flatMap((s) => e.data[s]));
    for (const i of items) if (i.taskId) expect(ids.has(i.taskId)).toBe(true);
    expect(items.find((i) => i.text === "Reviewed 3 teammate PRs")?.taskId).toBeUndefined();
    expect(seed.tasks.length).toBeGreaterThan(60);
    for (const note of seed.notes) expect(ids.has(note.taskId)).toBe(true);
  });

  it("tells a task's story across days: the usage API goes blocked → contract → integrated, with notes", () => {
    const task = seed.tasks.find((t) => t.title === "Integrate the usage API into the dashboard");
    const steps = seed.entries.flatMap((e) =>
      SECTIONS.flatMap((s) => e.data[s].filter((i) => i.taskId === task?.id).map(() => s)),
    );
    expect(steps).toContain("blockers");
    expect(steps.at(-1)).toBe("done");
    expect(seed.notes.filter((x) => x.taskId === task?.id).map((x) => x.kind)).toEqual(["fix", "learning"]);
  });

  it("reads like real work: projects, blockers and days off", () => {
    const projects = new Set(seed.entries.flatMap((e) => e.data.done.map((i) => i.project)).filter(Boolean));
    expect(projects.size).toBeGreaterThan(10);
    expect(seed.entries.filter((e) => e.data.blockers.length).length).toBeGreaterThan(10);
    expect(dates).not.toContain("2025-08-15"); // Independence Day off
  });
});

describe("demoHistory", () => {
  it("is deterministic for a seed", () => {
    expect(demoHistory("2026-01-01", "2026-03-01")).toEqual(demoHistory("2026-01-01", "2026-03-01"));
  });
});
