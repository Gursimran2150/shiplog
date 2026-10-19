import { describe, expect, it } from "vitest";
import { clampStructured, entryDataSchema } from "./schemas";

describe("clampStructured", () => {
  it("brings unconstrained model output within the stored limits", () => {
    const item = (text: string) => ({ text, project: "  web  ", task: null });
    const out = clampStructured({
      summary: `  ${"s".repeat(300)}`,
      done: Array.from({ length: 25 }, (_, i) => item(`done ${i}`)),
      inProgress: [item("x".repeat(400)), item("   ")],
      blockers: Array.from({ length: 12 }, () => item("b")),
      tomorrow: [{ text: "t", project: "", task: "t1" }],
      missed: Array.from({ length: 12 }, () => ({ text: "m".repeat(250), url: "https://github.com/a/b/commit/1" })),
      followUps: ["q1", " ", "q2", "q3", "q4"],
    });
    expect(out.summary).toHaveLength(240);
    expect(out.done).toHaveLength(20);
    expect(out.inProgress).toEqual([{ text: "x".repeat(300), project: "web", task: null }]);
    expect(out.blockers).toHaveLength(10);
    expect(out.tomorrow[0]).toEqual({ text: "t", project: null, task: "t1" });
    expect(out.missed).toHaveLength(10);
    expect(out.missed[0].text).toHaveLength(200);
    expect(out.followUps).toEqual(["q1", "q2", "q3"]);
    const strip = (items: { text: string; project: string | null }[]) =>
      items.map(({ text, project }) => ({ text, project }));
    const stored = {
      summary: out.summary,
      done: strip(out.done),
      inProgress: strip(out.inProgress),
      blockers: strip(out.blockers),
      tomorrow: strip(out.tomorrow),
    };
    expect(entryDataSchema.safeParse(stored).success).toBe(true);
  });
});
