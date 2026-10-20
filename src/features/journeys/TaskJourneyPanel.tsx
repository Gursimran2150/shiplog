"use client";

import {
  CalendarClock,
  CircleCheck,
  CircleDashed,
  FileWarning,
  Flag,
  OctagonAlert,
  Pencil,
  Play,
  Send,
  Unlock,
  type LucideIcon,
} from "lucide-react";
import { useId, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectBadge } from "@/features/today/ProjectBadge";
import { TOUCH_TARGET } from "@/features/today/touch";
import { NudgeDialog } from "@/features/waiting/NudgeDialog";
import { useTaskActions } from "@/hooks/useTasks";
import { useToday } from "@/hooks/useToday";
import { formatDay } from "@/lib/domain/dates";
import { SECTION_LABELS, type TaskJourney } from "@/lib/domain/types";
import { parseWaitingOn } from "@/lib/domain/waiting";
import { cn } from "@/lib/utils";
import { buildSteps, journeyStats, STEP_LABELS, type StepKind } from "./journey-steps";
import { MoveToTask } from "./MoveToTask";
import { PostmortemDialog } from "./PostmortemDialog";
import { TaskNotes } from "./TaskNotes";
import { TaskStatusIcon } from "./status";

const STEP_META: Record<StepKind, { icon: LucideIcon; accent: string; ring: string }> = {
  planned: { icon: CalendarClock, accent: "text-warning", ring: "border-warning/50" },
  started: { icon: Play, accent: "text-link", ring: "border-link/50" },
  progress: { icon: CircleDashed, accent: "text-link", ring: "border-border" },
  milestone: { icon: Flag, accent: "text-success", ring: "border-border" },
  blocked: { icon: OctagonAlert, accent: "text-destructive", ring: "border-destructive/50" },
  unblocked: { icon: Unlock, accent: "text-success", ring: "border-success/50" },
  done: { icon: CircleCheck, accent: "text-success", ring: "border-success/60" },
};

/** Write-ups from a journey: a follow-up for an open blocker, and a postmortem from the whole story. */
function JourneyActions({ journey }: { journey: TaskJourney }) {
  const today = useToday();
  const [open, setOpen] = useState<"nudge" | "postmortem" | null>(null);
  const { task, events } = journey;
  const blocker = task.status === "blocked" ? events.findLast((e) => e.section === "blockers") : undefined;
  if (!events.length || !today) return null;

  return (
    <div className="mt-1 flex flex-wrap gap-2">
      {blocker && (
        <Button variant="outline" size="sm" className={TOUCH_TARGET} onClick={() => setOpen("nudge")}>
          <Send aria-hidden="true" />
          Draft nudge
        </Button>
      )}
      <Button variant="outline" size="sm" className={TOUCH_TARGET} onClick={() => setOpen("postmortem")}>
        <FileWarning aria-hidden="true" />
        Write postmortem
      </Button>
      {open === "nudge" && blocker && (
        <NudgeDialog
          taskId={task.id}
          person={parseWaitingOn(blocker.text)}
          blocker={blocker.text}
          today={today}
          onClose={() => setOpen(null)}
        />
      )}
      {open === "postmortem" && (
        <PostmortemDialog taskId={task.id} title={task.title} today={today} onClose={() => setOpen(null)} />
      )}
    </div>
  );
}

const day = (iso: string) => formatDay(iso, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** The right pane: a task's header, its day-by-day journey as a vertical timeline, and its notes. */
export function TaskJourneyPanel({ journey, isLoading }: { journey: TaskJourney | null; isLoading: boolean }) {
  const steps = useMemo(() => (journey ? buildSteps(journey.events) : []), [journey]);
  const stats = useMemo(() => journeyStats(steps), [steps]);

  if (isLoading || !journey) {
    return (
      <div className="flex flex-col gap-4" aria-hidden="true">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const { task, notes } = journey;
  return (
    <article aria-labelledby="journey-title" className="flex flex-col gap-6">
      <JourneyHeader journey={journey} days={stats.days} blockedDays={stats.blockedDays} />

      <section aria-labelledby="journey-steps" className="flex flex-col gap-3">
        <h3 id="journey-steps" className="text-sm font-semibold">
          How it went
        </h3>
        {steps.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No logs on this task yet. Move a log item here to start its journey.
          </p>
        ) : (
          <ol className="relative flex flex-col">
            {steps.map((step, i) => {
              const { icon: Icon, accent, ring } = STEP_META[step.kind];
              const last = i === steps.length - 1;
              return (
                <li key={step.date} className="relative flex gap-3 pb-5 last:pb-0">
                  {!last && <span aria-hidden="true" className="absolute top-8 bottom-0 left-[15px] w-px bg-border" />}
                  <span
                    className={cn("z-[1] grid size-8 shrink-0 place-items-center rounded-full border-2 bg-card", ring)}
                  >
                    <Icon aria-hidden="true" className={cn("size-4", accent)} />
                  </span>
                  <div className="min-w-0 flex-1 pt-1">
                    <p className="flex flex-wrap items-baseline gap-x-2">
                      <span className={cn("text-sm font-semibold", accent)}>{STEP_LABELS[step.kind]}</span>
                      <time dateTime={step.date} className="font-mono text-xs text-muted-foreground">
                        {day(step.date)}
                      </time>
                    </p>
                    <ul className="mt-1.5 flex flex-col gap-1">
                      {step.events.map((e) => (
                        <li
                          key={`${e.entryId}-${e.section}-${e.index}`}
                          className="group flex flex-wrap items-center gap-x-2 text-sm"
                        >
                          <span className="eyebrow shrink-0 text-[10px]">{SECTION_LABELS[e.section]}</span>
                          <span className="min-w-0 flex-1">{e.text}</span>
                          <MoveToTask
                            entryId={e.entryId}
                            section={e.section}
                            index={e.index}
                            item={{ text: e.text, project: task.project, taskId: task.id }}
                            className="sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <TaskNotes taskId={task.id} notes={notes} />
    </article>
  );
}

function JourneyHeader({ journey, days, blockedDays }: { journey: TaskJourney; days: number; blockedDays: number }) {
  const { task } = journey;
  const titleId = useId();
  const { renameTask } = useTaskActions();
  const [editing, setEditing] = useState(false);

  async function onRename(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const title = String(new FormData(e.currentTarget).get("title") ?? "").trim();
    setEditing(false);
    if (title.length < 2 || title === task.title) return;
    try {
      await renameTask(task.id, title, task.project);
    } catch {
      toast.error("Couldn't rename the task.");
    }
  }

  return (
    <header className="flex flex-col gap-2">
      {editing ? (
        <form onSubmit={onRename} className="flex gap-2">
          <label htmlFor={titleId} className="sr-only">
            Task name
          </label>
          <Input
            id={titleId}
            name="title"
            defaultValue={task.title}
            maxLength={160}
            autoFocus
            className="h-10 text-base"
          />
          <Button type="submit" size="sm" className="h-10">
            Save
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-10" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </form>
      ) : (
        <div className="flex items-start gap-2">
          <h2 id="journey-title" className="text-xl font-semibold tracking-[-0.03em]">
            {task.title}
          </h2>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setEditing(true)}
            className={cn("mt-1 text-muted-foreground", TOUCH_TARGET)}
            aria-label="Rename task"
          >
            <Pencil aria-hidden="true" />
          </Button>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
        <TaskStatusIcon status={task.status} showLabel />
        <ProjectBadge project={task.project} />
        {task.firstDate && (
          <span className="font-mono text-xs">
            {formatDay(task.firstDate, { day: "numeric", month: "short", year: "numeric" })}
            {task.lastDate && task.lastDate !== task.firstDate
              ? ` → ${formatDay(task.lastDate, { day: "numeric", month: "short", year: "numeric" })}`
              : ""}
          </span>
        )}
        {days > 0 && (
          <span className="font-mono text-xs">
            {plural(days, "day")}
            {blockedDays ? ` · blocked ${plural(blockedDays, "day")}` : ""} ·{" "}
            {plural(journey.events.length, "log item")}
          </span>
        )}
      </div>
      <JourneyActions journey={journey} />
    </header>
  );
}
