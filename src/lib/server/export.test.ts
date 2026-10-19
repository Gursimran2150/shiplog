import { describe, expect, it } from "vitest";
import { journalToMarkdown } from "./export";

describe("journalToMarkdown", () => {
  it("renders days, non-empty sections, projects and the original words", () => {
    const md = journalToMarkdown("Asha", [
      {
        id: "1",
        date: "2026-10-20",
        raw: "aaj login fix kiya",
        words: 4,
        createdAt: "x",
        data: {
          summary: "Fixed login.",
          done: [{ text: "Fixed login", project: "auth" }],
          inProgress: [],
          blockers: [],
          tomorrow: [],
        },
      },
    ]);
    expect(md).toContain("# ShipLog journal: Asha");
    expect(md).toContain("## 2026-10-20");
    expect(md).toContain("### Done\n- Fixed login _(auth)_");
    expect(md).not.toContain("### Blockers");
    expect(md).toContain("> aaj login fix kiya");
  });
});
