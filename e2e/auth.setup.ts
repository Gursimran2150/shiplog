import { expect, test as setup } from "@playwright/test";

export const STORAGE_STATE = "e2e/.auth/demo.json";

/** Logs in once with the one-tap demo account and saves the session for the other tests. */
setup("log in as a demo user", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Try the demo/i }).click();
  await page.waitForURL("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.context().storageState({ path: STORAGE_STATE });
});
