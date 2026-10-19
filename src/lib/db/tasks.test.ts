import { describe, expect, it, vi } from "vitest";

vi.mock("./client", () => ({ db: vi.fn() }));
const { deriveStatus } = await import("./tasks");

describe("deriveStatus", () => {
  it("follows the latest day of work: blocked, still in progress, or done", () => {
    expect(deriveStatus(true, ["blockers", "inProgress"])).toBe("blocked");
    expect(deriveStatus(true, ["done", "inProgress"])).toBe("in_progress");
    expect(deriveStatus(true, ["done", "tomorrow"])).toBe("done");
    expect(deriveStatus(false, [])).toBe("planned");
  });
});
