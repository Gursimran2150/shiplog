import { z } from "zod";
import { MAX_LOG_CHARS, MAX_QUESTION_CHARS, REPORT_KINDS, STANDUP_FORMATS } from "@/lib/domain/types";

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

const logItem = z.object({
  text: z
    .string()
    .min(1)
    .max(300)
    .describe("One concrete piece of work, written as a short past or present-tense phrase"),
  project: z.string().max(60).nullable().describe("Project, repo or area if mentioned, e.g. 'checkout', 'web-app'"),
});

export const entryDataSchema = z.object({
  summary: z.string().max(240).describe("One-sentence summary of the day"),
  done: z.array(logItem).max(20),
  inProgress: z.array(logItem).max(20),
  blockers: z.array(logItem).max(10),
  tomorrow: z.array(logItem).max(20),
});

/** What the model returns when structuring a spoken log. */
export const structuredLogSchema = entryDataSchema.extend({
  missed: z
    .array(z.object({ text: z.string().max(200), url: z.string().url() }))
    .max(10)
    .describe("GitHub commits/PRs from the reference data that the engineer did not mention"),
  followUps: z
    .array(z.string().max(160))
    .max(3)
    .describe(
      "Up to 3 short questions that would make the log more useful: for blockers ask who/what you're waiting on, since when, and what would unblock it; for vague items ask for the outcome or a number. Empty when the log is already clear.",
    ),
});

/** One-tap demo: "mock" comes with two weeks of sample logs, "empty" starts from a blank journal. */
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
