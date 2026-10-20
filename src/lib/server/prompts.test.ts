import { describe, expect, it } from "vitest";
import type { Entry } from "@/lib/domain/types";
import {
  askPrompt,
  formatEntries,
  formatJourney,
  nudgePrompt,
  postmortemPrompt,
  prPrompt,
  refinePrompt,
  reportPrompt,
  structurePrompt,
  ticketPrompt,
} from "./prompts";

const entry = (date: string, done: string, project: string | null = "web"): Entry => ({
  id: date,
  date,
  raw: done,
  words: 3,
  createdAt: `${date}T10:00:00Z`,
  data: { summary: done, done: [{ text: done, project }], inProgress: [], blockers: [], tomorrow: [] },
});

describe("formatEntries", () => {
  it("lists entries oldest first with section labels and projects", () => {
    const text = formatEntries([entry("2026-10-20", "Shipped B"), entry("2026-10-19", "Shipped A", null)]);
    expect(text.indexOf("2026-10-19")).toBeLessThan(text.indexOf("2026-10-20"));
    expect(text).toContain("Done: Shipped A\n");
    expect(text).toContain("Done: Shipped B [web]");
  });
});

describe("prompts", () => {
  it("structure prompt includes GitHub activity as reference only when given", () => {
    expect(structurePrompt("2026-10-20", "")).not.toContain("<reference>");
    expect(structurePrompt("2026-10-20", "commit abc")).toContain("<reference>\nGitHub activity:\ncommit abc");
    expect(structurePrompt("2026-10-20", "", "t1: CSV export")).toContain("Open tasks:\nt1: CSV export");
    expect(structurePrompt("2026-10-20", "")).toContain("Hinglish");
  });

  it("report prompt applies the standup format and includes the entries", () => {
    const p = reportPrompt("standup", "slack", [entry("2026-10-20", "Fixed login")], "2026-10-19", "2026-10-20");
    expect(p.system).toContain("Slack");
    expect("prompt" in p && p.prompt).toContain("Fixed login");
    expect(reportPrompt("brag", "slack", [], "2026-07-01", "2026-10-20").system).toContain("impact");
  });

  it("ticket and ask prompts wrap user text as data", () => {
    const t = ticketPrompt("API not ready", "context");
    expect("prompt" in t && t.prompt).toContain("<user_input>\nAPI not ready");
    const a = askPrompt("what did I ship?", [entry("2026-10-20", "Shipped X")], "2026-10-20");
    expect(a.system).toContain("Shipped X");
    expect(askPrompt("q", [], "2026-10-20").system).toContain("No journal entries found.");
  });

  it("structure prompt asks for follow-ups; refine prompt wraps answers as data", () => {
    expect(structurePrompt("2026-10-20", "")).toContain("followUps");
    const r = refinePrompt(entry("2026-10-20", "Shipped X").data, [{ question: "Waiting on whom?", answer: "Rahul" }]);
    expect("prompt" in r && r.prompt).toContain("<user_input>\nQ: Waiting on whom?\nA: Rahul");
    expect(r.system).toContain("Shipped X");
  });
});

describe("journey prompts", () => {
  const journey = formatJourney(
    {
      id: "t",
      title: "Usage API",
      project: "dashboard",
      status: "blocked",
      firstDate: null,
      lastDate: null,
      events: 1,
      notes: 1,
    },
    [{ entryId: "e", date: "2026-10-14", section: "blockers", index: 0, text: "API not ready (waiting on Rahul)" }],
    [{ id: "n", kind: "fix", body: "Agreed the contract first", createdAt: "x" }],
  );

  it("renders a journey as dated log lines and labelled notes", () => {
    expect(journey).toBe(
      "Task: Usage API [dashboard] (status: blocked)\nLog:\n2026-10-14 Blockers: API not ready (waiting on Rahul)\nNotes:\nHow it was fixed: Agreed the contract first",
    );
  });

  it("nudge: addresses the person, counts the days, follows the tone", () => {
    const p = nudgePrompt(journey, "API not ready", "Rahul", "2026-10-14", "2026-10-19", "firm");
    expect(p.system).toContain("to Rahul");
    expect(p.system).toContain("Blocked since: Wed, 14 Oct (5 days)");
    expect(p.system).toContain("never as YYYY-MM-DD");
    expect(p.system).toContain("polite but firm");
    expect(nudgePrompt(journey, "x", null, "2026-10-19", "2026-10-19", "friendly").system).toContain("(today)");
  });

  it("PR: wraps the spoken summary as data, adds the ticket and optional journey", () => {
    const p = prPrompt("charts ko API se joda", journey, "DASH-42");
    expect("prompt" in p && p.prompt).toContain("<user_input>\ncharts ko API se joda");
    expect(p.system).toContain("Closes DASH-42");
    expect(p.system).toContain("Task: Usage API");
    expect(prPrompt("x", null, "").system).not.toContain("Closes");
  });

  it("postmortem: grounded on the journey and blameless", () => {
    const p = postmortemPrompt(journey, "2026-10-19");
    expect(p.system).toContain("Not recorded in the journal.");
    expect(p.system).toContain("Never blame a person");
    expect(p.system).toContain("How it was fixed: Agreed the contract first");
  });

  it("structure prompt keeps 'who we wait on' machine-readable", () => {
    expect(structurePrompt("2026-10-20", "")).toContain("(waiting on <name or team>)");
  });
});
