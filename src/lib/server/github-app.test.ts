// @vitest-environment node
import { generateKeyPairSync } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const PEM = privateKey.export({ type: "pkcs1", format: "pem" }).toString();

function stubAppEnv() {
  vi.stubEnv("GITHUB_APP_ID", "123");
  vi.stubEnv("GITHUB_APP_SLUG", "shiplog-test");
  vi.stubEnv("GITHUB_APP_CLIENT_ID", "client");
  vi.stubEnv("GITHUB_APP_CLIENT_SECRET", "secret");
  vi.stubEnv("GITHUB_APP_PRIVATE_KEY", PEM.replaceAll("\n", "\\n")); // as stored in a one-line env var
}

const routes: Record<string, unknown> = {
  "/app/installations/9/access_tokens": {
    token: "inst-token",
    expires_at: new Date(Date.now() + 3600_000).toISOString(),
  },
  "/installation/repositories": {
    total_count: 3,
    repositories: [
      { full_name: "acme/web", private: true },
      { full_name: "acme/api", private: true },
      { full_name: "me/dotfiles", private: false },
    ],
  },
  "/repos/acme/web/commits": [
    {
      html_url: "https://github.com/acme/web/commit/1",
      commit: { message: "Fix login\n\nbody", committer: { date: "2026-10-20T06:00:00Z" } },
    },
  ],
  "/repos/acme/api/commits": [
    {
      html_url: "https://github.com/acme/api/commit/2",
      commit: { message: "Add endpoint", committer: { date: "2026-10-20T07:00:00Z" } },
    },
  ],
  "/search/issues": {
    items: [
      {
        html_url: "https://github.com/acme/web/pull/5",
        title: "Login fix",
        created_at: "2026-10-20T08:00:00Z",
        repository_url: "https://api.github.com/repos/acme/web",
      },
      {
        html_url: "https://github.com/other/x/pull/1",
        title: "Untracked",
        created_at: "2026-10-20T08:00:00Z",
        repository_url: "https://api.github.com/repos/other/x",
      },
    ],
  },
  "/user": { login: "asha" },
  "/user/installations": { installations: [{ id: 9 }] },
};

function mockGithub() {
  return vi.fn(async (input: string, init?: RequestInit) => {
    const url = new URL(input);
    if (url.host === "github.com") return Response.json({ access_token: "user-token" });
    const body = routes[url.pathname];
    expect(new Headers(init?.headers).get("Authorization")).toMatch(/^Bearer /);
    return body ? Response.json(body) : new Response("{}", { status: 404 });
  });
}

describe("GitHub App", () => {
  beforeEach(() => {
    vi.resetModules();
    stubAppEnv();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("is disabled when not configured", async () => {
    vi.stubEnv("GITHUB_APP_ID", "");
    const { appConfig } = await import("./github-app");
    expect(appConfig()).toBeNull();
  });

  it("reads tracked repos only, keeps PRs from tracked repos, and reuses the installation token", async () => {
    const fetch = mockGithub();
    vi.stubGlobal("fetch", fetch);
    const { appConfig, privateActivity } = await import("./github-app");
    const app = appConfig()!;
    const conn = { installationId: 9, login: "asha", excluded: ["acme/api"] };

    const activity = await privateActivity(app, conn, "2026-10-20", "2026-10-20", "Asia/Kolkata");
    expect(activity.map((a) => a.title).sort()).toEqual(["Fix login", "Login fix"]);
    expect(fetch.mock.calls.some(([u]) => String(u).includes("/repos/acme/api/"))).toBe(false);

    await privateActivity(app, conn, "2026-10-20", "2026-10-20", "Asia/Kolkata");
    const tokenCalls = fetch.mock.calls.filter(([u]) => String(u).includes("/access_tokens"));
    expect(tokenCalls).toHaveLength(1);
  });

  it("accepts an installation only when GitHub confirms the user can access it", async () => {
    vi.stubGlobal("fetch", mockGithub());
    const { appConfig, verifyInstallation } = await import("./github-app");
    expect(await verifyInstallation(appConfig()!, "code", 9)).toBe("asha");
    expect(await verifyInstallation(appConfig()!, "code", 10)).toBeNull();
  });
});

describe("install state", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("AUTH_SECRET", "s".repeat(40));
  });

  it("is bound to the user who started the flow", async () => {
    const { signInstallState, verifyInstallState } = await import("./github-state");
    const state = await signInstallState("user-1");
    expect(await verifyInstallState(state, "user-1")).toBe(true);
    expect(await verifyInstallState(state, "user-2")).toBe(false);
    expect(await verifyInstallState(`${state}x`, "user-1")).toBe(false);
  });
});
