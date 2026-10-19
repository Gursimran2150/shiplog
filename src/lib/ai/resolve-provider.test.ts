import { describe, expect, it } from "vitest";
import { MissingApiKeyError, resolveProvider } from "./resolve-provider";

describe("resolveProvider", () => {
  it("uses the preferred provider when its key exists", () => {
    expect(resolveProvider({ preferred: "openai", hasGemini: true, hasOpenAI: true })).toBe("openai");
  });

  it("falls back to the other provider when the preferred key is missing", () => {
    expect(resolveProvider({ preferred: "gemini", hasGemini: false, hasOpenAI: true })).toBe("openai");
    expect(resolveProvider({ preferred: "openai", hasGemini: true, hasOpenAI: false })).toBe("gemini");
  });

  it("throws when no key is configured", () => {
    expect(() => resolveProvider({ preferred: "gemini", hasGemini: false, hasOpenAI: false })).toThrow(
      MissingApiKeyError,
    );
  });
});
