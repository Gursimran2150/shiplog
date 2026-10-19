import { expect, test } from "@playwright/test";

test.describe("first-run tour", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("walks through setup, saves GitHub and format, and does not show again", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Try the demo/i }).click();
    await page.getByRole("button", { name: /Account with mock data/ }).click();
    await page.waitForURL("/");

    const tour = page.getByRole("dialog");
    await expect(tour.getByRole("heading", { name: "Welcome to ShipLog" })).toBeVisible();
    await tour.getByRole("button", { name: /Next/ }).click();
    await expect(tour.getByRole("heading", { name: "Speak your day" })).toBeVisible();
    await tour.getByRole("button", { name: /Next/ }).click();

    const username = tour.getByLabel("GitHub username");
    await username.fill("bad name!");
    await expect(tour.getByRole("button", { name: /Next/ })).toBeDisabled();
    await username.fill("octocat");
    await tour.getByRole("button", { name: /Next/ }).click();

    await tour.getByText("Teams", { exact: true }).click();
    await expect(tour.getByRole("radio", { name: "Teams" })).toBeChecked();
    await tour.getByRole("button", { name: /Next/ }).click();
    const saved = page.waitForResponse((r) => r.url().endsWith("/api/settings") && r.request().method() === "PUT");
    await tour.getByRole("button", { name: /Start logging/ }).click();
    await saved;
    await expect(tour).toBeHidden();

    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await page.goto("/settings");
    await expect(page.getByLabel(/GitHub username/i)).toHaveValue("octocat");
  });
});

test("the tour can be replayed from the account menu", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Account menu/ }).click();
  await page.getByRole("menuitem", { name: "Replay welcome tour" }).click();
  await expect(page.getByRole("dialog").getByRole("heading", { name: "Welcome to ShipLog" })).toBeVisible();
  await page.getByRole("button", { name: "Skip tour" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("command menu navigates with the keyboard", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open command menu" }).click();
  const input = page.getByRole("combobox", { name: "Search commands" });
  await input.fill("heatmap");
  await input.press("Enter");
  await expect(page).toHaveURL(/\/timeline$/);
});

test("? opens the keyboard shortcuts sheet", async ({ page }) => {
  await page.goto("/timeline");
  await page.getByRole("heading", { level: 1 }).click();
  await page.keyboard.press("?");
  await expect(page.getByRole("dialog", { name: /Keyboard shortcuts/ })).toBeVisible();
});

test("the journal exports as Markdown", async ({ page }) => {
  await page.goto("/settings");
  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: /Export journal/ }).click();
  expect((await download).suggestedFilename()).toBe("shiplog-journal.md");
});

test.describe("account deletion", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("requires typing DELETE and then signs the user out", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Try the demo/i }).click();
    await page.getByRole("button", { name: /Account with mock data/ }).click();
    await page.waitForURL("/");
    const saved = page.waitForResponse((r) => r.url().endsWith("/api/settings") && r.request().method() === "PUT");
    await page.getByRole("button", { name: "Skip tour" }).click();
    await saved;
    await page.goto("/settings");
    await page.getByRole("button", { name: "Delete account" }).click();
    const confirm = page.getByRole("button", { name: "Permanently delete" });
    await expect(confirm).toBeDisabled();
    await page.getByLabel(/Type DELETE to confirm/).fill("DELETE");
    await confirm.click();
    await page.waitForURL(/\/login$/);
  });
});
