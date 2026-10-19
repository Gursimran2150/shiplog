import { describe, expect, it } from "vitest";
import { entryDataSchema } from "@/lib/server/schemas";
import { demoEntries } from "./demo-data";

describe("demoEntries", () => {
  const entries = demoEntries("2026-10-20"); // a Tuesday

  it("places every sample on a past weekday, oldest first, ending yesterday", () => {
    const dates = entries.map((e) => e.date);
    expect(dates.at(-1)).toBe("2026-10-19");
    expect([...dates].sort()).toEqual(dates);
    for (const d of dates) expect([0, 6]).not.toContain(new Date(`${d}T00:00:00Z`).getUTCDay());
  });

  it("only contains entries that match the stored schema", () => {
    for (const e of entries) expect(entryDataSchema.safeParse(e.data).success).toBe(true);
  });
});
