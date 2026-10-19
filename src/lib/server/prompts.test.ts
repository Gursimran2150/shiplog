import { describe, expect, it } from "vitest";
import type { Entry } from "@/lib/domain/types";
import { askPrompt, formatEntries, reportPrompt, structurePrompt, ticketPrompt } from "./prompts";

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
    expect(structurePrompt("2026-10-20", "commit abc")).toContain("<reference>\ncommit abc");
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
});
