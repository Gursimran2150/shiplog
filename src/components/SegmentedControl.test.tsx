import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FORMAT_OPTIONS } from "@/components/format-options";
import { SegmentedControl } from "@/components/SegmentedControl";

describe("SegmentedControl", () => {
  it("is a labelled radio group reflecting the value", () => {
    render(<SegmentedControl legend="Format" options={FORMAT_OPTIONS} value="teams" onChange={() => {}} />);
    expect(screen.getByRole("group", { name: "Format" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Teams" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Slack" })).not.toBeChecked();
  });

  it("reports the picked option", () => {
    const onChange = vi.fn();
    render(<SegmentedControl legend="Format" options={FORMAT_OPTIONS} value="slack" onChange={onChange} />);
    fireEvent.click(screen.getByRole("radio", { name: "Plain" }));
    expect(onChange).toHaveBeenCalledWith("plain");
  });
});
