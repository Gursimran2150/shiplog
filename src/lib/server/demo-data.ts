import { randomUUID } from "node:crypto";
import { addDays } from "@/lib/domain/dates";
import { SECTIONS, type EntryData, type NoteKind } from "@/lib/domain/types";
import {
  demoHistory,
  type DemoDay,
  type DemoItem,
  type DemoJournal,
  type DemoNote,
  type DemoTask,
} from "./demo-history";

/** How far back demo history goes: about a year and a half of working days. */
const HISTORY_DAYS = 540;

/** Tasks the hand-written days below follow (keys match the items' `key`). */
const RECENT_TASKS: DemoTask[] = [
  { key: "login-redirect", title: "Fix login page redirect bug", project: "auth" },
  { key: "usage-charts", title: "Build dashboard usage charts", project: "dashboard" },
  { key: "spacing", title: "Apply design review spacing feedback", project: "dashboard" },
  { key: "usage-api", title: "Integrate the usage API into the dashboard", project: "dashboard" },
  { key: "a11y", title: "Fix accessibility audit issues", project: "web-app" },
  { key: "checkout-bundle", title: "Cut checkout bundle size", project: "checkout" },
  { key: "onboarding", title: "Redesign onboarding as a 3-step wizard", project: "onboarding" },
  { key: "safari-crash", title: "Fix payments page crash on Safari", project: "checkout" },
  { key: "button-refactor", title: "Refactor the design-system Button", project: "design-system" },
  { key: "flag-latency", title: "Fix slow feature-flag propagation in EU", project: "platform" },
];

const RECENT_NOTES: DemoNote[] = [
  {
    key: "usage-api",
    kind: "fix",
    body: "Backend endpoint wasn't ready, so Rahul and I agreed the response contract first (fields, pagination, IST totals). I built the charts against a typed mock of that contract; switching to the real API was a one-line change.",
  },
  {
    key: "usage-api",
    kind: "learning",
    body: "Agree API contracts before either side starts building. A typed mock keeps frontend work unblocked.",
  },
  {
    key: "safari-crash",
    kind: "fix",
    body: "Safari threw on `Intl.NumberFormat` with `roundingMode` (not supported in Safari 16). Replaced it with Math.round before formatting and added a feature check.",
  },
  {
    key: "safari-crash",
    kind: "learning",
    body: "Our E2E only ran on Chromium. Added WebKit to the Playwright matrix so this class of bug fails in CI.",
  },
  {
    key: "onboarding",
    kind: "note",
    body: "Rollout plan: 10% → 50% → 100%, one step per 2 days if completion and error rate hold.",
  },
  {
    key: "a11y",
    kind: "learning",
    body: "Radix Dialog handles focus trapping for us; the bug came from a custom modal. Prefer the shared primitives.",
  },
];

const item = (text: string, project: string | null, key?: string): DemoItem =>
  key ? { text, project, key } : { text, project };

/**
 * The most recent two weeks plus today, hand-written so they read like a real story; older
 * history comes from `demoHistory`. Clearly sample data for a fictional engineer; every report
 * and answer generated from it is still a live AI call.
 */
const SAMPLES: Omit<DemoDay, "date">[] = [
  {
    raw: "aaj login page ka redirect bug fix kiya, PR raise kar diya. dashboard ke charts pe kaam start kiya. kal charts finish karne hain.",
    data: {
      summary: "Fixed the login redirect bug and started the dashboard charts.",
      done: [item("Fixed login page redirect bug and opened a PR", "auth", "login-redirect")],
      inProgress: [item("Building dashboard usage charts", "dashboard", "usage-charts")],
      blockers: [],
      tomorrow: [item("Finish dashboard charts", "dashboard", "usage-charts")],
    },
  },
  {
    raw: "Charts done with Recharts, dark mode bhi support kiya. Design review mein feedback mila spacing ko lekar. API se data abhi mock hai, backend endpoint ready nahi hai.",
    data: {
      summary: "Finished dashboard charts with dark mode; blocked on the usage API.",
      done: [
        item("Finished dashboard charts with dark mode support", "dashboard", "usage-charts"),
        item("Attended design review and collected spacing feedback", "dashboard", "spacing"),
      ],
      inProgress: [item("Applying spacing feedback from design review", "dashboard", "spacing")],
      blockers: [item("Usage API endpoint not ready from backend", "dashboard", "usage-api")],
      tomorrow: [item("Integrate usage API once backend ships it", "dashboard", "usage-api")],
    },
  },
  {
    raw: "Spacing fixes merge ho gaye. Rahul ke saath usage API ka contract finalise kiya. Accessibility audit mein 3 issues mile, unme se 2 fix kiye.",
    data: {
      summary: "Merged spacing fixes, agreed the usage API contract and fixed accessibility issues.",
      done: [
        item("Merged dashboard spacing fixes", "dashboard", "spacing"),
        item("Finalised usage API contract with Rahul", "dashboard", "usage-api"),
        item("Fixed 2 of 3 accessibility audit issues", "web-app", "a11y"),
      ],
      inProgress: [item("Fixing the last accessibility issue (focus trap in modal)", "web-app", "a11y")],
      blockers: [],
      tomorrow: [item("Fix modal focus trap", "web-app", "a11y")],
    },
  },
  {
    raw: "Modal focus trap fix kiya. Checkout page ka bundle size 40 percent kam kiya lazy loading se. Sprint planning thi.",
    data: {
      summary: "Fixed the modal focus trap and cut checkout bundle size by 40%.",
      done: [
        item("Fixed modal focus trap", "web-app", "a11y"),
        item("Cut checkout bundle size by 40% with lazy loading", "checkout", "checkout-bundle"),
        item("Sprint planning", null),
      ],
      inProgress: [],
      blockers: [],
      tomorrow: [item("Start onboarding flow redesign", "onboarding", "onboarding")],
    },
  },
  {
    raw: "Onboarding redesign shuru kiya, 3 step wizard bana raha hoon. Figma mein copy final nahi hai abhi.",
    data: {
      summary: "Started the 3-step onboarding wizard; waiting on final copy.",
      done: [item("Scaffolded the 3-step onboarding wizard", "onboarding", "onboarding")],
      inProgress: [item("Building onboarding wizard steps", "onboarding", "onboarding")],
      blockers: [item("Final onboarding copy not ready in Figma", "onboarding", "onboarding")],
      tomorrow: [item("Add form validation to onboarding wizard", "onboarding", "onboarding")],
    },
  },
  {
    raw: "Wizard validation add kiya zod ke saath. Usage API aa gaya, dashboard integrate kar diya. Unit tests likhe.",
    data: {
      summary: "Integrated the usage API into the dashboard and added wizard validation and tests.",
      done: [
        item("Integrated usage API into dashboard", "dashboard", "usage-api"),
        item("Added zod validation to onboarding wizard", "onboarding", "onboarding"),
        item("Wrote unit tests for wizard validation", "onboarding", "onboarding"),
      ],
      inProgress: [],
      blockers: [],
      tomorrow: [item("Code review for teammates' PRs", null)],
    },
  },
  {
    raw: "3 PRs review kiye. Production mein ek hotfix kiya, payments page crash ho raha tha Safari pe. Postmortem doc likha.",
    data: {
      summary: "Reviewed 3 PRs and shipped a Safari hotfix for the payments page.",
      done: [
        item("Reviewed 3 teammate PRs", null),
        item("Shipped hotfix for payments page crash on Safari", "checkout", "safari-crash"),
        item("Wrote postmortem for the Safari crash", "checkout", "safari-crash"),
      ],
      inProgress: [],
      blockers: [],
      tomorrow: [item("Add Safari to the E2E test matrix", "checkout", "safari-crash")],
    },
  },
  {
    raw: "Playwright mein Safari add kiya CI mein. Onboarding wizard ka final copy aa gaya, update kar diya. Demo diya PM ko.",
    data: {
      summary: "Added Safari to CI, updated onboarding copy and demoed to the PM.",
      done: [
        item("Added Safari to Playwright CI matrix", "checkout", "safari-crash"),
        item("Updated onboarding wizard with final copy", "onboarding", "onboarding"),
        item("Demoed onboarding flow to the PM", "onboarding", "onboarding"),
      ],
      inProgress: [item("Addressing PM feedback on onboarding", "onboarding", "onboarding")],
      blockers: [],
      tomorrow: [item("Ship onboarding behind a feature flag", "onboarding", "onboarding")],
    },
  },
  {
    raw: "Onboarding feature flag ke peeche ship kar diya, 10 percent users ko. Error tracking setup kiya Sentry mein. Design system mein button component refactor shuru kiya.",
    data: {
      summary: "Shipped onboarding to 10% of users and started the button refactor.",
      done: [
        item("Shipped onboarding to 10% of users behind a feature flag", "onboarding", "onboarding"),
        item("Set up Sentry error tracking for onboarding", "onboarding", "onboarding"),
      ],
      inProgress: [item("Refactoring design-system Button component", "design-system", "button-refactor")],
      blockers: [],
      tomorrow: [item("Finish Button refactor and update docs", "design-system", "button-refactor")],
    },
  },
  {
    raw: "Button refactor done, Storybook docs update kiye. Onboarding conversion 12 percent badha. Ab 50 percent rollout ka plan hai.",
    data: {
      summary: "Finished the Button refactor; onboarding conversion is up 12%.",
      done: [
        item("Finished Button refactor and Storybook docs", "design-system", "button-refactor"),
        item("Measured onboarding conversion: +12%", "onboarding", "onboarding"),
      ],
      inProgress: [],
      blockers: [],
      tomorrow: [item("Roll onboarding out to 50% of users", "onboarding", "onboarding")],
    },
  },
];

/** Today's log for demo accounts, so the Today screen opens with work already on it. */
const TODAY: Omit<DemoDay, "date"> = {
  raw: "Onboarding 50 percent users pe rollout kar diya, completion metrics dekh raha hoon. Support queue se 4 bugs triage kiye. EU mein feature flag update hone mein 10 minute lag rahe hain, Karan se baat ki. Kal metrics theek rahe to 100 percent.",
  data: {
    summary: "Rolled onboarding out to 50% of users; flag propagation in the EU is slow.",
    done: [
      item("Rolled onboarding out to 50% of users", "onboarding", "onboarding"),
      item("Triaged 4 bugs from the support queue", null),
    ],
    inProgress: [item("Watching onboarding completion and error rates after rollout", "onboarding", "onboarding")],
    blockers: [
      item("Feature flags take ~10 min to update in the EU region (waiting on Karan)", "platform", "flag-latency"),
    ],
    tomorrow: [
      item("Ramp onboarding to 100% if metrics hold", "onboarding", "onboarding"),
      item("Pair with Karan on feature-flag propagation", "platform", "flag-latency"),
    ],
  },
};

/**
 * A demo journal: ~18 months of generated history, the hand-written days on the last weekdays
 * before `today`, and a log for today itself. Oldest first.
 */
export function demoJournal(today: string): DemoJournal {
  const dates: string[] = [];
  let cursor = addDays(today, -1);
  while (dates.length < SAMPLES.length) {
    const weekday = new Date(`${cursor}T00:00:00Z`).getUTCDay();
    if (weekday !== 0 && weekday !== 6) dates.unshift(cursor);
    cursor = addDays(cursor, -1);
  }
  const history = demoHistory(addDays(today, -HISTORY_DAYS), dates[0]);
  return {
    days: [...history.days, ...SAMPLES.map((d, i) => ({ date: dates[i], ...d })), { date: today, ...TODAY }],
    tasks: [...history.tasks, ...RECENT_TASKS],
    notes: [...history.notes, ...RECENT_NOTES],
  };
}

/** Gives demo tasks real ids and points log items at them, ready to insert. */
export function materializeJournal(journal: DemoJournal, newId: () => string = randomUUID) {
  const ids = new Map(journal.tasks.map((t) => [t.key, newId()]));
  const entries = journal.days.map((day) => {
    const data = { summary: day.data.summary } as EntryData;
    for (const section of SECTIONS) {
      data[section] = day.data[section].map(({ key, ...rest }) => {
        const taskId = key ? ids.get(key) : undefined;
        return taskId ? { ...rest, taskId } : rest;
      });
    }
    return { date: day.date, raw: day.raw, data };
  });
  return {
    entries,
    tasks: journal.tasks.map((t) => ({ id: ids.get(t.key) as string, title: t.title, project: t.project })),
    notes: journal.notes.flatMap((n) => {
      const taskId = ids.get(n.key);
      return taskId ? [{ taskId, kind: n.kind as NoteKind, body: n.body }] : [];
    }),
  };
}

/** Everything a new demo account needs, for logs ending today. */
export const demoSeed = (today: string) => materializeJournal(demoJournal(today));
