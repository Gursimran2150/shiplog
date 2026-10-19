import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PAGES = ["/", "/timeline", "/reports", "/ask", "/settings"];
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

/** Automated WCAG 2.1 A/AA scan of every screen, in light and dark themes. */
for (const theme of ["light", "dark"] as const) {
  test.describe(`${theme} theme`, () => {
    test.use({ colorScheme: theme });

    for (const path of PAGES) {
      test(`${path} has no WCAG A/AA violations`, async ({ page }) => {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      });
    }
  });
}

test.describe("landing", () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  for (const theme of ["light", "dark"] as const) {
    test(`login page has no WCAG A/AA violations (${theme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.goto("/login");
      const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      expect(violations.map((v) => v.id)).toEqual([]);
    });
  }
});
