import { describe, expect, it } from "vitest";
import type { EntryData } from "@/lib/domain/types";
import { appendStarter, appendToDone, countWords, repoFromUrl } from "./log-text";

const data: EntryData = {
  summary: "s",
  done: [{ text: "Fixed login", project: "web" }],
  inProgress: [],
  blockers: [],
  tomorrow: [],
};

describe("countWords", () => {
  it("counts whitespace-separated words", () => {
    expect(countWords("  aaj login bug\nfix kiya  ")).toBe(5);
  });
  it("returns 0 for blank text", () => {
    expect(countWords("   ")).toBe(0);
  });
});

describe("appendToDone", () => {
  it("appends without mutating the input", () => {
    const next = appendToDone(data, "Merged PR #4", "api");
    expect(next.done).toEqual([...data.done, { text: "Merged PR #4", project: "api" }]);
    expect(data.done).toHaveLength(1);
  });
  it("skips duplicates", () => {
    expect(appendToDone(data, "Fixed login")).toBe(data);
  });
});

describe("repoFromUrl", () => {
  it("extracts owner/repo from GitHub links only", () => {
    expect(repoFromUrl("https://github.com/acme/web/commit/abc")).toBe("acme/web");
    expect(repoFromUrl("https://evil.com/acme/web")).toBeNull();
  });
});

describe("appendStarter", () => {
  it("starts an empty box with the phrase", () => {
    expect(appendStarter("", "Finished: ")).toBe("Finished: ");
  });
  it("puts the phrase on a new line, trimming trailing spaces", () => {
    expect(appendStarter("fixed CI  ", "Blocked on: ")).toBe("fixed CI\nBlocked on: ");
  });
  it("does not add a blank line when the text already ends with one", () => {
    expect(appendStarter("fixed CI\n", "Tomorrow: ")).toBe("fixed CI\nTomorrow: ");
  });
  it("leaves the text alone when the phrase would not fit", () => {
    expect(appendStarter("abc", "Tomorrow: ", 8)).toBe("abc");
  });
});
