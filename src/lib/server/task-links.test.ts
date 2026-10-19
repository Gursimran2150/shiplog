import { describe, expect, it, vi } from "vitest";
import type { TaskSummary } from "@/lib/domain/types";

vi.mock("@/lib/db/tasks", () => ({ insertTasks: vi.fn(), openTasks: vi.fn() }));
const { aliasTasks, entryWithAliases, resolveTaskRefs, withEntryTasks } = await import("./task-links");

const task = (id: string, title: string, status: TaskSummary["status"] = "blocked"): TaskSummary => ({
  id,
  title,
  project: "dashboard",
  status,
  firstDate: "2026-10-01",
  lastDate: "2026-10-05",
  events: 3,
  notes: 0,
});
const empty = { summary: "s", done: [], inProgress: [], blockers: [], tomorrow: [] };

describe("task links", () => {
  it("shows the model short aliases and maps them back to ids", () => {
    const { text, aliases } = aliasTasks([
      task("uuid-a", "Integrate usage API"),
      task("uuid-b", "CSV export", "in_progress"),
    ]);
    expect(text).toBe(
      "t1: Integrate usage API [dashboard] (blocked, last 2026-10-05)\nt2: CSV export [dashboard] (in progress, last 2026-10-05)",
    );
    expect(aliases.get("t2")).toBe("uuid-b");
  });

  it("links known aliases, creates one task per new piece of work, and leaves routine work unlinked", () => {
    let n = 0;
    const { data, created } = resolveTaskRefs(
      {
        ...empty,
        done: [
          { text: "Integrated usage API", project: "dashboard", task: "t1" },
          { text: "Reviewed 3 PRs", project: null, task: null },
        ],
        inProgress: [{ text: "Working on CSV export (40% done)", project: "dashboard", task: "new: CSV export" }],
        blockers: [{ text: "Export API not ready (waiting on Rahul)", project: "dashboard", task: "new" }],
        tomorrow: [
          { text: "Finish the export", project: "dashboard", task: "New: CSV export" },
          { text: "Made-up alias", project: null, task: "t99" },
        ],
      },
      new Map([["t1", "uuid-a"]]),
      () => `new-${++n}`,
    );
    expect(data.done).toEqual([
      { text: "Integrated usage API", project: "dashboard", taskId: "uuid-a" },
      { text: "Reviewed 3 PRs", project: null },
    ]);
    expect(data.inProgress[0].taskId).toBe("new-1");
    expect(data.tomorrow.map((i) => i.taskId)).toEqual(["new-1", "new-3"]);
    // "new: <name>" names the task; a bare "new" falls back to the text without progress notes.
    expect(created.map((c) => c.title)).toEqual(["CSV export", "Export API not ready", "Made-up alias"]);
  });

  it("keeps an entry's existing links when the model rewrites it", () => {
    const data = { ...empty, done: [{ text: "Shipped", project: null, taskId: "uuid-done" }] };
    const aliases = withEntryTasks(new Map([["t1", "uuid-a"]]), data);
    expect(aliases.get("t2")).toBe("uuid-done");
    expect(entryWithAliases(data, aliases).done[0].task).toBe("t2");
  });
});
