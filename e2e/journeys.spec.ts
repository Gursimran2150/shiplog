import { expect, test } from "@playwright/test";

test("the mock account opens Today with today's log already structured", async ({ page }) => {
  await page.goto("/");
  // Today's latest log is shown structured (other tests may have added a newer one than the seed).
  const result = page.getByRole("region", { name: "Your day, structured" });
  await expect(result.getByRole("region", { name: "Done" })).toBeVisible();
  await expect(page.getByText(/Rolled onboarding out to 50% of users/).first()).toBeVisible();
  // Arriving on Today keeps focus where it was; only a freshly structured log moves it.
  await expect(page.getByRole("heading", { name: "Your day, structured" })).not.toBeFocused();
});

test("a task's journey shows how it went, and notes can be added", async ({ page }) => {
  await page.goto("/journeys");
  const tree = page.getByRole("navigation", { name: "Tasks by project" });
  await tree.getByRole("searchbox", { name: "Search tasks or projects" }).fill("usage api");
  await tree.getByRole("button", { name: /Integrate the usage API into the dashboard/ }).click();
  await expect(page).toHaveURL(/\/journeys\?task=/);

  const journey = page.getByRole("article");
  await expect(journey.getByRole("heading", { name: "Integrate the usage API into the dashboard" })).toBeVisible();
  await expect(journey.getByText("Blocked", { exact: true })).toBeVisible();
  await expect(journey.getByText("Done", { exact: true }).first()).toBeVisible();
  await expect(journey.getByText(/agreed the response contract first/)).toBeVisible();

  await journey.getByRole("radio", { name: "Learning" }).check({ force: true });
  await journey.getByRole("textbox", { name: "Learning" }).fill("Share the typed mock with backend too.");
  await journey.getByRole("button", { name: "Save note" }).click();
  await expect(journey.getByText("Share the typed mock with backend too.")).toBeVisible();
});

test("items link to their journey from the timeline", async ({ page }) => {
  await page.goto("/timeline");
  await page
    .getByRole("link", { name: /^See journey:/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/journeys\?task=/);
  await expect(page.getByRole("article").getByRole("heading", { level: 2 })).toBeVisible();
});

test("the weekly report's calendar picks a past week", async ({ page }) => {
  await page.goto("/reports?tab=weekly");
  await page.getByRole("button", { name: /choose a week/ }).click();
  const picker = page.getByRole("dialog", { name: "Choose a week" });
  await picker.getByRole("button", { name: "Last week" }).click();
  await expect(picker).toBeHidden();
  await expect(page.getByText(/entries · /)).toBeVisible();
  await page.getByRole("button", { name: /choose a week/ }).click();
  await expect(page.getByRole("button", { name: /^Week of .*logs?$/ }).first()).toBeVisible();
});
