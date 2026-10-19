import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AskForm } from "./AskForm";

const setup = (props: Partial<Parameters<typeof AskForm>[0]> = {}) => {
  const onAsk = vi.fn();
  render(<AskForm onAsk={onAsk} onStop={() => {}} isStreaming={false} disabled={false} {...props} />);
  return { onAsk, input: screen.getByLabelText("Ask a question about your work") };
};

describe("AskForm", () => {
  it("submits the trimmed question and clears the input", () => {
    const { onAsk, input } = setup();
    fireEvent.change(input, { target: { value: "  What did I ship?  " } });
    expect(screen.getByText("20/500")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ask" }));
    expect(onAsk).toHaveBeenCalledWith("What did I ship?");
    expect(input).toHaveValue("");
  });

  it("limits length and describes the input with the dictation hint", () => {
    const { input } = setup();
    expect(input).toHaveAttribute("maxLength", "500");
    expect(input).toHaveAccessibleDescription(/Dictate with Wispr Flow/);
  });

  it("offers Stop instead of Ask while an answer streams", () => {
    const onStop = vi.fn();
    setup({ isStreaming: true, onStop });
    expect(screen.queryByRole("button", { name: "Ask" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    expect(onStop).toHaveBeenCalled();
  });
});
