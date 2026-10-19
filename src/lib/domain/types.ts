/**
 * Domain types shared by client and server. Plain TypeScript only (no zod), so importing
 * them from a client component adds nothing to the browser bundle.
 * Runtime validation lives in `src/lib/server/schemas.ts`.
 */

export const SECTIONS = ["done", "inProgress", "blockers", "tomorrow"] as const;
export type Section = (typeof SECTIONS)[number];

export const SECTION_LABELS: Record<Section, string> = {
  done: "Done",
  inProgress: "In progress",
  blockers: "Blockers",
  tomorrow: "Tomorrow",
};

export interface LogItem {
  text: string;
  project: string | null;
}

export interface EntryData extends Record<Section, LogItem[]> {
  summary: string;
}

export interface Entry {
  id: string;
  date: string;
  raw: string;
  data: EntryData;
  words: number;
  createdAt: string;
}

export interface Activity {
  kind: "commit" | "pr";
  repo: string;
  title: string;
  url: string;
  /** Local calendar date (YYYY-MM-DD) in the user's time zone. */
  date: string;
}

export interface MissedActivity {
  text: string;
  url: string;
}

export const REPORT_KINDS = ["standup", "weekly", "brag"] as const;
export type ReportKind = (typeof REPORT_KINDS)[number];

export const STANDUP_FORMATS = ["slack", "teams", "plain"] as const;
export type StandupFormat = (typeof STANDUP_FORMATS)[number];

export interface Settings {
  githubUsername: string | null;
  standupFormat: StandupFormat;
  /** Finished or skipped the first-run tour. */
  onboarded: boolean;
}

export interface DayCount {
  date: string;
  entries: number;
  items: number;
}

export interface Ticket {
  title: string;
  body: string;
  labels: string[];
}

export const MAX_LOG_CHARS = 4000;
export const MAX_QUESTION_CHARS = 500;

export interface RepoAccess {
  fullName: string;
  private: boolean;
  tracked: boolean;
}

export interface GithubConnection {
  /** False when the server has no GitHub App configured (public-username mode only). */
  appEnabled: boolean;
  connected: boolean;
  login: string | null;
  manageUrl: string | null;
}
