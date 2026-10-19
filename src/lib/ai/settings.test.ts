// @vitest-environment node
import { describe, expect, it } from "vitest";
import { aiCallSettings } from "./settings";

describe("aiCallSettings", () => {
  const request = new Request("http://localhost/api/x", { method: "POST" });

  it("caps output and lowers reasoning effort for structuring", () => {
    const s = aiCallSettings(request, "structure");
    expect(s.maxOutputTokens).toBeLessThanOrEqual(2048);
    expect(s.providerOptions.google.thinkingConfig.thinkingLevel).toBe("minimal");
    expect(s.providerOptions.openai.reasoningEffort).toBe("minimal");
  });

  it("gives long brag docs a larger budget than standups", () => {
    expect(aiCallSettings(request, "brag").maxOutputTokens).toBeGreaterThan(
      aiCallSettings(request, "standup").maxOutputTokens,
    );
  });

  it("aborts when the client disconnects", () => {
    const controller = new AbortController();
    const s = aiCallSettings(new Request("http://localhost/api/x", { signal: controller.signal }), "ask");
    expect(s.abortSignal.aborted).toBe(false);
    controller.abort();
    expect(s.abortSignal.aborted).toBe(true);
  });
});
