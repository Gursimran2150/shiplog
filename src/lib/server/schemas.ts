import { z } from "zod";
import {
  MAX_LOG_CHARS,
  MAX_NOTE_CHARS,
  MAX_QUESTION_CHARS,
  NOTE_KINDS,
  REPORT_KINDS,
  SECTIONS,
  STANDUP_FORMATS,
} from "@/lib/domain/types";

/** Server-side validation. Client components import types from `@/lib/domain/types` instead. */

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

const timeZone = z
  .string()
  .max(64)
  .refine((tz) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  }, "Unknown time zone");

/** GitHub usernames: 1–39 chars, alphanumeric or single hyphens, not starting or ending with one. */
const githubUsername = z.string().regex(/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i, "Not a valid GitHub username");

const itemText = z
  .string()
  .min(1)
  .max(300)
  .describe("One concrete piece of work, written as a short past or present-tense phrase");
const itemProject = z
  .string()
  .max(60)
  .nullable()
  .describe("Project, repo or area if mentioned, e.g. 'checkout', 'web-app'");

/** A stored log item. `taskId` links it to a task's journey. */
const logItem = z.object({ text: itemText, project: itemProject, taskId: z.uuid().optional() });

const sections = <T extends z.ZodType>(item: T) => ({
  summary: z.string().max(240).describe("One-sentence summary of the day"),
  done: z.array(item).max(20),
  inProgress: z.array(item).max(20),
  blockers: z.array(item).max(10),
  tomorrow: z.array(item).max(20),
});

export const entryDataSchema = z.object(sections(logItem));

/**
 * What the model writes for each item: instead of a uuid it picks a short alias from the
 * open-tasks list it was shown (or "new" / null), which the server maps back to real task ids.
 *
 * The model-facing schemas carry no length/count limits: Gemini rejects response schemas past a
 * complexity budget, and this one (4 sections × 3 fields + missed + followUps) crosses it once
 * limits are added. `clampEntry`/`clampStructured` apply the stored schema's limits afterwards.
 */
const aiLogItem = z.object({
  text: z.string().describe("One concrete piece of work, written as a short past or present-tense phrase"),
  project: z.string().nullable().describe("Project, repo or area if mentioned, e.g. 'checkout', 'web-app'"),
  task: z
    .string()
    .nullable()
    .describe(
      "Id of the open task this item continues (e.g. 't3'); 'new: <short task name>' when it starts a new piece of trackable work (e.g. 'new: Dashboard usage charts'); null for routine work such as code reviews, meetings or interviews",
    ),
});

export const aiEntrySchema = z.object({
  summary: z.string().describe("One-sentence summary of the day"),
  done: z.array(aiLogItem),
  inProgress: z.array(aiLogItem),
  blockers: z.array(aiLogItem),
  tomorrow: z.array(aiLogItem),
});

/** What the model returns when structuring a spoken log. */
export const structuredLogSchema = aiEntrySchema.extend({
  missed: z
    .array(z.object({ text: z.string(), url: z.string() }))
    .describe("GitHub commits/PRs from the reference data that the engineer did not mention"),
  followUps: z
    .array(z.string())
    .describe(
      "Up to 3 short questions that would make the log more useful: for blockers ask who/what you're waiting on, since when, and what would unblock it; for vague items ask for the outcome or a number. Empty when the log is already clear.",
    ),
});

const SECTION_MAX = { done: 20, inProgress: 20, blockers: 10, tomorrow: 20 } as const;

/** Applies the stored schema's limits to model output: trims text, caps list sizes, drops empty items. */
export function clampEntry<T extends z.infer<typeof aiEntrySchema>>(ai: T): T {
  const out = { ...ai, summary: ai.summary.trim().slice(0, 240) };
  for (const section of SECTIONS) {
    out[section] = ai[section]
      .map((i) => ({ ...i, text: i.text.trim().slice(0, 300), project: i.project?.trim().slice(0, 60) || null }))
      .filter((i) => i.text)
      .slice(0, SECTION_MAX[section]);
  }
  return out;
}

export function clampStructured(s: z.infer<typeof structuredLogSchema>): z.infer<typeof structuredLogSchema> {
  return {
    ...clampEntry(s),
    missed: s.missed.slice(0, 10).map((m) => ({ text: m.text.slice(0, 200), url: m.url })),
    followUps: s.followUps
      .map((q) => q.trim().slice(0, 160))
      .filter(Boolean)
      .slice(0, 3),
  };
}

/** One-tap demo: "mock" comes with ~18 months of sample logs, "empty" starts from a blank journal. */
export const demoRequest = z.object({ data: z.enum(["mock", "empty"]) });

export const refineEntryRequest = z.object({
  answers: z
    .array(z.object({ question: z.string().trim().min(1).max(160), answer: z.string().trim().min(1).max(1000) }))
    .min(1, "Answer at least one question.")
    .max(3),
});

export const createEntryRequest = z.object({
  text: z.string().trim().min(3, "Say a little more about your day.").max(MAX_LOG_CHARS),
  date: isoDate,
  timeZone,
});

export const updateEntryRequest = z.object({ data: entryDataSchema });

export const rangeQuery = z.object({ from: isoDate, to: isoDate });

export const activityQuery = z.object({ date: isoDate, timeZone });

export const reportRequest = z.object({
  kind: z.enum(REPORT_KINDS),
  from: isoDate,
  to: isoDate,
  format: z.enum(STANDUP_FORMATS).default("slack"),
});

export const ticketRequest = z.object({
  text: z.string().trim().min(3).max(500),
  context: z.string().max(1500).optional(),
  repo: z
    .string()
    .regex(/^[\w.-]+\/[\w.-]+$/, "Use owner/repo")
    .optional(),
});

export const ticketSchema = z.object({
  title: z.string().max(120),
  body: z.string().max(4000).describe("Markdown: context, steps or details, and an acceptance criteria checklist"),
  labels: z.array(z.string().max(30)).max(5),
});

export const askRequest = z.object({
  question: z.string().trim().min(3).max(MAX_QUESTION_CHARS),
  today: isoDate,
});

export const settingsSchema = z.object({
  githubUsername: githubUsername.nullable(),
  standupFormat: z.enum(STANDUP_FORMATS),
  onboarded: z.boolean().default(false),
});

/** Repos to leave out of activity tracking ("owner/repo" or "workspace/repo"). */
export const excludedReposBody = z.object({
  excluded: z
    .array(z.string().regex(/^[\w.-]+\/[\w.-]+$/))
    .max(500)
    .transform((list) => [...new Set(list)]),
});

export const taskBody = z.object({
  title: z.string().trim().min(2).max(160),
  project: z.string().trim().max(60).nullable(),
});

export const noteBody = z.object({
  kind: z.enum(NOTE_KINDS),
  body: z.string().trim().min(1).max(MAX_NOTE_CHARS),
});

/** Re-links one log item: to a task, or to none (null). */
export const linkItemBody = z.object({
  section: z.enum(SECTIONS),
  index: z.number().int().min(0).max(19),
  taskId: z.uuid().nullable(),
});
