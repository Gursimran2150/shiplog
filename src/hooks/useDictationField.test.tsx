import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDictationField } from "./useDictationField";

function Field() {
  const { ref, value, append } = useDictationField<HTMLTextAreaElement>();
  return (
    <>
      <textarea aria-label="log" ref={ref} />
      <output aria-label="mirror">{value}</output>
      <button onClick={() => append("second line")}>append</button>
    </>
  );
}

describe("useDictationField", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("keeps text a dictation tool inserts without input events", () => {
    render(<Field />);
    const box = screen.getByLabelText<HTMLTextAreaElement>("log");
    fireEvent.input(box, { target: { value: "first line" } });
    expect(screen.getByLabelText("mirror")).toHaveTextContent("first line");

    act(() => box.focus());
    box.value = "first line\nsecond burst"; // silent insert, no event
    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByLabelText("mirror")).toHaveTextContent("first line second burst");
    expect(box.value).toBe("first line\nsecond burst");
  });

  it("appends spoken phrases with a single space", () => {
    render(<Field />);
    const box = screen.getByLabelText<HTMLTextAreaElement>("log");
    fireEvent.input(box, { target: { value: "fixed CI" } });
    fireEvent.click(screen.getByText("append"));
    expect(box.value).toBe("fixed CI second line");
  });
});
