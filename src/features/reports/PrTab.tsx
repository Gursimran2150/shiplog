"use client";

import { Download, GitPullRequestArrow, Loader2, Square } from "lucide-react";
import { useId, useMemo, type FormEvent } from "react";
import { MicButton } from "@/components/MicButton";
import { StreamPanel } from "@/components/StreamPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { appendStarter } from "@/features/today/log-text";
import { SpeakingPrompts } from "@/features/today/SpeakingPrompts";
import { useDictationField } from "@/hooks/useDictationField";
import { useStreamingText } from "@/hooks/useStreamingText";
import { useTasks } from "@/hooks/useTasks";
import { MAX_LOG_CHARS, TASK_STATUS_LABELS } from "@/lib/domain/types";
import { downloadMarkdown } from "./download";

const MIN_CHARS = 10;
/** Tasks offered in the picker: open ones first, then the most recent. */
const TASK_OPTIONS = 40;

const PR_PROMPTS = [
  { label: "What changed", starter: "Changed: " },
  { label: "Why", starter: "Why: " },
  { label: "How to test", starter: "To test: " },
  { label: "Risks", starter: "Risks: " },
] as const;

const PLACEHOLDER =
  "usage charts ko mock data se hata ke real usage API se joda. SWR se cache kiya, 5 min. IST totals ka bug bhi fix kiya. Test: dashboard kholo, date range badlo…";

/** "# Title" line of the generated description, for the download's file name. */
function filename(markdown: string): string {
  const title = /^#\s+(.+)$/m.exec(markdown)?.[1] ?? "pr-description";
  return `${
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50) || "pr-description"
  }.md`;
}

/**
 * PR description by voice: say what you changed (Hinglish fine), optionally pick the task it
 * belongs to so its journey supplies the "why", and get a reviewer-ready description.
 */
export function PrTab() {
  const ids = { changes: useId(), hint: useId(), task: useId(), ticket: useId() };
  const { ref, value, setValue, append, read } = useDictationField<HTMLTextAreaElement>();
  const { tasks } = useTasks();
  const { text, status, error, run, stop, isStreaming } = useStreamingText("/api/pr");

  const options = useMemo(
    () =>
      [...tasks.filter((t) => t.status !== "done"), ...tasks.filter((t) => t.status === "done")].slice(0, TASK_OPTIONS),
    [tasks],
  );
  const canSubmit = value.trim().length >= MIN_CHARS && !isStreaming;

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const changes = read().trim();
    if (changes.length < MIN_CHARS || isStreaming) return;
    const form = new FormData(e.currentTarget);
    void run({
      changes,
      taskId: String(form.get("taskId") ?? "") || null,
      ticket: String(form.get("ticket") ?? "").trim(),
    });
  }

  function addStarter(starter: string) {
    const next = appendStarter(read(), starter);
    setValue(next);
    const box = ref.current;
    if (!box) return;
    box.focus();
    requestAnimationFrame(() => box.setSelectionRange(next.length, next.length));
  }

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={onSubmit} className="surface flex flex-col gap-4 p-4 sm:p-5" aria-busy={isStreaming}>
        <div>
          <Label htmlFor={ids.changes} className="text-base font-semibold tracking-[-0.02em]">
            What did you change?
          </Label>
          <p id={ids.hint} className="mt-1.5 text-sm text-muted-foreground">
            Talk through the change like you would to a reviewer: what, why, how to test. Hinglish is fine.
          </p>
        </div>
        <textarea
          id={ids.changes}
          ref={ref}
          rows={6}
          maxLength={MAX_LOG_CHARS}
          placeholder={PLACEHOLDER}
          aria-describedby={ids.hint}
          disabled={isStreaming}
          className="block min-h-36 w-full resize-y rounded-md border border-input bg-transparent px-3 py-2.5 text-base leading-relaxed outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60 dark:bg-input/30"
        />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <SpeakingPrompts prompts={PR_PROMPTS} disabled={isStreaming} onPick={addStarter} />
          <MicButton onText={append} disabled={isStreaming} />
        </div>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={ids.task}>Task (optional)</Label>
            <select
              id={ids.task}
              name="taskId"
              defaultValue=""
              disabled={isStreaming}
              className="h-9 w-full min-w-0 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring max-sm:h-11"
            >
              <option value="">No task</option>
              {options.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                  {t.project ? ` · ${t.project}` : ""} ({TASK_STATUS_LABELS[t.status].toLowerCase()})
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">Its journey (blockers, fixes) gives the PR its “why”.</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={ids.ticket}>Ticket (optional)</Label>
            <Input
              id={ids.ticket}
              name="ticket"
              maxLength={40}
              placeholder="DASH-42"
              autoComplete="off"
              disabled={isStreaming}
              className="max-sm:h-11"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {isStreaming && (
            <Button type="button" variant="outline" onClick={stop}>
              <Square aria-hidden="true" /> Stop
            </Button>
          )}
          <Button type="submit" size="lg" disabled={!canSubmit} className="h-11 px-4 sm:h-9">
            {isStreaming ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <GitPullRequestArrow aria-hidden="true" />
            )}
            Write PR description
          </Button>
        </div>
      </form>
      <StreamPanel
        text={text}
        status={status}
        error={error}
        emptyHint="Your PR description appears here: title, summary, changes, how to test and risks. Nothing is made up."
        actions={
          <Button variant="outline" size="sm" onClick={() => downloadMarkdown(text, filename(text))}>
            <Download aria-hidden="true" /> Download .md
          </Button>
        }
      />
    </div>
  );
}
