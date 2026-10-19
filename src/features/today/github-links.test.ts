import { describe, expect, it } from "vitest";
import { buildIssueUrl, isValidRepo, safeGithubUrl, ticketToText } from "./github-links";

const ticket = { title: "Fix flaky login", body: "Steps & details", labels: ["bug", "auth"] };

describe("isValidRepo", () => {
  it("accepts owner/repo", () => {
    expect(isValidRepo("vercel/next.js")).toBe(true);
    expect(isValidRepo(" acme/web ")).toBe(true);
  });
  it("rejects paths, URLs and dot segments", () => {
    for (const bad of ["acme", "acme/web/issues", "https://x.com/a", "../evil", "acme/..", "a b/c", ""]) {
      expect(isValidRepo(bad)).toBe(false);
    }
  });
});

describe("safeGithubUrl", () => {
  it("keeps https://github.com links", () => {
    expect(safeGithubUrl("https://github.com/acme/web/pull/1")).toBe("https://github.com/acme/web/pull/1");
  });
  it("drops other schemes and hosts", () => {
    expect(safeGithubUrl("javascript:alert(1)")).toBeNull();
    expect(safeGithubUrl("http://github.com/acme")).toBeNull();
    expect(safeGithubUrl("https://github.com.evil.io/x")).toBeNull();
    expect(safeGithubUrl("not a url")).toBeNull();
  });
});

describe("buildIssueUrl", () => {
  it("builds an encoded new-issue link", () => {
    const url = new URL(buildIssueUrl("acme/web", ticket)!);
    expect(url.origin + url.pathname).toBe("https://github.com/acme/web/issues/new");
    expect(url.searchParams.get("title")).toBe("Fix flaky login");
    expect(url.searchParams.get("body")).toBe("Steps & details");
    expect(url.searchParams.get("labels")).toBe("bug,auth");
  });
  it("returns null for an invalid repo", () => {
    expect(buildIssueUrl("evil.com/../x/y", ticket)).toBeNull();
  });
});

describe("ticketToText", () => {
  it("joins title, body and labels", () => {
    expect(ticketToText(ticket)).toBe("Fix flaky login\n\nSteps & details\n\nLabels: bug, auth");
    expect(ticketToText({ ...ticket, labels: [] })).toBe("Fix flaky login\n\nSteps & details");
  });
});
