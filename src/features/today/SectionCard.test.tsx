import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { LogItem, Section } from "@/lib/domain/types";
import { SectionCard } from "./SectionCard";

const items: LogItem[] = [
  { text: "Staging deploy blocked", project: "infra" },
  { text: "Waiting on API keys", project: null },
];

function setup(section: Section = "blockers") {
  const handlers = { onCreateTicket: vi.fn(), onUpdate: vi.fn(), onRemove: vi.fn(), onAdd: vi.fn() };
  render(<SectionCard section={section} items={items} {...handlers} />);
  return handlers;
}

describe("SectionCard inline editing", () => {
  it("edits an item: Enter saves the new text", () => {
    const { onUpdate } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Edit item: Waiting on API keys" }));
    const input = screen.getByRole("textbox", { name: "Edit item: Waiting on API keys" });
    expect(input).toHaveFocus();
    fireEvent.change(input, { target: { value: "Waiting on Stripe keys" } });
    fireEvent.submit(input);
    expect(onUpdate).toHaveBeenCalledWith("blockers", 1, "Waiting on Stripe keys");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit item: Waiting on API keys" })).toHaveFocus();
  });

  it("Escape cancels without saving", () => {
    const { onUpdate } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Edit item: Staging deploy blocked" }));
    const input = screen.getByRole("textbox", { name: "Edit item: Staging deploy blocked" });
    fireEvent.change(input, { target: { value: "changed" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(onUpdate).not.toHaveBeenCalled();
    expect(screen.getByText("Staging deploy blocked")).toBeInTheDocument();
  });

  it("removes an item", () => {
    const { onRemove } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Remove item: Staging deploy blocked" }));
    expect(onRemove).toHaveBeenCalledWith("blockers", 0);
  });

  it("adds an item to the section", () => {
    const { onAdd } = setup("done");
    fireEvent.click(screen.getByRole("button", { name: "Add item to Done" }));
    const input = screen.getByRole("textbox", { name: "New item in Done" });
    fireEvent.change(input, { target: { value: "Reviewed PR #12" } });
    fireEvent.submit(input);
    expect(onAdd).toHaveBeenCalledWith("done", "Reviewed PR #12");
  });

  it("offers Create ticket only on blockers and tomorrow", () => {
    const { onCreateTicket } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Create ticket: Staging deploy blocked" }));
    expect(onCreateTicket).toHaveBeenCalledWith("Staging deploy blocked");
  });

  it("has no Create ticket on Done", () => {
    setup("done");
    expect(screen.getByRole("heading", { name: /Done/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Create ticket/ })).not.toBeInTheDocument();
  });
});
