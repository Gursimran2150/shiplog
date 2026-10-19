import { describe, expect, it } from "vitest";
import type { TaskEvent, TaskSummary } from "@/lib/domain/types";
import { buildSteps, groupTasks, journeyStats } from "./journey-steps";

const ev = (date: string, section: TaskEvent["section"], text = "x"): TaskEvent => ({
  entryId: date,
  date,
  section,
  index: 0,
  text,
});

describe("buildSteps", () => {
  it("names each day's transition: planned → started → blocked → unblocked → done", () => {
    const steps = buildSteps([
      ev("2026-10-01", "tomorrow"),
      ev("2026-10-02", "inProgress"),
      ev("2026-10-05", "blockers"),
      ev("2026-10-05", "inProgress"),
      ev("2026-10-06", "blockers"),
      ev("2026-10-07", "inProgress"),
      ev("2026-10-08", "inProgress"),
      ev("2026-10-09", "done"),
    ]);
    expect(steps.map((s) => s.kind)).toEqual([
      "planned",
      "started",
      "blocked",
      "blocked",
      "unblocked",
      "progress",
      "done",
    ]);
    expect(steps[2].events).toHaveLength(2);
    expect(journeyStats(steps)).toEqual({ days: 9, blockedDays: 2 });
  });

  it("calls finished pieces milestones until the last day of work", () => {
    const steps = buildSteps([
      ev("2026-10-01", "done"),
      ev("2026-10-02", "done"),
      ev("2026-10-02", "inProgress"),
      ev("2026-10-03", "done"),
      ev("2026-10-04", "tomorrow"),
    ]);
    expect(steps.map((s) => s.kind)).toEqual(["milestone", "milestone", "done", "planned"]);
  });

  it("handles an empty journey", () => {
    expect(buildSteps([])).toEqual([]);
    expect(journeyStats([])).toEqual({ days: 0, blockedDays: 0 });
  });
});

const task = (id: string, project: string | null, status: TaskSummary["status"], title = id): TaskSummary => ({
  id,
  title,
  project,
  status,
  firstDate: null,
  lastDate: null,
  events: 1,
  notes: 0,
});

describe("groupTasks", () => {
  const tasks = [
    task("a", "dashboard", "blocked", "Usage API"),
    task("b", "checkout", "done", "Safari crash"),
    task("c", "dashboard", "done", "KPI cards"),
    task("d", null, "in_progress", "Flaky tests"),
  ];

  it("groups by project in activity order and counts open tasks", () => {
    const groups = groupTasks(tasks, "", "all");
    expect(groups.map((g) => [g.project, g.tasks.map((t) => t.id), g.open])).toEqual([
      ["dashboard", ["a", "c"], 1],
      ["checkout", ["b"], 0],
      ["Other work", ["d"], 1],
    ]);
  });

  it("filters by status and by search text over title and project", () => {
    expect(groupTasks(tasks, "", "open").flatMap((g) => g.tasks.map((t) => t.id))).toEqual(["a", "d"]);
    expect(groupTasks(tasks, "", "blocked").flatMap((g) => g.tasks.map((t) => t.id))).toEqual(["a"]);
    expect(groupTasks(tasks, "CHECKOUT", "all").flatMap((g) => g.tasks.map((t) => t.id))).toEqual(["b"]);
    expect(groupTasks(tasks, "kpi", "done").flatMap((g) => g.tasks.map((t) => t.id))).toEqual(["c"]);
  });
});
