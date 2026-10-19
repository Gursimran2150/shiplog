import { addDays } from "@/lib/domain/dates";
import type { EntryData, LogItem } from "@/lib/domain/types";

/**
 * About a year and a half of realistic history for demo accounts, generated deterministically
 * (same seed → same journal) so the heatmap, streaks, weekly reports, brag docs and search all
 * have something real-looking to work with. A fictional frontend engineer works through project
 * arcs one after another, with code reviews, bugs, on-call, meetings, blockers that get resolved,
 * leave and festival holidays, and the odd day they forget to log.
 */

interface Phrase {
  /** Structured, clear English (what ShipLog would store). */
  en: string;
  /** How it was said, Hinglish (the raw dictation). */
  hi: string;
}

interface Arc {
  project: string;
  tasks: Phrase[];
  /** A blocker hit midway through the arc and who it waits on. */
  blocker?: { en: string; hi: string; person: string };
  /** What shipping it achieved, said on the last day. */
  outcome: Phrase;
}

const p = (en: string, hi: string): Phrase => ({ en, hi });

const ARCS: Arc[] = [
  {
    project: "design-system",
    tasks: [
      p("Audit existing buttons and inputs across the app", "saare buttons aur inputs ka audit kiya"),
      p("Define colour and spacing tokens", "colour aur spacing tokens define kiye"),
      p("Build Button and Input components with variants", "variants ke saath Button aur Input components banaye"),
      p("Write Storybook stories for form components", "form components ki Storybook stories likhi"),
      p("Migrate settings page to new components", "settings page ko naye components pe migrate kiya"),
    ],
    blocker: {
      en: "Final brand colours not signed off by design",
      hi: "brand colours abhi design se final nahi hue",
      person: "Neha",
    },
    outcome: p(
      "Design system v1 shipped: 14 components, settings page migrated",
      "design system v1 ship ho gaya, 14 components",
    ),
  },
  {
    project: "auth",
    tasks: [
      p("Add Google sign-in button and OAuth callback", "Google sign-in ka button aur callback lagaya"),
      p("Handle session expiry with silent refresh", "session expiry pe silent refresh handle kiya"),
      p("Add magic-link login flow", "magic link wala login flow banaya"),
      p("Write e2e tests for all login paths", "saare login paths ke e2e tests likhe"),
    ],
    blocker: {
      en: "Google OAuth consent screen waiting for verification",
      hi: "Google OAuth consent screen verification pe atka hai",
      person: "Vikram",
    },
    outcome: p(
      "Google sign-in live; login drop-off down 18%",
      "Google sign-in live, login drop-off 18 percent kam hua",
    ),
  },
  {
    project: "checkout",
    tasks: [
      p("Redesign checkout into a single page", "checkout ko single page mein redesign kiya"),
      p("Add address autocomplete", "address autocomplete add kiya"),
      p("Integrate UPI payment option", "UPI payment option integrate kiya"),
      p("Fix Safari crash on payment step", "payment step pe Safari wala crash fix kiya"),
      p("Add analytics events for each checkout step", "har checkout step pe analytics events lagaye"),
      p("Run A/B test setup for new checkout", "naye checkout ka A/B test setup kiya"),
    ],
    blocker: {
      en: "Payment gateway sandbox keys not issued",
      hi: "payment gateway ki sandbox keys abhi nahi mili",
      person: "Arjun",
    },
    outcome: p("New checkout at 100%: conversion up 9%", "naya checkout 100 percent pe, conversion 9 percent upar"),
  },
  {
    project: "dashboard",
    tasks: [
      p("Build KPI summary cards", "KPI summary cards banaye"),
      p("Add date-range filter to dashboard", "dashboard pe date range filter lagaya"),
      p("Virtualise the activity table", "activity table ko virtualise kiya"),
      p("Add CSV export for reports", "reports ke liye CSV export add kiya"),
      p("Fix timezone bug in daily totals", "daily totals mein timezone wala bug fix kiya"),
    ],
    blocker: {
      en: "Analytics API returns wrong totals for IST",
      hi: "analytics API IST ke liye galat totals de rahi hai",
      person: "Rahul",
    },
    outcome: p("Dashboard v2 released; page load 2.1s → 0.9s", "dashboard v2 release, load time 2.1 se 0.9 second"),
  },
  {
    project: "performance",
    tasks: [
      p(
        "Profile home page with Lighthouse and React Profiler",
        "home page ko Lighthouse aur React Profiler se profile kiya",
      ),
      p("Code-split the editor bundle", "editor bundle ko code split kiya"),
      p("Lazy-load images below the fold", "neeche wali images lazy load ki"),
      p("Replace moment.js with date-fns", "moment.js hata ke date-fns lagaya"),
      p("Add bundle-size check to CI", "CI mein bundle size check lagaya"),
    ],
    outcome: p("Bundle 41% smaller; LCP 3.4s → 1.8s", "bundle 41 percent chhota, LCP 3.4 se 1.8 second"),
  },
  {
    project: "notifications",
    tasks: [
      p("Build in-app notification centre UI", "in-app notification centre ka UI banaya"),
      p("Wire notifications to WebSocket updates", "notifications ko WebSocket updates se joda"),
      p("Add notification preferences page", "notification preferences page banaya"),
      p("Add email digest toggle", "email digest ka toggle lagaya"),
    ],
    blocker: {
      en: "WebSocket gateway not deployed to staging",
      hi: "WebSocket gateway staging pe deploy nahi hua",
      person: "Karan",
    },
    outcome: p("Notification centre live for all users", "notification centre sab users ke liye live"),
  },
  {
    project: "onboarding",
    tasks: [
      p("Map current onboarding funnel drop-offs", "onboarding funnel ke drop-offs map kiye"),
      p("Build 3-step onboarding checklist", "3 step ka onboarding checklist banaya"),
      p("Add sample project for new workspaces", "naye workspaces ke liye sample project add kiya"),
      p("Add product tour with skip option", "skip option ke saath product tour banaya"),
      p("Ship onboarding to 50% of new users", "onboarding 50 percent naye users ko ship kiya"),
    ],
    outcome: p("Onboarding completion 38% → 61%", "onboarding completion 38 se 61 percent"),
  },
  {
    project: "accessibility",
    tasks: [
      p("Run axe audit on top 10 pages", "top 10 pages pe axe audit chalaya"),
      p("Fix focus order and visible focus rings", "focus order aur focus rings fix kiye"),
      p("Add labels to icon-only buttons", "icon-only buttons pe labels lagaye"),
      p("Make modals keyboard-trappable and escapable", "modals ko keyboard se properly chalne layak banaya"),
    ],
    outcome: p("WCAG AA issues 63 → 4 across top pages", "WCAG AA issues 63 se 4 pe aa gaye"),
  },
  {
    project: "search",
    tasks: [
      p("Build command palette with ⌘K", "⌘K wala command palette banaya"),
      p("Add debounced search with highlighted matches", "debounced search with highlights banaya"),
      p("Add recent searches and keyboard navigation", "recent searches aur keyboard navigation add kiya"),
      p("Index docs pages into search", "docs pages ko search mein index kiya"),
    ],
    blocker: {
      en: "Search API rate-limits the staging key",
      hi: "search API staging key ko rate limit kar rahi hai",
      person: "Rahul",
    },
    outcome: p(
      "Command palette shipped; 30% of power users use it daily",
      "command palette ship, 30 percent power users daily use kar rahe",
    ),
  },
  {
    project: "mobile-web",
    tasks: [
      p("Make sidebar collapsible on mobile", "mobile pe sidebar collapsible banaya"),
      p("Fix 100vh issues on iOS Safari", "iOS Safari pe 100vh wale issues fix kiye"),
      p("Increase touch targets to 44px", "touch targets 44px kiye"),
      p("Add pull-to-refresh on feed", "feed pe pull to refresh lagaya"),
    ],
    outcome: p("Mobile usability score 71 → 96", "mobile usability score 71 se 96"),
  },
  {
    project: "billing",
    tasks: [
      p("Build plans and pricing page", "plans aur pricing page banaya"),
      p("Add upgrade flow with proration preview", "proration preview ke saath upgrade flow banaya"),
      p("Show invoices list with PDF download", "invoices list with PDF download banayi"),
      p("Handle failed-payment banners", "failed payment wale banners handle kiye"),
    ],
    blocker: {
      en: "GST invoice format pending from finance",
      hi: "GST invoice ka format finance se pending hai",
      person: "Priya",
    },
    outcome: p(
      "Self-serve upgrades live; 120 upgrades in week one",
      "self-serve upgrades live, pehle hafte 120 upgrades",
    ),
  },
  {
    project: "i18n",
    tasks: [
      p("Extract hard-coded strings to message files", "hard-coded strings ko message files mein nikala"),
      p("Add Hindi translations for core screens", "core screens ke Hindi translations add kiye"),
      p("Add locale switcher", "locale switcher lagaya"),
      p("Format dates and currency per locale", "dates aur currency locale ke hisaab se format ki"),
    ],
    outcome: p("Hindi UI launched; 12% of users switched", "Hindi UI launch, 12 percent users ne switch kiya"),
  },
  {
    project: "editor",
    tasks: [
      p("Add slash commands to the rich-text editor", "editor mein slash commands add kiye"),
      p("Support image paste and drag-drop upload", "image paste aur drag-drop upload support kiya"),
      p("Add autosave with conflict warning", "conflict warning ke saath autosave lagaya"),
      p("Add markdown shortcuts", "markdown shortcuts add kiye"),
      p("Fix cursor jump on collaborative edits", "collaborative editing mein cursor jump fix kiya"),
    ],
    blocker: {
      en: "Image upload service returns 413 for large files",
      hi: "badi files pe upload service 413 de rahi hai",
      person: "Karan",
    },
    outcome: p(
      "Editor v3 shipped; support tickets about editing down 35%",
      "editor v3 ship, editing tickets 35 percent kam",
    ),
  },
  {
    project: "testing",
    tasks: [
      p("Set up Playwright with CI sharding", "CI sharding ke saath Playwright setup kiya"),
      p("Add visual regression tests for key pages", "key pages ke visual regression tests lagaye"),
      p("Fix 9 flaky tests", "9 flaky tests fix kiye"),
      p("Raise unit test coverage on utils to 90%", "utils ka coverage 90 percent tak le gaya"),
    ],
    outcome: p("CI time 22 → 9 minutes; flaky rate under 1%", "CI time 22 se 9 minute, flaky rate 1 percent se kam"),
  },
  {
    project: "settings",
    tasks: [
      p("Build team members and roles page", "team members aur roles page banaya"),
      p("Add invite by email with expiry", "email invite with expiry add kiya"),
      p("Add audit log table", "audit log table banayi"),
      p("Add SSO configuration form", "SSO configuration form banaya"),
    ],
    blocker: {
      en: "Roles API missing the 'billing admin' role",
      hi: "roles API mein 'billing admin' role missing hai",
      person: "Arjun",
    },
    outcome: p("Team management shipped to all paid workspaces", "team management sab paid workspaces pe ship"),
  },
  {
    project: "analytics",
    tasks: [
      p("Add funnel chart component", "funnel chart component banaya"),
      p("Build cohort retention table", "cohort retention table banayi"),
      p("Add saved views for filters", "filters ke saved views add kiye"),
      p("Cache heavy queries on the client with SWR", "heavy queries ko SWR se cache kiya"),
    ],
    outcome: p(
      "Analytics page used by 3 internal teams weekly",
      "analytics page 3 internal teams har hafte use kar rahi",
    ),
  },
];

const SIDE: Phrase[] = [
  p("Reviewed 3 PRs from the team", "team ke 3 PRs review kiye"),
  p("Reviewed Ananya's PR on table sorting", "Ananya ka table sorting wala PR review kiya"),
  p("Paired with intern on React hooks", "intern ke saath React hooks pe pairing ki"),
  p("Fixed a production bug in the date picker", "production mein date picker ka bug fix kiya"),
  p("Fixed broken layout on Firefox", "Firefox pe toota hua layout fix kiya"),
  p("Upgraded Next.js and fixed breaking changes", "Next.js upgrade kiya aur breaking changes fix kiye"),
  p("Bumped dependencies and fixed audit warnings", "dependencies update ki aur audit warnings fix ki"),
  p("Took a frontend interview", "ek frontend interview liya"),
  p("Wrote the RFC for state management cleanup", "state management cleanup ka RFC likha"),
  p("Helped support debug a customer issue", "support ke saath ek customer issue debug kiya"),
  p("Handled on-call alerts for the web app", "web app ka on-call handle kiya"),
  p("Sprint planning and estimation", "sprint planning aur estimation ki"),
  p("Demoed progress in the sprint review", "sprint review mein demo diya"),
  p("Updated the frontend onboarding docs", "frontend onboarding docs update kiye"),
  p("Fixed a memory leak in the chat widget", "chat widget mein memory leak fix kiya"),
];

/** Holidays the fictional engineer takes off (month-day), plus a week of leave each May. */
const HOLIDAYS = new Set(["01-26", "03-14", "08-15", "10-02", "10-20", "10-21", "11-01", "12-25"]);
const isLeave = (date: string) => {
  const md = date.slice(5);
  return HOLIDAYS.has(md) || (md >= "05-12" && md <= "05-16");
};

/** Small seeded PRNG (mulberry32) so every demo account gets the same believable history. */
function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const item = (phrase: Phrase, project: string | null): LogItem => ({ text: phrase.en, project });

/** Tasks are written as plans ("Build X"); once done they read in the past tense ("Built X"). */
const PAST: Record<string, string> = {
  Add: "Added",
  Audit: "Audited",
  Build: "Built",
  Cache: "Cached",
  "Code-split": "Code-split",
  Define: "Defined",
  Extract: "Extracted",
  Fix: "Fixed",
  Format: "Formatted",
  Handle: "Handled",
  Increase: "Increased",
  Index: "Indexed",
  Integrate: "Integrated",
  "Lazy-load": "Lazy-loaded",
  Make: "Made",
  Map: "Mapped",
  Migrate: "Migrated",
  Profile: "Profiled",
  Raise: "Raised",
  Redesign: "Redesigned",
  Replace: "Replaced",
  Run: "Ran",
  Ship: "Shipped",
  Show: "Added",
  Support: "Supported",
  Virtualise: "Virtualised",
  Wire: "Wired",
  Write: "Wrote",
};
const finished = (phrase: Phrase, project: string): LogItem => {
  const [verb, ...rest] = phrase.en.split(" ");
  if (verb === "Set" && rest[0] === "up") return { text: `Set up ${rest.slice(1).join(" ")}`, project };
  return { text: `${PAST[verb] ?? verb} ${rest.join(" ")}`, project };
};

/** "colour aur spacing tokens define kiye" → "colour aur spacing tokens define" (the work, without the verb). */
const topic = (hi: string) =>
  hi.replace(/ (kiya|kiye|ki|banaya|banayi|banaye|lagaya|lagaye|likhe|likha|likhi|chalaya|joda|nikala|le gaya)$/, "");
const lower = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

export interface DemoEntry {
  date: string;
  raw: string;
  data: EntryData;
}

/**
 * Generates one log per working day from `from` up to (not including) `until`. Weekends,
 * holidays and ~7% of ordinary days are skipped, as real people forget.
 */
export function demoHistory(from: string, until: string, seed = 2150): DemoEntry[] {
  const random = rng(seed);
  const pick = <T>(list: readonly T[]) => list[Math.floor(random() * list.length)];
  const entries: DemoEntry[] = [];

  let arcIndex = 0;
  let taskIndex = 0;
  let taskDaysLeft = 1 + Math.floor(random() * 3);
  let progress = 0; // % of the current task done, only ever goes up
  let blocked = 0; // days left on the current blocker
  let blockerUsed = false;

  for (let date = from; date < until; date = addDays(date, 1)) {
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
    if (weekday === 0 || weekday === 6 || isLeave(date) || random() < 0.07) continue;

    const arc = ARCS[arcIndex % ARCS.length];
    const task = arc.tasks[taskIndex];
    const done: LogItem[] = [];
    const inProgress: LogItem[] = [];
    const blockers: LogItem[] = [];
    const tomorrow: LogItem[] = [];
    const said: string[] = [];

    // Hit the arc's blocker once, about halfway through.
    if (arc.blocker && !blockerUsed && taskIndex === Math.floor(arc.tasks.length / 2)) {
      blockerUsed = true;
      blocked = 1 + Math.floor(random() * 3);
    }

    let summary: string;
    if (blocked > 0 && arc.blocker) {
      const { en, hi, person } = arc.blocker;
      blocked--;
      blockers.push({ text: `${en} (waiting on ${person})`, project: arc.project });
      inProgress.push(item(task, arc.project));
      tomorrow.push({ text: `Follow up with ${person} to unblock: ${lower(task.en)}`, project: arc.project });
      said.push(
        `${topic(task.hi)} wala kaam ruka hua hai, ${hi}`,
        `${person} ko ping kiya, kal phir follow up karunga`,
      );
      summary = `Blocked on ${arc.project}: ${lower(en)}.`;
    } else if (--taskDaysLeft <= 0) {
      const main = finished(task, arc.project);
      done.push(main);
      said.push(`aaj ${task.hi}`);
      summary = main.text;
      taskIndex++;
      taskDaysLeft = 1 + Math.floor(random() * 3);
      progress = 0;
      if (taskIndex >= arc.tasks.length) {
        done.push(item(arc.outcome, arc.project));
        said.push(`${arc.outcome.hi}, finally ship ho gaya`);
        summary = `Shipped ${arc.project}: ${lower(arc.outcome.en)}`;
        arcIndex++;
        taskIndex = 0;
        blockerUsed = false;
      }
      const nextArc = ARCS[arcIndex % ARCS.length];
      const next = nextArc.tasks[taskIndex];
      tomorrow.push(item(next, nextArc.project));
      said.push(`kal ${topic(next.hi)} karna hai`);
    } else {
      progress = Math.min(90, progress + 20 + Math.floor(random() * 3) * 10);
      const pct = progress;
      inProgress.push({ text: `${task.en} (${pct}% done)`, project: arc.project });
      tomorrow.push(item(task, arc.project));
      said.push(`${topic(task.hi)} wala kaam chal raha hai, ${pct} percent ho gaya`);
      summary = `Progressed on ${arc.project}: ${lower(task.en)} (${pct}%)`;
    }

    // Everyday engineering work around the main project.
    const sideCount = random() < 0.55 ? 1 : random() < 0.25 ? 2 : 0;
    for (let i = 0; i < sideCount; i++) {
      const side = pick(SIDE);
      if (done.some((d) => d.text === side.en)) continue;
      done.push(item(side, null));
      said.push(random() < 0.5 ? `aur ${side.hi}` : `saath mein ${side.hi}`);
    }
    if (!blockers.length && done.length > 1) summary += `, plus ${done.length - 1} more`;
    if (!summary.endsWith(".")) summary += ".";

    entries.push({
      date,
      raw: `${said.join(". ")}.`.replace(/^./, (c) => c.toUpperCase()),
      data: { summary: summary.slice(0, 240), done, inProgress, blockers, tomorrow },
    });
  }
  return entries;
}
