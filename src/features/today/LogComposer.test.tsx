import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LogComposer } from "./LogComposer";

function setup(onSubmit = vi.fn().mockResolvedValue(true)) {
  render(<LogComposer ready submitting={false} error={null} onSubmit={onSubmit} />);
  return { onSubmit, box: screen.getByLabelText("Tell ShipLog about your day") };
}

describe("LogComposer", () => {
  it("counts words and characters as you type", () => {
    const { box } = setup();
    fireEvent.change(box, { target: { value: "aaj login bug fix kiya" } });
    expect(screen.getByText(/5 words · 22\/4,000 characters/)).toBeInTheDocument();
  });

  it("submits the trimmed text with Ctrl+Enter", async () => {
    const { box, onSubmit } = setup();
    fireEvent.change(box, { target: { value: "  shipped the heatmap  " } });
    fireEvent.keyDown(box, { key: "Enter", ctrlKey: true });
    expect(onSubmit).toHaveBeenCalledWith("shipped the heatmap");
    await vi.waitFor(() => expect(box).toHaveValue(""));
  });

  it("keeps the button disabled until there is something to structure", () => {
    const { box } = setup();
    const button = screen.getByRole("button", { name: /structure my day/i });
    expect(button).toBeDisabled();
    fireEvent.change(box, { target: { value: "fixed CI" } });
    expect(button).toBeEnabled();
  });

  it("shows server errors in an alert", () => {
    render(<LogComposer ready submitting={false} error="AI is busy" onSubmit={vi.fn()} />);
    expect(screen.getByRole("alert")).toHaveTextContent("AI is busy");
  });

  it("adds a speaking starter on a new line and focuses the box", () => {
    const { box } = setup();
    fireEvent.change(box, { target: { value: "fixed CI" } });
    fireEvent.click(screen.getByRole("button", { name: "Anything blocking" }));
    expect(box).toHaveValue("fixed CI\nBlocked on: ");
    expect(box).toHaveFocus();
  });

  it("shows what the last save produced while the box is empty", () => {
    render(<LogComposer ready submitting={false} error={null} onSubmit={vi.fn()} saved={{ words: 12, items: 1 }} />);
    expect(screen.getByText("Saved · 12 words → 1 item")).toBeInTheDocument();
  });
});
