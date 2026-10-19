import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GithubForm } from "./GithubForm";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("GithubForm", () => {
  it("shows an inline error and does not save an invalid username", () => {
    const onSave = vi.fn();
    render(<GithubForm initial={null} onSave={onSave} />);
    const input = screen.getByLabelText("GitHub username");
    fireEvent.change(input, { target: { value: "bad--name" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(/two hyphens/);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("saves a normalised username", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<GithubForm initial={null} onSave={onSave} />);
    fireEvent.change(screen.getByLabelText("GitHub username"), { target: { value: " @octocat " } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith("octocat"));
  });

  it("disables Save until the value changes", () => {
    render(<GithubForm initial="octocat" onSave={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });
});
