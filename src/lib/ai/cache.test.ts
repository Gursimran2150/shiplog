// @vitest-environment node
import { describe, expect, it } from "vitest";
import { cacheKey, createAnswerCache } from "./cache";

describe("createAnswerCache", () => {
  it("returns stored answers until they expire", () => {
    let t = 0;
    const cache = createAnswerCache(10, 1000, () => t);
    cache.set("k", "answer");
    expect(cache.get("k")).toBe("answer");
    t = 1000;
    expect(cache.get("k")).toBeUndefined();
    expect(cache.size).toBe(0);
  });

  it("evicts the least recently used entry when full", () => {
    const cache = createAnswerCache(2, 60_000, () => 0);
    cache.set("a", "1");
    cache.set("b", "2");
    cache.get("a"); // a is now most recent
    cache.set("c", "3");
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("a")).toBe("1");
    expect(cache.get("c")).toBe("3");
  });
});

describe("cacheKey", () => {
  it("is stable for equal input and differs by task or input", () => {
    const input = { topic: "wages", language: "hi" };
    expect(cacheKey("rights", input)).toBe(cacheKey("rights", { ...input }));
    expect(cacheKey("rights", input)).not.toBe(cacheKey("schemes", input));
    expect(cacheKey("rights", input)).not.toBe(cacheKey("rights", { ...input, language: "en" }));
  });
});
