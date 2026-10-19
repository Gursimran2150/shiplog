// Captures README screenshots and demo videos from a running ShipLog (real AI, real data).
// Usage: pnpm start -p 3100 & node scripts/capture-docs.mjs [baseUrl]
// Re-run some steps only with ONLY=journeys,reports (names below), or start later with FROM_STEP=3.
import { chromium, devices } from "@playwright/test";
import { mkdirSync, renameSync, writeFileSync } from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:3100";
const SHOTS = "docs/screenshots";
const RAW = "docs/media/raw";
mkdirSync(SHOTS, { recursive: true });
mkdirSync(RAW, { recursive: true });

const DESKTOP = { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2, colorScheme: "light" };
const DAY_LOG =
  "aaj checkout page ka Safari wala crash fix kiya aur PR raise kar diya. Dashboard ke usage charts pe kaam chal raha hai, " +
  "80 percent ho gaya. Backend ka usage API abhi ready nahi hai, Rahul se baat karni hai. Kal onboarding flow ka redesign shuru karna hai.";

const browser = await chromium.launch();

const STEPS = ["landing", "onboarding", "today", "reports", "explore", "dark", "journeys", "mobile"];
/** Whether to run a step: all by default, a subset with ONLY, or everything from FROM_STEP on. */
function step(name) {
  if (process.env.ONLY) return process.env.ONLY.split(",").includes(name);
  return STEPS.indexOf(name) + 1 >= Number(process.env.FROM_STEP ?? 1);
}

async function demoPage(options = DESKTOP, { video, skipTour = true } = {}) {
  const context = await browser.newContext({
    ...options,
    ...(video ? { recordVideo: { dir: RAW, size: options.viewport ?? { width: 412, height: 915 } } } : {}),
  });
  const page = await context.newPage();
  const started = Date.now();
  await page.goto(`${BASE}/login`);
  await page.getByRole("button", { name: /Try the demo/ }).click();
  await page.getByRole("button", { name: /Account with mock data/ }).click();
  await page.waitForURL(`${BASE}/`);
  if (skipTour) {
    const saved = page.waitForResponse((r) => r.url().endsWith("/api/settings") && r.request().method() === "PUT");
    await page.getByRole("button", { name: "Skip tour" }).click();
    await saved;
    await page.getByRole("dialog").waitFor({ state: "hidden" });
  }
  // Seconds of video spent creating the demo account: trimmed off when encoding.
  lead.set(page, (Date.now() - started) / 1000);
  return { context, page };
}

const lead = new WeakMap();

async function saveVideo(context, page, name) {
  const path = await page.video()?.path();
  await context.close();
  if (!path) return;
  renameSync(path, `${RAW}/${name}.webm`);
  writeFileSync(`${RAW}/${name}.trim`, String(Math.max(0, (lead.get(page) ?? 0) - 0.5).toFixed(1)));
}

const shot = (page, name, fullPage = false) => page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage });

/** Types like a dictation tool: short bursts of words, not one keystroke at a time. */
async function dictate(page, label, text) {
  const box = page.getByLabel(label);
  await box.click();
  const words = text.split(" ");
  for (let i = 0; i < words.length; i += 4) {
    await box.pressSequentially(`${words.slice(i, i + 4).join(" ")} `, { delay: 6 });
    await page.waitForTimeout(140);
  }
}

// 1. Landing page (light + dark)
if (step("landing")) {
  const context = await browser.newContext(DESKTOP);
  const page = await context.newPage();
  await page.goto(`${BASE}/login`);
  await page.waitForTimeout(600);
  await shot(page, "landing");
  await page.emulateMedia({ colorScheme: "dark" });
  await page.waitForTimeout(300);
  await shot(page, "landing-dark");
  await page.emulateMedia({ colorScheme: "light" });
  await page.getByRole("button", { name: /Try the demo/ }).click();
  await page.getByRole("dialog").waitFor();
  await page.waitForTimeout(500);
  await shot(page, "demo-chooser");
  await context.close();
}

// 2. Onboarding tour (video + screenshots)
if (step("onboarding")) {
  const { context, page } = await demoPage(DESKTOP, { video: true, skipTour: false });
  const tour = page.getByRole("dialog");
  await page.waitForTimeout(900);
  await shot(page, "tour-welcome");
  for (const step of ["tour-speak", "tour-github", "tour-format", "tour-toolkit"]) {
    await tour.getByRole("button", { name: /Next/ }).click();
    await page.waitForTimeout(1100);
    await shot(page, step);
  }
  await tour.getByRole("button", { name: /Start logging/ }).click();
  await page.waitForTimeout(1200);
  await saveVideo(context, page, "onboarding");
}

// 3. Log your day: dictate → structure → review (the hero flow)
if (step("today")) {
  const { context, page } = await demoPage(DESKTOP, { video: true });
  await page.waitForTimeout(800);
  await shot(page, "today-empty");
  await dictate(page, "Tell ShipLog about your day", DAY_LOG);
  await page.waitForTimeout(400);
  await shot(page, "today-dictated");
  await page.getByRole("button", { name: /Structure my day/ }).click();
  await page.getByRole("heading", { name: /^Done/ }).first().waitFor({ timeout: 60_000 });
  await page.waitForTimeout(800);
  await shot(page, "today-structured", true);
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(1500);
  await page.mouse.wheel(0, -500);
  await page.waitForTimeout(800);
  await saveVideo(context, page, "log-your-day");
}

// 4. Reports: standup + weekly (calendar week picker) + brag doc
if (step("reports")) {
  const { context, page } = await demoPage(DESKTOP, { video: true });
  // A standup needs today's log first, exactly like a real user's day.
  await page.getByLabel("Tell ShipLog about your day").fill(DAY_LOG);
  await page.getByRole("button", { name: /Structure my day/ }).click();
  await page.getByRole("heading", { name: /^Done/ }).first().waitFor({ timeout: 60_000 });
  await page.goto(`${BASE}/reports`);
  await page.waitForTimeout(800);
  const answer = page.getByRole("region", { name: "AI response" });
  await page.getByRole("button", { name: /Generate standup/ }).click();
  await answer.and(page.locator('[aria-busy="false"]')).waitFor({ timeout: 60_000 });
  await page.waitForTimeout(800);
  await shot(page, "reports-standup", true);
  await page.getByRole("tab", { name: "Weekly report" }).click();
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: /choose a week/ }).click();
  await page.waitForTimeout(1400);
  await shot(page, "reports-week-picker");
  await page.getByRole("dialog", { name: "Choose a week" }).getByRole("button", { name: "Last week" }).click();
  await page.getByRole("button", { name: /Generate weekly report/ }).click();
  await answer.and(page.locator('[aria-busy="false"]')).waitFor({ timeout: 60_000 });
  await page.waitForTimeout(800);
  await shot(page, "reports-weekly", true);
  await page.getByRole("tab", { name: "Brag doc" }).click();
  await page.waitForTimeout(600);
  await page.getByText("Last 6 months").click();
  await page.getByRole("button", { name: /Generate brag doc/ }).click();
  await answer.and(page.locator('[aria-busy="false"]')).waitFor({ timeout: 60_000 });
  await page.waitForTimeout(800);
  await shot(page, "reports-brag", true);
  await saveVideo(context, page, "reports");
}

// 5. Timeline, Journeys, Ask, Settings, command menu
if (step("explore")) {
  const { context, page } = await demoPage(DESKTOP, { video: true });
  await page.goto(`${BASE}/timeline`);
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: /Previous week/ }).click();
  await page.waitForTimeout(900);
  await shot(page, "timeline", true);

  await page.goto(`${BASE}/journeys`);
  const tree = page.getByRole("navigation", { name: "Tasks by project" });
  await tree.getByRole("searchbox").fill("usage api");
  await tree.getByRole("button", { name: /Integrate the usage API into the dashboard/ }).click();
  await page.waitForTimeout(900);
  await tree.getByRole("searchbox").fill("");
  await page.waitForTimeout(900);
  await shot(page, "journeys", true);

  await page.goto(`${BASE}/ask`);
  await page.waitForTimeout(600);
  await page.getByRole("button", { name: /What did I ship last week/ }).click();
  await page
    .getByRole("region", { name: "AI response" })
    .and(page.locator('[aria-busy="false"]'))
    .waitFor({ timeout: 60_000 });
  await page.waitForTimeout(800);
  await shot(page, "ask", true);

  await page.goto(`${BASE}/settings`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(600);
  await shot(page, "settings", true);
  const integrations = page.getByRole("heading", { name: /GitHub/ }).first();
  await integrations.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await shot(page, "settings-connect");

  await page.keyboard.press("Meta+k");
  await page.waitForTimeout(500);
  await page.keyboard.type("standup", { delay: 60 });
  await page.waitForTimeout(700);
  await shot(page, "command-menu");
  await page.keyboard.press("Escape");
  await saveVideo(context, page, "explore");
}

// 6. Dark mode
if (step("dark")) {
  const { context, page } = await demoPage({ ...DESKTOP, colorScheme: "dark" });
  await page.goto(`${BASE}/timeline`);
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: /Previous week/ }).click();
  await page.waitForTimeout(900);
  await shot(page, "timeline-dark");
  await context.close();
}

// 7. Journeys: from today's log to a task's story, notes and fixing a link (video)
if (step("journeys")) {
  const { context, page } = await demoPage(DESKTOP, { video: true });
  await page.waitForTimeout(1200);
  // Today opens with today's log already structured; every item links to its task.
  const result = page.getByRole("region", { name: "Your day, structured" });
  await result.getByRole("link", { name: /^See journey: Rolled onboarding/ }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  await shot(page, "today-journey-links");
  await result.getByRole("link", { name: /^See journey: Rolled onboarding/ }).click();
  await page.waitForURL(/\/journeys\?task=/);
  await page.waitForTimeout(1800);
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(1500);
  await page.mouse.wheel(0, -500);
  await page.waitForTimeout(800);

  // Find a task that got blocked and see how it was fixed.
  const tree = page.getByRole("navigation", { name: "Tasks by project" });
  await tree.getByRole("radio", { name: "Blocked" }).check({ force: true });
  await page.waitForTimeout(900);
  await tree.getByRole("radio", { name: "All" }).check({ force: true });
  await tree.getByRole("searchbox").pressSequentially("usage api", { delay: 70 });
  await page.waitForTimeout(600);
  await tree.getByRole("button", { name: /Integrate the usage API into the dashboard/ }).click();
  await page.waitForTimeout(1800);
  const journey = page.getByRole("article");
  await journey.getByRole("heading", { name: "Notes & learnings" }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);

  // Add a learning (dictated in real use; typed here).
  await journey.getByRole("radio", { name: "Learning" }).check({ force: true });
  await journey
    .getByRole("textbox", { name: "Learning" })
    .pressSequentially("Share the typed mock with backend so both sides test against it.", { delay: 25 });
  await journey.getByRole("button", { name: "Save note" }).click();
  await page.waitForTimeout(1500);
  await shot(page, "journeys-notes");

  // Wrong link? Move an item to another task.
  await journey.getByRole("heading", { name: "How it went" }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await journey
    .getByRole("button", { name: /^Move to another task:/ })
    .first()
    .click();
  const dialog = page.getByRole("dialog", { name: "Move to a task" });
  await dialog.waitFor();
  await dialog.getByRole("textbox").pressSequentially("dashboard", { delay: 60 });
  await page.waitForTimeout(1200);
  await shot(page, "journeys-move");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(800);
  await saveVideo(context, page, "journeys");
}

// 8. Mobile
if (step("mobile")) {
  const mobile = { ...devices["Pixel 7"], colorScheme: "light" };
  const { context, page } = await demoPage(mobile, { video: true, skipTour: false });
  await page.waitForTimeout(800);
  await shot(page, "mobile-tour");
  await page.getByRole("button", { name: "Skip tour" }).click();
  await page.waitForTimeout(600);
  await dictate(page, "Tell ShipLog about your day", DAY_LOG.split(". ").slice(0, 2).join(". ") + ".");
  await page.getByRole("button", { name: /Structure my day/ }).click();
  await page.getByRole("heading", { name: /^Done/ }).first().waitFor({ timeout: 60_000 });
  await page.waitForTimeout(800);
  await shot(page, "mobile-today");
  await page.goto(`${BASE}/timeline`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(600);
  await shot(page, "mobile-timeline");
  await page.goto(`${BASE}/journeys`);
  await page.waitForLoadState("networkidle");
  await page.getByRole("article").scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await shot(page, "mobile-journeys");
  await saveVideo(context, page, "mobile");
}

await browser.close();
console.log(`Screenshots → ${SHOTS}, raw videos → ${RAW} (convert with scripts/encode-media.sh)`);
