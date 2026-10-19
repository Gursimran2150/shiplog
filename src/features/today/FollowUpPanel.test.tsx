import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FollowUpPanel } from "./FollowUpPanel";

const QUESTIONS = ["Who is the usage API waiting on?", "What is left on the charts?"];

describe("FollowUpPanel", () => {
  it("sends only the questions that were answered", async () => {
    const onAnswer = vi.fn().mockResolvedValue(true);
    render(<FollowUpPanel questions={QUESTIONS} onAnswer={onAnswer} onSkip={vi.fn()} />);
    fireEvent.input(screen.getByLabelText(QUESTIONS[0]), { target: { value: " Rahul, since Monday " } });
    fireEvent.click(screen.getByRole("button", { name: /update my log/i }));
    await vi.waitFor(() =>
      expect(onAnswer).toHaveBeenCalledWith([{ question: QUESTIONS[0], answer: "Rahul, since Monday" }]),
    );
  });

  it("asks for an answer instead of sending nothing, and can be skipped", () => {
    const onAnswer = vi.fn();
    const onSkip = vi.fn();
    render(<FollowUpPanel questions={QUESTIONS} onAnswer={onAnswer} onSkip={onSkip} />);
    fireEvent.click(screen.getByRole("button", { name: /update my log/i }));
    expect(screen.getByRole("alert")).toHaveTextContent("Answer at least one question");
    expect(onAnswer).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(onSkip).toHaveBeenCalled();
  });

  it("renders nothing without questions", () => {
    const { container } = render(<FollowUpPanel questions={[]} onAnswer={vi.fn()} onSkip={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});
