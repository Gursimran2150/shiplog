// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const commits = {
  items: [
    {
      html_url: "https://github.com/acme/web/commit/abc",
      commit: { message: "Fix login redirect\n\nlong body", committer: { date: "2026-10-20T18:00:00Z" } }, // 23:30 IST
      repository: { full_name: "acme/web" },
    },
    {
      html_url: "https://github.com/acme/web/commit/def",
      commit: { message: "Late night commit", committer: { date: "2026-10-20T20:00:00Z" } }, // 01:30 IST next day
      repository: { full_name: "acme/web" },
    },
  ],
};
const prs = {
  items: [
    {
      html_url: "https://github.com/acme/web/pull/7",
      title: "Dashboard charts",
      created_at: "2026-10-20T05:00:00Z",
      repository_url: "https://api.github.com/repos/acme/web",
    },
  ],
};

function mockFetch(ok = true) {
  return vi.fn(async (url: string) => {
    if (!ok) return new Response("{}", { status: 403 });
    return Response.json(url.includes("/search/commits") ? commits : prs);
  });
}

describe("fetchActivity", () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => vi.unstubAllGlobals());

  it("returns commits and PRs on the local date, first line only", async () => {
    const fetch = mockFetch();
    vi.stubGlobal("fetch", fetch);
    const { fetchActivity, formatActivity } = await import("./github");
    const activity = await fetchActivity("octo", "2026-10-20", "2026-10-20", "Asia/Kolkata");
    expect(activity.map((a) => a.title)).toEqual(["Fix login redirect", "Dashboard charts"]);
    expect(activity[1]).toMatchObject({ kind: "pr", repo: "acme/web" });
    expect(formatActivity(activity)).toContain("PR [acme/web] Dashboard charts");
  });

  it("caches repeat queries", async () => {
    const fetch = mockFetch();
    vi.stubGlobal("fetch", fetch);
    const { fetchActivity } = await import("./github");
    await fetchActivity("octo", "2026-10-20", "2026-10-20", "Asia/Kolkata");
    await fetchActivity("OCTO", "2026-10-20", "2026-10-20", "Asia/Kolkata");
    expect(fetch).toHaveBeenCalledTimes(2); // one commits + one PR search, then cached
  });

  it("never throws when GitHub fails", async () => {
    vi.stubGlobal("fetch", mockFetch(false));
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { fetchActivity } = await import("./github");
    expect(await fetchActivity("octo", "2026-10-20", "2026-10-20", "UTC")).toEqual([]);
  });
});
