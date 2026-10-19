import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DayCount } from "@/lib/domain/types";
import { FirstRunGuide } from "./FirstRunGuide";

const stats = vi.hoisted(() => ({ days: [] as DayCount[], isLoading: false }));
vi.mock("@/hooks/useData", () => ({ useDayCounts: () => stats }));

beforeEach(() => {
  stats.days = [];
  stats.isLoading = false;
});
afterEach(() => window.localStorage.clear());

describe("FirstRunGuide", () => {
  it("explains the three steps to someone with no entries", () => {
    render(<FirstRunGuide today="2026-10-19" />);
    expect(screen.getByRole("heading", { name: "How ShipLog works" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("stays hidden once the user has logged anything", () => {
    stats.days = [{ date: "2026-10-01", entries: 1, items: 3 }];
    render(<FirstRunGuide today="2026-10-19" />);
    expect(screen.queryByRole("heading", { name: "How ShipLog works" })).not.toBeInTheDocument();
  });

  it("remembers dismissal", () => {
    const { unmount } = render(<FirstRunGuide today="2026-10-19" />);
    fireEvent.click(screen.getByRole("button", { name: "Dismiss how ShipLog works" }));
    expect(screen.queryByRole("heading", { name: "How ShipLog works" })).not.toBeInTheDocument();
    unmount();
    render(<FirstRunGuide today="2026-10-19" />);
    expect(screen.queryByRole("heading", { name: "How ShipLog works" })).not.toBeInTheDocument();
  });
});
