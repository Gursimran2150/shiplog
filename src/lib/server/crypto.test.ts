// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("token encryption", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("AUTH_SECRET", "a".repeat(40));
  });

  it("round-trips and never stores plain text", async () => {
    const { decryptSecret, encryptSecret } = await import("./crypto");
    const sealed = encryptSecret("refresh-token-123");
    expect(sealed).not.toContain("refresh-token-123");
    expect(encryptSecret("refresh-token-123")).not.toBe(sealed); // random IV
    expect(decryptSecret(sealed)).toBe("refresh-token-123");
  });

  it("rejects tampered data and a different secret", async () => {
    const { decryptSecret, encryptSecret } = await import("./crypto");
    const sealed = encryptSecret("token");
    const flipped = sealed.slice(0, -2) + (sealed.endsWith("A") ? "BB" : "AA");
    expect(() => decryptSecret(flipped)).toThrow();

    vi.resetModules();
    vi.stubEnv("AUTH_SECRET", "b".repeat(40));
    const other = await import("./crypto");
    expect(() => other.decryptSecret(sealed)).toThrow();
  });
});
