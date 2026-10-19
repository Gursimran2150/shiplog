import { afterEach, describe, expect, it } from "vitest";
import type { EntryData } from "@/lib/domain/types";
import { addItem, itemCount, removeItem, updateItem } from "./entry-edit";

const data: EntryData = {
  summary: "s",
  done: [
    { text: "Fixed login", project: "web" },
    { text: "Merged PR", project: null },
  ],
  inProgress: [],
  blockers: [{ text: "Staging down", project: "infra" }],
  tomorrow: [],
};
const snapshot = structuredClone(data);

afterEach(() => {
  // No helper may mutate its input.
  expect(data).toEqual(snapshot);
});

describe("updateItem", () => {
  it("replaces the trimmed text and keeps the project, without mutating", () => {
    const next = updateItem(data, "done", 0, "  Fixed login redirect ");
    expect(next.done[0]).toEqual({ text: "Fixed login redirect", project: "web" });
    expect(next.done[1]).toBe(data.done[1]);
    expect(next.blockers).toBe(data.blockers);
    expect(data.done[0].text).toBe("Fixed login");
  });
  it("returns the same object for blank, unchanged or missing items", () => {
    expect(updateItem(data, "done", 0, "   ")).toBe(data);
    expect(updateItem(data, "done", 0, "Fixed login")).toBe(data);
    expect(updateItem(data, "done", 5, "x")).toBe(data);
  });
});

describe("removeItem", () => {
  it("drops the item at the index", () => {
    const next = removeItem(data, "done", 0);
    expect(next.done).toEqual([{ text: "Merged PR", project: null }]);
    expect(data.done).toHaveLength(2);
  });
  it("ignores out-of-range indexes", () => {
    expect(removeItem(data, "done", -1)).toBe(data);
    expect(removeItem(data, "tomorrow", 0)).toBe(data);
  });
});

describe("addItem", () => {
  it("appends a trimmed item with no project", () => {
    const next = addItem(data, "tomorrow", " Ship charts ");
    expect(next.tomorrow).toEqual([{ text: "Ship charts", project: null }]);
    expect(data.tomorrow).toHaveLength(0);
  });
  it("ignores blank text", () => {
    expect(addItem(data, "tomorrow", "  ")).toBe(data);
  });
});

describe("itemCount", () => {
  it("sums every section", () => {
    expect(itemCount(data)).toBe(3);
  });
});
