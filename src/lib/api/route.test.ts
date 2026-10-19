// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const requireUser = vi.fn();
vi.mock("@/lib/auth/session", async (orig) => ({
  ...(await orig<typeof import("@/lib/auth/session")>()),
  requireUser: (r: Request) => requireUser(r),
}));

const USER = { id: "u1", name: "Asha", email: "a@b.co", isDemo: false };

function req(body?: unknown, headers: Record<string, string> = {}) {
  return new Request("https://saathi.app/api/x", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe("route wrappers", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("RATE_LIMIT_PER_MINUTE", "2");
    requireUser.mockResolvedValue({ ok: true, user: USER });
  });

  it("userRoute passes the session user and the validated body", async () => {
    const { userRoute } = await import("./route");
    const handler = vi.fn(({ user, body }) => Response.json({ id: user.id, n: body.n }));
    const res = await userRoute({ body: z.object({ n: z.number() }) }, handler)(req({ n: 3 }));
    expect(await res.json()).toEqual({ id: "u1", n: 3 });
  });

  it("userRoute stops at a missing session before running the handler", async () => {
    requireUser.mockResolvedValue({ ok: false, response: new Response(null, { status: 401 }) });
    const { userRoute } = await import("./route");
    const handler = vi.fn();
    expect((await userRoute({}, handler)(req())).status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("rejects invalid bodies with 400", async () => {
    const { userRoute } = await import("./route");
    const res = await userRoute({ body: z.object({ n: z.number() }) }, vi.fn())(req({ n: "x" }));
    expect(res.status).toBe(400);
  });

  it("publicRoute blocks cross-site mutations", async () => {
    const { publicRoute } = await import("./route");
    const res = await publicRoute({}, vi.fn())(req(undefined, { origin: "https://evil.example" }));
    expect(res.status).toBe(403);
  });

  it("applies the rate limit when asked", async () => {
    const { publicRoute } = await import("./route");
    const route = publicRoute({ rateLimit: true }, () => new Response("ok"));
    await route(req());
    await route(req());
    expect((await route(req())).status).toBe(429);
  });

  it("turns unexpected errors into a safe 500", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { userRoute } = await import("./route");
    const res = await userRoute({}, () => {
      throw new Error("db password leaked");
    })(req());
    expect(res.status).toBe(500);
    expect(await res.text()).not.toContain("password");
  });
});
