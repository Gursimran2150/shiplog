import { describe, expect, it } from "vitest";
import type { TaskEvent } from "./types";
import { blockedSince, groupByPerson, parseWaitingOn } from "./waiting";

describe("parseWaitingOn", () => {
  it.each([
    ["Feature flags take ~10 min to update in the EU (waiting on Karan)", "Karan"],
    ["GST invoice format pending (waiting on Priya from finance)", "Priya"],
    ["Usage API not ready, waiting on Rahul from backend", "Rahul"],
    ["Staging deploy blocked on DevOps", "DevOps"],
    ["Copy not final (waiting for the design team)", "Design team"],
    ["Usage API endpoint not ready from backend", null],
    ["waiting on backend to ship", null],
  ])("%s → %s", (text, who) => {
    expect(parseWaitingOn(text)).toBe(who);
  });
});

const ev = (date: string, section: TaskEvent["section"]): TaskEvent => ({
  entryId: date,
  date,
  section,
  index: 0,
  text: "",
});

describe("blockedSince", () => {
  it("starts at the first blocker after the last unblocked work, ignoring planning-only days", () => {
    const events = [
      ev("2026-10-01", "blockers"),
      ev("2026-10-02", "inProgress"),
      ev("2026-10-05", "blockers"),
      ev("2026-10-06", "tomorrow"),
      ev("2026-10-07", "blockers"),
      ev("2026-10-07", "inProgress"),
    ];
    expect(blockedSince(events)).toBe("2026-10-05");
    expect(blockedSince([...events, ev("2026-10-08", "done")])).toBeNull();
  });
});

describe("groupByPerson", () => {
  it("groups case-insensitively, longest wait first, unknown owner last", () => {
    const groups = groupByPerson([
      { person: "Karan", since: "2026-10-19" },
      { person: null, since: "2026-10-01" },
      { person: "neha", since: "2026-10-14" },
      { person: "Neha", since: "2026-10-16" },
    ]);
    expect(groups.map((g) => [g.person, g.items.map((i) => i.since)])).toEqual([
      ["neha", ["2026-10-14", "2026-10-16"]],
      ["Karan", ["2026-10-19"]],
      [null, ["2026-10-01"]],
    ]);
  });
});
