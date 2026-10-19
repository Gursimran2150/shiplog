import { describe, expect, it } from "vitest";
import { githubUsernameError, normalizeGithubUsername } from "@/lib/domain/github-username";

describe("GitHub username validation", () => {
  it("accepts valid usernames and empty input", () => {
    for (const name of ["octocat", "a", "my-name-1", "A1", "x".repeat(39), "", "   "]) {
      expect(githubUsernameError(name)).toBeNull();
    }
  });

  it("normalises whitespace and a leading @", () => {
    expect(normalizeGithubUsername("  @octocat ")).toBe("octocat");
    expect(githubUsernameError("@octocat")).toBeNull();
  });

  it("explains why a username is invalid", () => {
    expect(githubUsernameError("x".repeat(40))).toMatch(/39/);
    expect(githubUsernameError("-octo")).toMatch(/start or end/);
    expect(githubUsernameError("octo-")).toMatch(/start or end/);
    expect(githubUsernameError("oc--to")).toMatch(/two hyphens/);
    expect(githubUsernameError("octo_cat")).toMatch(/letters, numbers/);
    expect(githubUsernameError("octo cat")).toMatch(/letters, numbers/);
  });
});
