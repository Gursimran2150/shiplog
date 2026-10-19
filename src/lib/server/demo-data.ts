import type { EntryData } from "@/lib/domain/types";
import { addDays } from "@/lib/domain/dates";
import { demoHistory, type DemoEntry } from "./demo-history";

/** How far back demo history goes: about a year and a half of working days. */
const HISTORY_DAYS = 540;

/**
 * The most recent two weeks of a demo journal, hand-written so they read like a real story; older
 * history comes from `demoHistory`. Clearly sample data for a fictional engineer; every report
 * and answer generated from it is still a live AI call.
 */
const SAMPLES: { raw: string; data: EntryData }[] = [
  {
    raw: "aaj login page ka redirect bug fix kiya, PR raise kar diya. dashboard ke charts pe kaam start kiya. kal charts finish karne hain.",
    data: {
      summary: "Fixed the login redirect bug and started the dashboard charts.",
      done: [{ text: "Fixed login page redirect bug and opened a PR", project: "auth" }],
      inProgress: [{ text: "Building dashboard usage charts", project: "dashboard" }],
      blockers: [],
      tomorrow: [{ text: "Finish dashboard charts", project: "dashboard" }],
    },
  },
  {
    raw: "Charts done with Recharts, dark mode bhi support kiya. Design review mein feedback mila spacing ko lekar. API se data abhi mock hai, backend endpoint ready nahi hai.",
    data: {
      summary: "Finished dashboard charts with dark mode; blocked on the usage API.",
      done: [
        { text: "Finished dashboard charts with dark mode support", project: "dashboard" },
        { text: "Attended design review and collected spacing feedback", project: "dashboard" },
      ],
      inProgress: [{ text: "Applying spacing feedback from design review", project: "dashboard" }],
      blockers: [{ text: "Usage API endpoint not ready from backend", project: "dashboard" }],
      tomorrow: [{ text: "Integrate usage API once backend ships it", project: "dashboard" }],
    },
  },
  {
    raw: "Spacing fixes merge ho gaye. Rahul ke saath usage API ka contract finalise kiya. Accessibility audit mein 3 issues mile, unme se 2 fix kiye.",
    data: {
      summary: "Merged spacing fixes, agreed the usage API contract and fixed accessibility issues.",
      done: [
        { text: "Merged dashboard spacing fixes", project: "dashboard" },
        { text: "Finalised usage API contract with Rahul", project: "dashboard" },
        { text: "Fixed 2 of 3 accessibility audit issues", project: "web-app" },
      ],
      inProgress: [{ text: "Fixing the last accessibility issue (focus trap in modal)", project: "web-app" }],
      blockers: [],
      tomorrow: [{ text: "Fix modal focus trap", project: "web-app" }],
    },
  },
  {
    raw: "Modal focus trap fix kiya. Checkout page ka bundle size 40 percent kam kiya lazy loading se. Sprint planning thi.",
    data: {
      summary: "Fixed the modal focus trap and cut checkout bundle size by 40%.",
      done: [
        { text: "Fixed modal focus trap", project: "web-app" },
        { text: "Cut checkout bundle size by 40% with lazy loading", project: "checkout" },
        { text: "Sprint planning", project: null },
      ],
      inProgress: [],
      blockers: [],
      tomorrow: [{ text: "Start onboarding flow redesign", project: "onboarding" }],
    },
  },
  {
    raw: "Onboarding redesign shuru kiya, 3 step wizard bana raha hoon. Figma mein copy final nahi hai abhi.",
    data: {
      summary: "Started the 3-step onboarding wizard; waiting on final copy.",
      done: [{ text: "Scaffolded the 3-step onboarding wizard", project: "onboarding" }],
      inProgress: [{ text: "Building onboarding wizard steps", project: "onboarding" }],
      blockers: [{ text: "Final onboarding copy not ready in Figma", project: "onboarding" }],
      tomorrow: [{ text: "Add form validation to onboarding wizard", project: "onboarding" }],
    },
  },
  {
    raw: "Wizard validation add kiya zod ke saath. Usage API aa gaya, dashboard integrate kar diya. Unit tests likhe.",
    data: {
      summary: "Integrated the usage API into the dashboard and added wizard validation and tests.",
      done: [
        { text: "Integrated usage API into dashboard", project: "dashboard" },
        { text: "Added zod validation to onboarding wizard", project: "onboarding" },
        { text: "Wrote unit tests for wizard validation", project: "onboarding" },
      ],
      inProgress: [],
      blockers: [],
      tomorrow: [{ text: "Code review for teammates' PRs", project: null }],
    },
  },
  {
    raw: "3 PRs review kiye. Production mein ek hotfix kiya, payments page crash ho raha tha Safari pe. Postmortem doc likha.",
    data: {
      summary: "Reviewed 3 PRs and shipped a Safari hotfix for the payments page.",
      done: [
        { text: "Reviewed 3 teammate PRs", project: null },
        { text: "Shipped hotfix for payments page crash on Safari", project: "checkout" },
        { text: "Wrote postmortem for the Safari crash", project: "checkout" },
      ],
      inProgress: [],
      blockers: [],
      tomorrow: [{ text: "Add Safari to the E2E test matrix", project: "checkout" }],
    },
  },
  {
    raw: "Playwright mein Safari add kiya CI mein. Onboarding wizard ka final copy aa gaya, update kar diya. Demo diya PM ko.",
    data: {
      summary: "Added Safari to CI, updated onboarding copy and demoed to the PM.",
      done: [
        { text: "Added Safari to Playwright CI matrix", project: "checkout" },
        { text: "Updated onboarding wizard with final copy", project: "onboarding" },
        { text: "Demoed onboarding flow to the PM", project: "onboarding" },
      ],
      inProgress: [{ text: "Addressing PM feedback on onboarding", project: "onboarding" }],
      blockers: [],
      tomorrow: [{ text: "Ship onboarding behind a feature flag", project: "onboarding" }],
    },
  },
  {
    raw: "Onboarding feature flag ke peeche ship kar diya, 10 percent users ko. Error tracking setup kiya Sentry mein. Design system mein button component refactor shuru kiya.",
    data: {
      summary: "Shipped onboarding to 10% of users and started the button refactor.",
      done: [
        { text: "Shipped onboarding to 10% of users behind a feature flag", project: "onboarding" },
        { text: "Set up Sentry error tracking for onboarding", project: "onboarding" },
      ],
      inProgress: [{ text: "Refactoring design-system Button component", project: "design-system" }],
      blockers: [],
      tomorrow: [{ text: "Finish Button refactor and update docs", project: "design-system" }],
    },
  },
  {
    raw: "Button refactor done, Storybook docs update kiye. Onboarding conversion 12 percent badha. Ab 50 percent rollout ka plan hai.",
    data: {
      summary: "Finished the Button refactor; onboarding conversion is up 12%.",
      done: [
        { text: "Finished Button refactor and Storybook docs", project: "design-system" },
        { text: "Measured onboarding conversion: +12%", project: "onboarding" },
      ],
      inProgress: [],
      blockers: [],
      tomorrow: [{ text: "Roll onboarding out to 50% of users", project: "onboarding" }],
    },
  },
];

/**
 * A demo journal: ~18 months of generated history, then the hand-written samples on the last
 * N weekdays before `today`. Oldest first.
 */
export function demoEntries(today: string): DemoEntry[] {
  const dates: string[] = [];
  let cursor = addDays(today, -1);
  while (dates.length < SAMPLES.length) {
    const weekday = new Date(`${cursor}T00:00:00Z`).getUTCDay();
    if (weekday !== 0 && weekday !== 6) dates.unshift(cursor);
    cursor = addDays(cursor, -1);
  }
  const recent = SAMPLES.map((s, i) => ({ date: dates[i], ...s }));
  return [...demoHistory(addDays(today, -HISTORY_DAYS), dates[0]), ...recent];
}
