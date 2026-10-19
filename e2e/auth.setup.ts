import { expect, test as setup } from "@playwright/test";

export const STORAGE_STATE = "e2e/.auth/demo.json";

/** Logs in with the one-tap demo account, skips the first-run tour, and saves the session. */
setup("log in as a demo user", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Try the demo/i }).click();
  await page.waitForURL("/");
  await expect(page.getByRole("dialog", { name: "Welcome to ShipLog" })).toBeVisible();
  const saved = page.waitForResponse((r) => r.url().endsWith("/api/settings") && r.request().method() === "PUT");
  await page.getByRole("button", { name: "Skip tour" }).click();
  await saved;
  await expect(page.getByRole("dialog")).toBeHidden();
  await page.context().storageState({ path: STORAGE_STATE });
});
