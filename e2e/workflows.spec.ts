import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("Today lists open blockers by who they're waiting on, longest wait first", async ({ page }) => {
  await page.goto("/");
  const board = page.getByRole("region", { name: "Waiting on" });
  const people = board.getByRole("heading", { level: 3 });
  await expect(people.first()).toContainText("Neha");
  await expect(board.getByText(/\d+ days/).first()).toBeVisible();
  await expect(people.filter({ hasText: "Karan" })).toBeVisible();
  await expect(people.filter({ hasText: "Priya" })).toBeVisible();
  await expect(board.getByRole("link", { name: /^See journey: Add dark-mode colour tokens/ })).toBeVisible();
});

test("the PR writer has dictation, starters, a task picker and passes an accessibility scan", async ({ page }) => {
  await page.goto("/reports?tab=pr");
  const box = page.getByLabel("What did you change?");
  await expect(page.getByRole("button", { name: "Write PR description" })).toBeDisabled();
  await page.getByRole("button", { name: "How to test" }).click();
  await expect(box).toHaveValue("To test: ");
  await expect(page.getByLabel("Task (optional)").locator("option")).not.toHaveCount(1);
  const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(violations.map((v) => v.id)).toEqual([]);
});

test.describe("AI write-ups", () => {
  test.skip(!process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY && !process.env.E2E_BASE_URL, "no AI key");
  test.setTimeout(90_000);

  test("drafts a nudge for a blocker", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: /^Draft nudge to Neha/ })
      .first()
      .click();
    const dialog = page.getByRole("dialog", { name: "Nudge Neha" });
    const message = dialog.getByRole("region", { name: "Nudge message" });
    await expect(message).toHaveAttribute("aria-busy", "false", { timeout: 60_000 });
    await expect(message).toContainText("Neha");
    await expect(dialog.getByRole("button", { name: "Copy" })).toBeVisible();
  });

  test("writes a PR description from a spoken summary and a task", async ({ page }) => {
    await page.goto("/reports?tab=pr");
    await page
      .getByLabel("What did you change?")
      .fill(
        "usage charts ko mock data se hata ke real usage API se joda, SWR se 5 minute cache kiya. Test: dashboard kholo aur date range badlo.",
      );
    const picker = page.getByLabel("Task (optional)");
    const value = await picker.locator("option", { hasText: "Integrate the usage API" }).first().getAttribute("value");
    await picker.selectOption(value ?? "");
    await page.getByLabel("Ticket (optional)").fill("DASH-42");
    await page.getByRole("button", { name: "Write PR description" }).click();
    const answer = page.getByRole("region", { name: "AI response" });
    await expect(answer).toHaveAttribute("aria-busy", "false", { timeout: 60_000 });
    await expect(answer.getByRole("heading", { name: "How to test" })).toBeVisible();
    await expect(answer).toContainText("DASH-42");
  });

  test("writes a postmortem from a task's journey", async ({ page }) => {
    await page.goto("/journeys");
    const tree = page.getByRole("navigation", { name: "Tasks by project" });
    await tree.getByRole("searchbox").fill("usage api");
    await tree.getByRole("button", { name: /Integrate the usage API into the dashboard/ }).click();
    await page.getByRole("button", { name: "Write postmortem" }).click();
    const doc = page.getByRole("dialog").getByRole("region", { name: "Postmortem" });
    await expect(doc).toHaveAttribute("aria-busy", "false", { timeout: 60_000 });
    await expect(doc.getByRole("heading", { name: "Timeline" })).toBeVisible();
    await expect(doc).toContainText(/Rahul|contract/);
  });
});
