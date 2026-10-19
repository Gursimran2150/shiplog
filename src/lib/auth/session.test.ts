// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { signSession } from "./token";

const SECRET = "s".repeat(40);
const user = { id: "6f1c2c1e-0000-4000-8000-000000000001", name: "Asha", email: "a@b.co", isDemo: true };

function req(method: string, headers: Record<string, string> = {}) {
  return new Request("https://saathi.app/api/profile", { method, headers });
}

describe("requireUser", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("AUTH_SECRET", SECRET);
  });

  it("accepts a valid session cookie", async () => {
    const { requireUser } = await import("./session");
    const token = await signSession(user, SECRET);
    const result = await requireUser(req("GET", { cookie: `other=1; saathi_session=${token}` }));
    expect(result).toEqual({ ok: true, user });
  });

  it("returns 401 without a session", async () => {
    const { requireUser } = await import("./session");
    const result = await requireUser(req("GET"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(401);
  });

  it("blocks cross-site mutations (CSRF) even with a valid cookie", async () => {
    const { requireUser } = await import("./session");
    const token = await signSession(user, SECRET);
    const result = await requireUser(
      req("POST", { cookie: `saathi_session=${token}`, origin: "https://evil.example" }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(403);
  });

  it("sets an HttpOnly, SameSite session cookie", async () => {
    const { sessionCookie, clearSessionCookie } = await import("./session");
    const cookie = await sessionCookie(user);
    expect(cookie).toMatch(/^saathi_session=.+; Path=\/; HttpOnly; SameSite=Lax; Max-Age=\d+/);
    expect(clearSessionCookie()).toContain("Max-Age=0");
  });
});
