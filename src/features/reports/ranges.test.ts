import { describe, expect, it } from "vitest";
import { bragRange, reportFilename, standupRange, weekRange } from "./ranges";

describe("report ranges", () => {
  it("covers yesterday and today for a standup", () => {
    expect(standupRange("2026-03-01")).toEqual({ from: "2026-02-28", to: "2026-03-01" });
  });

  it("spans Monday to Sunday for a week", () => {
    expect(weekRange("2026-10-21")).toEqual({ from: "2026-10-19", to: "2026-10-25" });
    expect(weekRange("2026-10-25")).toEqual({ from: "2026-10-19", to: "2026-10-25" });
  });

  it("computes brag periods ending today", () => {
    expect(bragRange("30d", "2026-10-19")).toEqual({ from: "2026-09-20", to: "2026-10-19" });
    expect(bragRange("quarter", "2026-10-19")).toEqual({ from: "2026-10-01", to: "2026-10-19" });
    expect(bragRange("quarter", "2026-03-31")).toEqual({ from: "2026-01-01", to: "2026-03-31" });
    expect(bragRange("6m", "2026-10-19")).toEqual({ from: "2026-04-19", to: "2026-10-19" });
  });

  it("clamps six months back to the end of a shorter month and crosses years", () => {
    expect(bragRange("6m", "2026-08-31")).toEqual({ from: "2026-02-28", to: "2026-08-31" });
    expect(bragRange("6m", "2026-03-15")).toEqual({ from: "2025-09-15", to: "2026-03-15" });
  });

  it("builds a markdown filename", () => {
    expect(reportFilename("weekly", { from: "2026-10-19", to: "2026-10-25" })).toBe(
      "shiplog-weekly-2026-10-19-to-2026-10-25.md",
    );
    expect(reportFilename("standup", { from: "2026-10-19", to: "2026-10-19" })).toBe("shiplog-standup-2026-10-19.md");
  });
});
