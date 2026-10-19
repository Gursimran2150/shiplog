import { expect, test } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test("logged-out visitors are sent to the landing page", async ({ page }) => {
  await page.goto("/timeline");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Talk about your day.");
});

test("APIs require a session", async ({ request }) => {
  expect((await request.get("/api/entries?from=2026-10-01&to=2026-10-20")).status()).toBe(401);
  expect((await request.post("/api/ask", { data: { question: "what did I do?", today: "2026-10-20" } })).status()).toBe(
    401,
  );
});

test("wrong password shows a safe error", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("demo@shiplog.dev");
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "incorrect" })).toHaveText("Email or password is incorrect.");
});

test("shared demo credentials work", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("demo@shiplog.dev");
  await page.getByLabel("Password").fill("shiplog-demo-2026");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await page.waitForURL("/");
});

test("the demo chooser offers a mock-data account and a fresh empty one", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Try the demo/ }).click();
  const chooser = page.getByRole("dialog", { name: "How do you want to try ShipLog?" });
  await expect(chooser.getByRole("button", { name: /Account with mock data/ })).toBeVisible();
  await chooser.getByRole("button", { name: /Fresh empty account/ }).click();
  await page.waitForURL("/");
  const res = await page.request.get("/api/entries?from=2020-01-01&to=2030-12-31");
  expect((await res.json()).entries).toEqual([]);
});
