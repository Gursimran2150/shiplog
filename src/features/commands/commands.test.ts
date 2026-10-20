import { describe, expect, it } from "vitest";
import { COMMANDS, filterCommands, isTypingTarget } from "./commands";

describe("filterCommands", () => {
  it("returns everything for an empty query", () => {
    expect(filterCommands("  ")).toHaveLength(COMMANDS.length);
  });

  it("matches labels and keywords, requiring every word", () => {
    expect(filterCommands("standup").map((c) => c.id)).toEqual(["go:/reports"]);
    expect(filterCommands("dark theme").map((c) => c.id)).toEqual(["theme:dark"]);
    expect(filterCommands("STREAK").map((c) => c.id)).toEqual(["go:/timeline"]);
    expect(filterCommands("nothing-matches-this")).toEqual([]);
  });
});

describe("isTypingTarget", () => {
  it("detects text fields but not buttons", () => {
    expect(isTypingTarget(document.createElement("textarea"))).toBe(true);
    expect(isTypingTarget(document.createElement("input"))).toBe(true);
    expect(isTypingTarget(document.createElement("button"))).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });

  it("finds the PR writer and the waiting-on board by everyday words", () => {
    expect(filterCommands("pull request").map((c) => c.id)).toEqual(["go:/reports?tab=pr"]);
    expect(filterCommands("nudge").map((c) => c.id)).toEqual(["go:/#waiting"]);
    expect(new Set(COMMANDS.map((c) => c.id)).size).toBe(COMMANDS.length);
  });
});
