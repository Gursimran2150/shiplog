import { describe, expect, it } from "vitest";
import { readResults } from "./useSpeechDictation";

const result = (transcript: string, isFinal: boolean) => ({ isFinal, 0: { transcript } });

describe("readResults", () => {
  it("separates new final text from the interim guess, skipping already-read results", () => {
    const e = {
      resultIndex: 1,
      results: [result("old phrase ", true), result(" aaj login fix kiya", true), result(" PR raise", false)],
    };
    expect(readResults(e)).toEqual({ final: "aaj login fix kiya", interim: "PR raise" });
  });
});
