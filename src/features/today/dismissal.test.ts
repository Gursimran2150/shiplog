import { afterEach, describe, expect, it, vi } from "vitest";
import { readDismissed, writeDismissed } from "./dismissal";

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe("dismissal", () => {
  it("round-trips through localStorage", () => {
    expect(readDismissed("k")).toBe(false);
    writeDismissed("k");
    expect(readDismissed("k")).toBe(true);
  });

  it("fails soft when storage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => writeDismissed("k")).not.toThrow();
    expect(readDismissed("k")).toBe(false);
  });
});
