import { expect, test } from "@playwright/test";

const PAGES = ["/", "/timeline", "/journeys", "/reports", "/ask", "/settings"];

for (const path of PAGES) {
  test(`${path} renders with a main landmark and a heading`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("main")).toBeVisible();
  });

  test(`${path} never scrolls sideways`, async ({ page }) => {
    await page.goto(path === "/reports" ? "/reports?tab=pr" : path);
    await page.waitForLoadState("networkidle");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test("tabs navigate between screens", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Timeline" }).click();
  await expect(page).toHaveURL(/\/timeline$/);
  await expect(page.getByRole("link", { name: "Timeline" })).toHaveAttribute("aria-current", "page");
});

test("demo account shows seeded history on the timeline", async ({ page }) => {
  await page.goto("/timeline");
  await expect(page.getByRole("group", { name: /Logged items per day/ })).toBeVisible();
  // At least one heatmap day has logged items from the seeded demo data.
  await expect(page.getByRole("button", { name: /[1-9]\d* items? on/ }).first()).toBeVisible();
});

test("reports know how many entries are in range", async ({ page }) => {
  await page.goto("/reports");
  await page.getByRole("tab", { name: "Brag doc" }).click();
  await expect(page.getByText(/\d+ entr(y|ies)/).first()).toBeVisible();
});

test("settings validate the GitHub username", async ({ page }) => {
  await page.goto("/settings");
  const input = page.getByLabel(/GitHub username/i);
  await input.fill("not a valid name!");
  await input.blur();
  await expect(input).toHaveAttribute("aria-invalid", "true");
});

test("security headers are set", async ({ request }) => {
  const res = await request.get("/login");
  expect(res.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(res.headers()["x-content-type-options"]).toBe("nosniff");
});

test("a ?tab= link opens that report tab", async ({ page }) => {
  await page.goto("/reports?tab=weekly");
  await expect(page.getByRole("tab", { name: "Weekly report" })).toHaveAttribute("aria-selected", "true");
});

test("APIs reject invalid input", async ({ request }) => {
  expect((await request.post("/api/entries", { data: { text: "", date: "x", timeZone: "UTC" } })).status()).toBe(400);
  expect((await request.get("/api/stats?from=bad&to=2026-10-20")).status()).toBe(400);
});

test.describe("real AI calls", () => {
  test.skip(!process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY && !process.env.E2E_BASE_URL, "no AI key");
  test.setTimeout(90_000);

  test("a spoken log is structured into sections and saved", async ({ page }) => {
    await page.goto("/");
    await page
      .getByLabel("Tell ShipLog about your day")
      .fill(
        "aaj login page ka redirect bug fix kiya aur PR raise kiya. kal dashboard charts banane hain. backend API ready nahi hai abhi.",
      );
    await page.getByRole("button", { name: /Structure my day/ }).click();
    await expect(page.getByRole("heading", { name: /Done/ }).first()).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(/redirect/i).first()).toBeVisible();
    const next = page.getByRole("navigation", { name: "Next steps" });
    await expect(next.getByRole("link", { name: /Generate today's standup/ })).toBeVisible();

    // Follow-up questions are the model's call; when it asks, answering one refines the log.
    const followUps = page.getByRole("region", { name: "A few quick questions" });
    if (await followUps.isVisible()) {
      await followUps.getByRole("textbox").first().fill("Waiting on Rahul from backend since Monday.");
      await followUps.getByRole("button", { name: /Update my log/ }).click();
      await expect(followUps).toBeHidden({ timeout: 60_000 });
    }
  });

  test("a weekly report is generated from the demo logs", async ({ page }) => {
    await page.goto("/reports");
    await page.getByRole("tab", { name: "Weekly report" }).click();
    await page.getByRole("button", { name: /Previous week/i }).click();
    await page.getByRole("button", { name: /Generate weekly report/ }).click();
    const answer = page.getByRole("region", { name: "AI response" });
    await expect(answer).toHaveAttribute("aria-busy", "false", { timeout: 60_000 });
    await expect(answer).not.toBeEmpty();
  });
});
