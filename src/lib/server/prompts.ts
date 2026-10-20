import { buildSystemPrompt, wrapUserInput } from "@/lib/ai/prompts";
import type { StreamPrompt } from "@/lib/ai/stream-route";
import { daysBetween, formatDay } from "@/lib/domain/dates";
import {
  NOTE_KIND_LABELS,
  SECTION_LABELS,
  SECTIONS,
  TASK_STATUS_LABELS,
  type Entry,
  type FollowUpAnswer,
  type ReportKind,
  type StandupFormat,
  type TaskEvent,
  type TaskNote,
  type TaskSummary,
} from "@/lib/domain/types";

const PERSONA = "You are ShipLog, a work-journal assistant for software engineers.";

/** Compact, token-light rendering of entries for prompts (oldest first, one block per entry). */
export function formatEntries(entries: readonly Entry[]): string {
  return [...entries]
    .reverse()
    .map((e) => {
      const lines = SECTIONS.flatMap((s) =>
        e.data[s].map((i) => `  ${SECTION_LABELS[s]}: ${i.text}${i.project ? ` [${i.project}]` : ""}`),
      );
      return `${e.date}\n${lines.join("\n")}`;
    })
    .join("\n");
}

const TASK_RULE =
  "Each item has a `task`: if it continues one of the engineer's open tasks listed under 'Open tasks', use that task's id (e.g. 't3'), even when the wording differs (\"waiting on the usage API\" and \"integrated the usage API\" are the same task). For a new piece of trackable work use 'new: <short task name>' (3–8 words, the work itself, not today's progress, e.g. 'new: Dashboard usage charts'); give every item about that same new work the same name. Blockers are always trackable. Use null only for routine work such as code reviews, meetings, interviews or on-call.";

/** Keeps "who are we waiting on" machine-readable for the Waiting-on board (see parseWaitingOn). */
const BLOCKER_RULE =
  "When the engineer says who or what a blocker is waiting on, end that blocker's text with '(waiting on <name or team>)', e.g. 'Usage API not ready (waiting on Rahul)'.";

/** Reference block: today's GitHub activity and the open tasks items can be linked to. */
function referenceContext(activity: string, openTasks: string): string | undefined {
  const parts = [activity && `GitHub activity:\n${activity}`, openTasks && `Open tasks:\n${openTasks}`].filter(Boolean);
  return parts.length ? parts.join("\n\n") : undefined;
}

export function structurePrompt(today: string, activity: string, openTasks = ""): string {
  return buildSystemPrompt({
    role: [
      `${PERSONA} Turn the engineer's spoken end-of-day log (${today}) into a structured entry.`,
      "Split it into done, inProgress, blockers and tomorrow. Each item is one short, concrete phrase in clear English.",
      "Keep technical names, ticket ids and numbers exactly as said. Do not add work that wasn't said.",
      "If reference GitHub activity is given, list in `missed` only the commits/PRs that are NOT covered by anything the engineer said, using their exact URLs.",
      "In `followUps`, ask at most 3 short, specific questions that would make blockers actionable or vague items concrete. Ask nothing if the log is already clear.",
      TASK_RULE,
      BLOCKER_RULE,
    ].join(" "),
    context: referenceContext(activity, openTasks),
  });
}

const REPORT_ROLES: Record<ReportKind, string> = {
  standup:
    "Write today's async standup from the latest entry (and yesterday's, if present): three short sections, Yesterday/Today/Blockers, max 3 bullets each. If there are no blockers, say 'None'.",
  weekly:
    "Write a weekly report for the engineer's manager: Highlights (most important outcomes first), Shipped, In progress, Blockers & risks, Next week. Group related items, keep each bullet to one line.",
  brag: "Write a brag document for a performance review covering this period. Group by project or theme. For each, state what was delivered and its impact (numbers, users, reliability, speed) using only facts in the entries. End with a 'Skills demonstrated' list.",
};

const FORMAT_RULES: Record<StandupFormat, string> = {
  slack: "Format for Slack: *bold* section titles (single asterisks), '•' bullets, no markdown headings.",
  teams: "Format for Microsoft Teams: **bold** section titles and '-' bullets.",
  plain: "Plain text only: section titles followed by a colon, '-' bullets, no markdown symbols.",
};

export function reportPrompt(
  kind: ReportKind,
  format: StandupFormat,
  entries: readonly Entry[],
  from: string,
  to: string,
): StreamPrompt {
  return {
    system: buildSystemPrompt({
      role: `${PERSONA} ${REPORT_ROLES[kind]} ${kind === "standup" ? FORMAT_RULES[format] : "Use markdown headings (##) and '-' bullets."} Write in first person, confident and concise.`,
    }),
    prompt: `Period: ${formatDay(from)} to ${formatDay(to)}\n\nEntries:\n${formatEntries(entries)}`,
  };
}

export function ticketPrompt(text: string, context?: string): StreamPrompt {
  return {
    system: buildSystemPrompt({
      role: `${PERSONA} Turn a blocker or to-do into a well-written GitHub issue: an action-oriented title, a body with Context, Details and an 'Acceptance criteria' checklist (- [ ] items), and up to 3 short labels (e.g. bug, frontend, blocked).`,
    }),
    prompt: `${wrapUserInput(text)}${context ? `\n\nRelated log context:\n${wrapUserInput(context)}` : ""}`,
  };
}

export function askPrompt(question: string, entries: readonly Entry[], today: string): StreamPrompt {
  return {
    system: buildSystemPrompt({
      role: `${PERSONA} Answer the engineer's question about their own past work using only the journal entries provided. Cite dates like (12 Oct). If the entries don't contain the answer, say so. Today is ${today}. Be brief.`,
      context: entries.length ? formatEntries(entries) : "No journal entries found.",
    }),
    prompt: wrapUserInput(question),
  };
}

/** Folds the engineer's answers to follow-up questions back into the structured entry. */
export function refinePrompt(entry: unknown, answers: readonly FollowUpAnswer[], openTasks = ""): StreamPrompt {
  return {
    system: buildSystemPrompt({
      role: `${PERSONA} You are updating an existing structured log with the engineer's answers to follow-up questions. Keep every existing item unless an answer clearly corrects it, and keep each existing item's \`task\`. Add the new details (who or what a blocker is waiting on, since when, what unblocks it, outcomes, numbers) to the matching items, or add new items if an answer reveals new work. Keep items short. Update the one-sentence summary if needed. ${TASK_RULE} ${BLOCKER_RULE}`,
      context: [`Current log:\n${JSON.stringify(entry)}`, openTasks && `Open tasks:\n${openTasks}`]
        .filter(Boolean)
        .join("\n\n"),
    }),
    prompt: answers.map((a) => wrapUserInput(`Q: ${a.question}\nA: ${a.answer}`)).join("\n\n"),
  };
}

/** A task's journey as compact reference text: summary line, dated log items, then notes. */
export function formatJourney(task: TaskSummary, events: readonly TaskEvent[], notes: readonly TaskNote[]): string {
  const head = `Task: ${task.title}${task.project ? ` [${task.project}]` : ""} (status: ${TASK_STATUS_LABELS[task.status].toLowerCase()})`;
  const log = events.map((e) => `${e.date} ${SECTION_LABELS[e.section]}: ${e.text}`);
  const written = notes.map((n) => `${NOTE_KIND_LABELS[n.kind]}: ${n.body}`);
  return [head, "Log:", ...(log.length ? log : ["(none)"]), ...(written.length ? ["Notes:", ...written] : [])].join(
    "\n",
  );
}

const NUDGE_TONES = {
  friendly: "Tone: friendly and light; assume good intent and that they're busy.",
  firm: "Tone: polite but firm; say plainly what is blocked and what it is now delaying, and ask for a date.",
} as const;

/** A short follow-up message to whoever a blocker is waiting on. */
export function nudgePrompt(
  journey: string,
  blocker: string,
  person: string | null,
  since: string,
  today: string,
  tone: keyof typeof NUDGE_TONES,
): StreamPrompt {
  const days = Math.max(0, daysBetween(since, today));
  return {
    system: buildSystemPrompt({
      role: [
        `${PERSONA} Write a short Slack/Teams direct message from the engineer to ${person ?? "the person who owns this blocker"}, following up on a blocker.`,
        "2 to 4 sentences, first person, plain text (no markdown, no subject line, no sign-off).",
        "Open with a one-line greeting using their name if known. Say what you're blocked on and since when, make one specific ask (an ETA, a decision, or what they need from you), and offer help or an alternative if the log suggests one.",
        NUDGE_TONES[tone],
        "Write dates the way people do in chat ('since Thursday', 'since 15 Oct', 'for 5 days'), never as YYYY-MM-DD.",
        "Use only facts from the reference data. Never invent dates, numbers, tickets or promises.",
      ].join(" "),
      context: `${journey}\nCurrent blocker: ${blocker}\nBlocked since: ${formatDay(since, { weekday: "short", day: "numeric", month: "short" })} (${days === 0 ? "today" : `${days} day${days === 1 ? "" : "s"}`})\nToday: ${formatDay(today, { weekday: "short", day: "numeric", month: "short" })}`,
    }),
    prompt: "Write the message.",
  };
}

/** A pull-request description from the engineer's spoken summary of the change. */
export function prPrompt(changes: string, journey: string | null, ticket: string): StreamPrompt {
  return {
    system: buildSystemPrompt({
      role: [
        `${PERSONA} Turn the engineer's spoken summary of a code change into a pull-request description in Markdown.`,
        "Start with one line '# <PR title>': imperative mood, under 72 characters, no trailing period.",
        "Then these sections: '## Summary' (2 to 3 sentences: what changed and why), '## Changes' (bullets, one per change),",
        "'## How to test' (numbered steps a reviewer can follow), '## Risks & rollout' (bullets; write 'Low risk.' if nothing was mentioned).",
        "Add '## Screenshots' with the single line '_Add before/after screenshots._' only if the change touches UI.",
        ticket ? `End with a line 'Closes ${ticket}'.` : "",
        "Keep file names, function names, flags and numbers exactly as said. Do not invent changes, tests, metrics or files that weren't mentioned.",
        journey
          ? "The task's journey is given as background: use it for the why and context, not as a list of changes in this PR."
          : "",
      ]
        .filter(Boolean)
        .join(" "),
      context: journey ?? undefined,
    }),
    prompt: wrapUserInput(changes),
  };
}

/** A blameless postmortem / RCA written only from a task's journey and notes. */
export function postmortemPrompt(journey: string, today: string): StreamPrompt {
  return {
    system: buildSystemPrompt({
      role: [
        `${PERSONA} Write a short blameless postmortem (root-cause analysis) for this task, in Markdown, using only the reference data.`,
        "Start with '# Postmortem: <task title>' (the title only, without the project). Then '**Duration:** <first date> → <last date>' and '**Status:** <status>'.",
        "Sections: '## Summary' (2 to 3 sentences), '## Timeline' (one bullet per dated step, '**<d Mon>**: what happened'), '## Root cause',",
        "'## Resolution', '## What went well', '## What could be better', '## Action items' (bullets starting with a verb, taken from the learnings and blockers).",
        "If the data doesn't say something (impact, root cause), write 'Not recorded in the journal.' instead of guessing. Never blame a person; describe systems and process.",
        `Today is ${today}.`,
      ].join(" "),
      context: journey,
    }),
    prompt: "Write the postmortem.",
  };
}
