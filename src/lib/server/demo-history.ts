import { addDays } from "@/lib/domain/dates";
import type { LogItem, NoteKind, Section } from "@/lib/domain/types";

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
  blocker?: { en: string; hi: string; person: string; fix: string; learning: string };
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
      fix: "Neha shared two palette options; we shipped tokens with the safer one and swapped values later, no component changes needed.",
      learning: "Build on tokens, not raw colours, so design decisions can land late without blocking engineering.",
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
      fix: "Vikram submitted the privacy policy URL and demo video; Google approved in 3 days. We tested meanwhile with internal test users.",
      learning: "Start OAuth verification on day one; it runs on Google's clock, not ours.",
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
      fix: "Arjun escalated to the gateway's account manager; meanwhile I built against a mocked client with the same interface.",
      learning: "Wrap third-party SDKs behind our own interface so a missing key never blocks UI work.",
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
      fix: "Root cause: totals were bucketed in UTC. Rahul added a timeZone param; we pass the user's zone from the browser.",
      learning: "Always send the user's time zone with date-range queries; never let the server guess.",
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
      fix: "Karan deployed the gateway behind a feature flag; I added polling as a fallback so the UI works either way.",
      learning: "Real-time features need a graceful fallback from day one.",
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
      fix: "Rahul raised the staging quota; I added 250ms debouncing and request cancellation, which cut calls by 70%.",
      learning: "Debounce and cancel in-flight requests for type-ahead search before asking for more quota.",
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
      fix: "Priya shared the GST template; we render invoices server-side from it so finance can change the layout later.",
      learning: "Ask finance and legal for formats in week one of any billing work.",
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
      fix: "Karan raised the body limit to 10 MB; I now resize images client-side to max 2560px before upload.",
      learning: "Validate and shrink files on the client; it's faster for users and protects the server.",
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
      fix: "Arjun added the role behind a migration; I modelled roles as data from the API instead of a hard-coded enum.",
      learning: "Don't hard-code permission lists in the UI; read them from the API.",
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
const pastTense = (en: string): string => {
  const [verb, ...rest] = en.split(" ");
  if (verb === "Set" && rest[0] === "up") return en;
  return `${PAST[verb] ?? verb} ${rest.join(" ")}`;
};

/** "colour aur spacing tokens define kiye" → "colour aur spacing tokens define" (the work, without the verb). */
const topic = (hi: string) =>
  hi.replace(/ (kiya|kiye|ki|banaya|banayi|banaye|lagaya|lagaye|likhe|likha|likhi|chalaya|joda|nikala|le gaya)$/, "");
const lower = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

/** A log item that may belong to a demo task, referenced by a stable key until ids are assigned. */
export interface DemoItem extends LogItem {
  key?: string;
}

export interface DemoDay {
  date: string;
  raw: string;
  data: { summary: string } & Record<Section, DemoItem[]>;
}

export interface DemoTask {
  key: string;
  title: string;
  project: string | null;
}

export interface DemoNote {
  key: string;
  kind: NoteKind;
  body: string;
}

export interface DemoJournal {
  days: DemoDay[];
  tasks: DemoTask[];
  notes: DemoNote[];
}

/**
 * Generates one log per working day from `from` up to (not including) `until`. Weekends,
 * holidays and ~7% of ordinary days are skipped, as real people forget. Each project task is a
 * demo task (its journey); blockers come with a "how it was fixed" note and a learning.
 */
export function demoHistory(from: string, until: string, seed = 2150): DemoJournal {
  const random = rng(seed);
  const pick = <T>(list: readonly T[]) => list[Math.floor(random() * list.length)];
  const days: DemoDay[] = [];
  const tasks = new Map<string, DemoTask>();
  const notes: DemoNote[] = [];

  let arcIndex = 0;
  let taskIndex = 0;
  let taskDaysLeft = 1 + Math.floor(random() * 3);
  let progress = 0; // % of the current task done, only ever goes up
  let blocked = 0; // days left on the current blocker
  let blockerUsed = false;

  /** The task at a position in the arc sequence, registered on first use. */
  const taskAt = (arcAt: number, at: number) => {
    const arc = ARCS[arcAt % ARCS.length];
    const phrase = arc.tasks[at];
    const key = `h${arcAt}-${at}`;
    // Projects come round again after a year: the second pass is the next version of that work.
    const round = Math.floor(arcAt / ARCS.length);
    const title = round ? `${phrase.en} (v${round + 1})` : phrase.en;
    if (!tasks.has(key)) tasks.set(key, { key, title, project: arc.project });
    return { arc, phrase, key };
  };

  for (let date = from; date < until; date = addDays(date, 1)) {
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
    if (weekday === 0 || weekday === 6 || isLeave(date) || random() < 0.07) continue;

    const { arc, phrase: task, key } = taskAt(arcIndex, taskIndex);
    const done: DemoItem[] = [];
    const inProgress: DemoItem[] = [];
    const blockers: DemoItem[] = [];
    const tomorrow: DemoItem[] = [];
    const said: string[] = [];

    // Hit the arc's blocker once, about halfway through.
    if (arc.blocker && !blockerUsed && taskIndex === Math.floor(arc.tasks.length / 2)) {
      blockerUsed = true;
      blocked = 1 + Math.floor(random() * 3);
      notes.push({ key, kind: "fix", body: arc.blocker.fix }, { key, kind: "learning", body: arc.blocker.learning });
    }

    let summary: string;
    if (blocked > 0 && arc.blocker) {
      const { en, hi, person } = arc.blocker;
      blocked--;
      blockers.push({ text: `${en} (waiting on ${person})`, project: arc.project, key });
      inProgress.push({ text: task.en, project: arc.project, key });
      tomorrow.push({ text: `Follow up with ${person} to unblock: ${lower(task.en)}`, project: arc.project, key });
      said.push(
        `${topic(task.hi)} wala kaam ruka hua hai, ${hi}`,
        `${person} ko ping kiya, kal phir follow up karunga`,
      );
      summary = `Blocked on ${arc.project}: ${lower(en)}.`;
    } else if (--taskDaysLeft <= 0) {
      const text = pastTense(task.en);
      done.push({ text, project: arc.project, key });
      said.push(`aaj ${task.hi}`);
      summary = text;
      taskIndex++;
      taskDaysLeft = 1 + Math.floor(random() * 3);
      progress = 0;
      if (taskIndex >= arc.tasks.length) {
        done.push({ text: arc.outcome.en, project: arc.project, key });
        said.push(`${arc.outcome.hi}, finally ship ho gaya`);
        summary = `Shipped ${arc.project}: ${lower(arc.outcome.en)}`;
        arcIndex++;
        taskIndex = 0;
        blockerUsed = false;
      }
      const next = taskAt(arcIndex, taskIndex);
      tomorrow.push({ text: next.phrase.en, project: next.arc.project, key: next.key });
      said.push(`kal ${topic(next.phrase.hi)} karna hai`);
    } else {
      progress = Math.min(90, progress + 20 + Math.floor(random() * 3) * 10);
      inProgress.push({ text: `${task.en} (${progress}% done)`, project: arc.project, key });
      tomorrow.push({ text: task.en, project: arc.project, key });
      said.push(`${topic(task.hi)} wala kaam chal raha hai, ${progress} percent ho gaya`);
      summary = `Progressed on ${arc.project}: ${lower(task.en)} (${progress}%)`;
    }

    // Everyday engineering work around the main project (routine: not tracked as tasks).
    const sideCount = random() < 0.55 ? 1 : random() < 0.25 ? 2 : 0;
    for (let i = 0; i < sideCount; i++) {
      const side = pick(SIDE);
      if (done.some((d) => d.text === side.en)) continue;
      done.push({ text: side.en, project: null });
      said.push(random() < 0.5 ? `aur ${side.hi}` : `saath mein ${side.hi}`);
    }
    if (!blockers.length && done.length > 1) summary += `, plus ${done.length - 1} more`;
    if (!summary.endsWith(".")) summary += ".";

    days.push({
      date,
      raw: `${said.join(". ")}.`.replace(/^./, (c) => c.toUpperCase()),
      data: { summary: summary.slice(0, 240), done, inProgress, blockers, tomorrow },
    });
  }
  return { days, tasks: [...tasks.values()], notes };
}
