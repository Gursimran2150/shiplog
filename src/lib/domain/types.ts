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
  /** The task (journey) this item belongs to; absent for routine work like reviews and meetings. */
  taskId?: string;
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

export const INTEGRATIONS = ["github", "bitbucket"] as const;
export type Integration = (typeof INTEGRATIONS)[number];

export interface IntegrationStatus {
  /** False when this deployment has no credentials for the provider. */
  enabled: boolean;
  connected: boolean;
  login: string | null;
  manageUrl: string | null;
}

export interface FollowUpAnswer {
  question: string;
  answer: string;
}

/** A piece of work followed across days (a "journey"): items in daily logs point at it by `taskId`. */
export const TASK_STATUSES = ["planned", "in_progress", "blocked", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  planned: "Planned",
  in_progress: "In progress",
  blocked: "Blocked",
  done: "Done",
};

export interface TaskSummary {
  id: string;
  title: string;
  project: string | null;
  /** Derived from the logs: done once any log marks it done; blocked if its latest log has a blocker. */
  status: TaskStatus;
  firstDate: string | null;
  lastDate: string | null;
  /** How many log items point at this task. */
  events: number;
  notes: number;
}

/** One log item on a task's journey. `index` locates it inside the entry's section. */
export interface TaskEvent {
  entryId: string;
  date: string;
  section: Section;
  index: number;
  text: string;
}

export const NOTE_KINDS = ["fix", "learning", "note"] as const;
export type NoteKind = (typeof NOTE_KINDS)[number];

export const NOTE_KIND_LABELS: Record<NoteKind, string> = {
  fix: "How it was fixed",
  learning: "Learning",
  note: "Note",
};

export interface TaskNote {
  id: string;
  kind: NoteKind;
  body: string;
  createdAt: string;
}

export interface TaskJourney {
  task: TaskSummary;
  events: TaskEvent[];
  notes: TaskNote[];
}

export const MAX_NOTE_CHARS = 2000;
