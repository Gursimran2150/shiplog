import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toPlainText, useCopy } from "./useAnswerActions";

describe("toPlainText", () => {
  it("converts markdown bold to Slack-style bold", () => {
    expect(toPlainText("Shipped **login fix**")).toBe("Shipped *login fix*");
  });
});

describe("useCopy", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("copies text and resets the flag", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const { result } = renderHook(() => useCopy("**Hi**", 1000));
    await act(() => result.current.copy());
    expect(writeText).toHaveBeenCalledWith("*Hi*");
    expect(result.current.copied).toBe(true);
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.copied).toBe(false);
  });
});
