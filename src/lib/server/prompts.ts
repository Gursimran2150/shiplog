import { buildSystemPrompt, wrapUserInput } from "@/lib/ai/prompts";
import type { StreamPrompt } from "@/lib/ai/stream-route";
import { formatDay } from "@/lib/domain/dates";
import {
  SECTION_LABELS,
  SECTIONS,
  type Entry,
  type FollowUpAnswer,
  type ReportKind,
  type StandupFormat,
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
      role: `${PERSONA} You are updating an existing structured log with the engineer's answers to follow-up questions. Keep every existing item unless an answer clearly corrects it, and keep each existing item's \`task\`. Add the new details (who or what a blocker is waiting on, since when, what unblocks it, outcomes, numbers) to the matching items, or add new items if an answer reveals new work. Keep items short. Update the one-sentence summary if needed. ${TASK_RULE}`,
      context: [`Current log:\n${JSON.stringify(entry)}`, openTasks && `Open tasks:\n${openTasks}`]
        .filter(Boolean)
        .join("\n\n"),
    }),
    prompt: answers.map((a) => wrapUserInput(`Q: ${a.question}\nA: ${a.answer}`)).join("\n\n"),
  };
}
