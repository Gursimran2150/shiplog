// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("getEnv", () => {
  beforeEach(() => vi.resetModules());

  it("treats blank values as unset instead of failing validation", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("OPENAI_API_KEY", "  ");
    const { getEnv } = await import("./env");
    expect(getEnv().GEMINI_API_KEY).toBeUndefined();
    expect(getEnv().OPENAI_API_KEY).toBeUndefined();
  });

  it("applies defaults", async () => {
    vi.stubEnv("AI_PROVIDER", "");
    const { getEnv } = await import("./env");
    expect(getEnv().AI_PROVIDER).toBe("gemini");
  });
});
