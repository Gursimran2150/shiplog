import { daysBetween } from "@/lib/domain/dates";
import type { TaskEvent, TaskStatus, TaskSummary } from "@/lib/domain/types";

export type StepKind = "planned" | "started" | "progress" | "milestone" | "blocked" | "unblocked" | "done";

export const STEP_LABELS: Record<StepKind, string> = {
  planned: "Planned",
  started: "Started",
  progress: "In progress",
  milestone: "Milestone",
  blocked: "Blocked",
  unblocked: "Unblocked",
  done: "Done",
};

/** One day on a task's journey, labelled by what changed that day. */
interface JourneyStep {
  date: string;
  kind: StepKind;
  events: TaskEvent[];
}

/**
 * Groups a task's log items by day and names each day's transition: the first day it was
 * worked on is "Started" (or "Planned" if it was only on tomorrow's list), a day with a blocker
 * is "Blocked", the first clear day after that is "Unblocked". Finishing something while work goes
 * on is a "Milestone"; only the last day of work, if it finished the task, is "Done".
 */
export function buildSteps(events: readonly TaskEvent[]): JourneyStep[] {
  const byDate = new Map<string, TaskEvent[]>();
  for (const e of events) byDate.set(e.date, [...(byDate.get(e.date) ?? []), e]);

  const steps: JourneyStep[] = [];
  let started = false;
  let blocked = false;
  for (const [date, dayEvents] of [...byDate].sort(([a], [b]) => a.localeCompare(b))) {
    const has = (section: TaskEvent["section"]) => dayEvents.some((e) => e.section === section);
    const worked = has("done") || has("inProgress") || has("blockers");
    let kind: StepKind;
    if (has("blockers")) kind = "blocked";
    else if (has("done")) kind = has("inProgress") ? "milestone" : "done";
    else if (blocked && worked) kind = "unblocked";
    else if (!worked) kind = "planned";
    else kind = started ? "progress" : "started";
    if (worked) started = true;
    if (kind === "blocked") blocked = true;
    else if (worked) blocked = false;
    steps.push({ date, kind, events: dayEvents });
  }
  // Only the final day of work can be "Done"; earlier finished pieces were milestones.
  const lastWork = steps.findLastIndex((s) => s.kind !== "planned");
  steps.forEach((s, i) => {
    if (s.kind === "done" && i !== lastWork) s.kind = "milestone";
  });
  return steps;
}

/** Headline numbers for a journey: calendar days from first to last log, and days spent blocked. */
export function journeyStats(steps: readonly JourneyStep[]): { days: number; blockedDays: number } {
  if (!steps.length) return { days: 0, blockedDays: 0 };
  return {
    days: daysBetween(steps[0].date, steps.at(-1)?.date ?? steps[0].date) + 1,
    blockedDays: steps.filter((s) => s.kind === "blocked").length,
  };
}

export type StatusFilter = "all" | "open" | "blocked" | "done";

export const STATUS_FILTERS: readonly { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "blocked", label: "Blocked" },
  { value: "done", label: "Done" },
];

const matchesStatus = (status: TaskStatus, filter: StatusFilter) =>
  filter === "all" ||
  (filter === "open" ? status !== "done" : filter === "blocked" ? status === "blocked" : status === "done");

interface ProjectGroup {
  project: string;
  tasks: TaskSummary[];
  open: number;
}

const NO_PROJECT = "Other work";

/**
 * The tree: projects (most recently active first) → their tasks (already newest first),
 * filtered by status and a case-insensitive search over title and project.
 */
export function groupTasks(tasks: readonly TaskSummary[], query: string, filter: StatusFilter): ProjectGroup[] {
  const q = query.trim().toLowerCase();
  const groups = new Map<string, ProjectGroup>();
  for (const task of tasks) {
    if (!matchesStatus(task.status, filter)) continue;
    const project = task.project ?? NO_PROJECT;
    if (q && !`${task.title} ${project}`.toLowerCase().includes(q)) continue;
    const group = groups.get(project) ?? { project, tasks: [], open: 0 };
    group.tasks.push(task);
    if (task.status !== "done") group.open++;
    groups.set(project, group);
  }
  return [...groups.values()];
}
