// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ME = "{me-uuid}";

function page(values: unknown[], next?: string) {
  return { values, ...(next ? { next } : {}) };
}

const api: Record<string, unknown> = {
  "/2.0/user": { uuid: ME, username: "asha" },
  "/2.0/repositories": page(
    [
      { full_name: "acme/web", is_private: true },
      { full_name: "acme/legacy", is_private: true },
    ],
    "https://api.bitbucket.org/2.0/repositories?page=2",
  ),
  "/2.0/repositories/acme/web/commits": page([
    {
      date: "2026-10-20T06:00:00+00:00",
      message: "Fix checkout\n\nbody",
      links: { html: { href: "https://bitbucket.org/acme/web/commits/1" } },
      author: { user: { uuid: ME } },
    },
    {
      date: "2026-10-20T07:00:00+00:00",
      message: "Someone else",
      links: { html: { href: "https://bitbucket.org/acme/web/commits/2" } },
      author: { user: { uuid: "{other}" } },
    },
    {
      date: "2026-10-10T07:00:00+00:00",
      message: "Too old",
      links: { html: { href: "https://bitbucket.org/acme/web/commits/3" } },
      author: { user: { uuid: ME } },
    },
  ]),
  "/2.0/repositories/acme/web/pullrequests": page([
    {
      title: "Checkout fix",
      created_on: "2026-10-20T08:00:00+00:00",
      links: { html: { href: "https://bitbucket.org/acme/web/pull-requests/4" } },
    },
  ]),
};

function mockBitbucket(page2 = page([{ full_name: "me/notes", is_private: false }])) {
  return vi.fn(async (input: string, init?: RequestInit) => {
    const url = new URL(input);
    if (url.host === "bitbucket.org" && url.pathname.endsWith("/access_token")) {
      const body = new URLSearchParams(String(init?.body));
      expect(new Headers(init?.headers).get("Authorization")).toMatch(/^Basic /);
      return Response.json({
        access_token: `access-${body.get("grant_type")}`,
        refresh_token: "refresh-2",
        expires_in: 7200,
      });
    }
    if (url.pathname === "/2.0/repositories" && url.searchParams.get("page") === "2") return Response.json(page2);
    const body = api[url.pathname];
    return body ? Response.json(body) : new Response("{}", { status: 404 });
  });
}

describe("Bitbucket", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("BITBUCKET_CLIENT_ID", "key");
    vi.stubEnv("BITBUCKET_CLIENT_SECRET", "secret");
  });
  afterEach(() => vi.unstubAllGlobals());

  it("is disabled without consumer credentials", async () => {
    vi.stubEnv("BITBUCKET_CLIENT_ID", "");
    const { bitbucketConfig } = await import("./bitbucket");
    expect(bitbucketConfig()).toBeNull();
  });

  it("builds the consent URL and exchanges/refreshes codes with Basic auth", async () => {
    vi.stubGlobal("fetch", mockBitbucket());
    const { authorizeUrl, bitbucketConfig, exchangeCode, refreshTokens } = await import("./bitbucket");
    const consumer = bitbucketConfig()!;
    expect(authorizeUrl(consumer, "st")).toBe(
      "https://bitbucket.org/site/oauth2/authorize?client_id=key&response_type=code&state=st",
    );
    const tokens = await exchangeCode(consumer, "code");
    expect(tokens.accessToken).toBe("access-authorization_code");
    expect(tokens.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect((await refreshTokens(consumer, "r")).accessToken).toBe("access-refresh_token");
  });

  it("follows pagination for repos but refuses links that leave the API host", async () => {
    vi.stubGlobal("fetch", mockBitbucket());
    const { memberRepos } = await import("./bitbucket");
    expect((await memberRepos("t", ME)).map((r) => r.fullName)).toEqual(["acme/legacy", "acme/web", "me/notes"]);

    vi.resetModules();
    vi.stubGlobal("fetch", mockBitbucket(page([], "https://evil.example/steal")));
    const fresh = await import("./bitbucket");
    await expect(fresh.memberRepos("t", "{someone}")).rejects.toThrow("Unexpected Bitbucket URL");
  });

  it("returns only the user's own commits and PRs in tracked repos on the local date", async () => {
    const fetch = mockBitbucket(page([]));
    vi.stubGlobal("fetch", fetch);
    const { bitbucketActivity } = await import("./bitbucket");
    const activity = await bitbucketActivity(
      "t",
      { uuid: ME, excluded: ["acme/legacy"] },
      "2026-10-20",
      "2026-10-20",
      "Asia/Kolkata",
    );
    expect(activity.map((a) => `${a.kind}:${a.title}`).sort()).toEqual(["commit:Fix checkout", "pr:Checkout fix"]);
    expect(fetch.mock.calls.some(([u]) => String(u).includes("acme/legacy/"))).toBe(false);
  });
});

describe("bitbucketSession", () => {
  const stored = {
    accountUuid: ME,
    username: "asha",
    excluded: [],
  };
  const getBitbucketConnection = vi.fn();
  const saveBitbucketConnection = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("BITBUCKET_CLIENT_ID", "key");
    vi.stubEnv("BITBUCKET_CLIENT_SECRET", "secret");
    vi.stubEnv("AUTH_SECRET", "x".repeat(40));
    vi.doMock("@/lib/db/repo", () => ({ getBitbucketConnection, saveBitbucketConnection }));
    getBitbucketConnection.mockReset();
    saveBitbucketConnection.mockReset();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("uses the stored token while it is fresh", async () => {
    const { encryptSecret } = await import("./crypto");
    getBitbucketConnection.mockResolvedValue({
      ...stored,
      sealedAccessToken: encryptSecret("live-token"),
      sealedRefreshToken: encryptSecret("refresh"),
      expiresAt: new Date(Date.now() + 3600_000),
    });
    const { bitbucketSession } = await import("./bitbucket-session");
    expect((await bitbucketSession("u"))?.token).toBe("live-token");
    expect(saveBitbucketConnection).not.toHaveBeenCalled();
  });

  it("refreshes an expiring token and stores the new pair encrypted", async () => {
    vi.stubGlobal("fetch", mockBitbucket());
    const { encryptSecret, decryptSecret } = await import("./crypto");
    getBitbucketConnection.mockResolvedValue({
      ...stored,
      sealedAccessToken: encryptSecret("old"),
      sealedRefreshToken: encryptSecret("refresh"),
      expiresAt: new Date(Date.now() + 60_000),
    });
    const { bitbucketSession } = await import("./bitbucket-session");
    expect((await bitbucketSession("u"))?.token).toBe("access-refresh_token");
    const saved = saveBitbucketConnection.mock.calls[0][1];
    expect(saved.sealedAccessToken).not.toContain("access-refresh_token");
    expect(decryptSecret(saved.sealedRefreshToken)).toBe("refresh-2");
  });
});
