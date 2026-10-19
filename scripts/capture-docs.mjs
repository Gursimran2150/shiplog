// Captures README screenshots and demo videos from a running ShipLog (real AI, real data).
// Usage: pnpm start -p 3100 & node scripts/capture-docs.mjs [baseUrl]
import { chromium, devices } from "@playwright/test";
import { mkdirSync, renameSync } from "node:fs";

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

async function demoPage(options = DESKTOP, { video, skipTour = true } = {}) {
  const context = await browser.newContext({
    ...options,
    ...(video ? { recordVideo: { dir: RAW, size: options.viewport ?? { width: 412, height: 915 } } } : {}),
  });
  const page = await context.newPage();
  await page.goto(`${BASE}/login`);
  await page.getByRole("button", { name: /Try the demo/ }).click();
  await page.getByRole("button", { name: /Account with mock data/ }).click();
  await page.waitForURL(`${BASE}/`);
  if (skipTour) {
    await page.getByRole("button", { name: "Skip tour" }).click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });
  }
  return { context, page };
}

async function saveVideo(context, page, name) {
  const path = await page.video()?.path();
  await context.close();
  if (path) renameSync(path, `${RAW}/${name}.webm`);
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
if (!process.env.FROM_STEP || process.env.FROM_STEP <= "1") {
  const context = await browser.newContext(DESKTOP);
  const page = await context.newPage();
  await page.goto(`${BASE}/login`);
  await page.waitForTimeout(600);
  await shot(page, "landing");
  await page.emulateMedia({ colorScheme: "dark" });
  await page.waitForTimeout(300);
  await shot(page, "landing-dark");
  await context.close();
}

// 2. Onboarding tour (video + screenshots)
if (!process.env.FROM_STEP || process.env.FROM_STEP <= "2") {
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
if (!process.env.FROM_STEP || process.env.FROM_STEP <= "3") {
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

// 4. Reports: standup + weekly + brag doc
{
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
  await page.getByRole("tab", { name: "Brag doc" }).click();
  await page.waitForTimeout(600);
  await page.getByRole("button", { name: /Generate brag doc/ }).click();
  await answer.and(page.locator('[aria-busy="false"]')).waitFor({ timeout: 60_000 });
  await page.waitForTimeout(800);
  await shot(page, "reports-brag", true);
  await saveVideo(context, page, "reports");
}

// 5. Timeline, Ask, Settings, command menu, dark mode
{
  const { context, page } = await demoPage(DESKTOP, { video: true });
  await page.goto(`${BASE}/timeline`);
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: /Previous week/ }).click();
  await page.waitForTimeout(900);
  await shot(page, "timeline", true);

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

  await page.keyboard.press("Meta+k");
  await page.waitForTimeout(500);
  await page.keyboard.type("standup", { delay: 60 });
  await page.waitForTimeout(700);
  await shot(page, "command-menu");
  await page.keyboard.press("Escape");
  await saveVideo(context, page, "explore");
}

{
  const { context, page } = await demoPage({ ...DESKTOP, colorScheme: "dark" });
  await page.goto(`${BASE}/timeline`);
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: /Previous week/ }).click();
  await page.waitForTimeout(900);
  await shot(page, "timeline-dark");
  await context.close();
}

// 6. Mobile
{
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
  await saveVideo(context, page, "mobile");
}

await browser.close();
console.log(`Screenshots → ${SHOTS}, raw videos → ${RAW} (convert with scripts/encode-media.sh)`);
