import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const save = vi.fn().mockResolvedValue(undefined);
const settings = { githubUsername: "old-name", standupFormat: "slack", onboarded: false };

vi.mock("@/hooks/useData", () => ({
  useSession: () => ({ user: { id: "u", name: "Asha Rao", email: "a@b.co", isDemo: true }, isLoading: false }),
  useSettings: () => ({ settings, isLoading: false, save }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const { OnboardingTour } = await import("./OnboardingTour");

async function goTo(user: ReturnType<typeof userEvent.setup>, steps: number) {
  for (let i = 0; i < steps; i++) await user.click(screen.getByRole("button", { name: /Next/ }));
}

describe("OnboardingTour", () => {
  beforeEach(() => save.mockClear());

  it("saves the chosen setup exactly once when finished", async () => {
    const user = userEvent.setup();
    render(<OnboardingTour />);
    expect(screen.getByRole("heading", { name: "Welcome to ShipLog" })).toBeInTheDocument();
    await goTo(user, 2);
    const input = screen.getByLabelText("GitHub username");
    await user.clear(input);
    await user.type(input, "@octocat");
    await goTo(user, 2);
    await user.click(screen.getByRole("button", { name: /Start logging/ }));
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith({ githubUsername: "octocat", standupFormat: "slack", onboarded: true });
  });

  it("blocks Next on an invalid GitHub username", async () => {
    const user = userEvent.setup();
    render(<OnboardingTour />);
    await goTo(user, 2);
    await user.type(screen.getByLabelText("GitHub username"), " bad!");
    expect(screen.getByRole("button", { name: /Next/ })).toBeDisabled();
  });

  it("skipping keeps existing settings and marks the tour done", async () => {
    const user = userEvent.setup();
    render(<OnboardingTour />);
    await user.click(screen.getByRole("button", { name: "Skip tour" }));
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith({ ...settings, onboarded: true });
  });
});
