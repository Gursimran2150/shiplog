"use client";

import { ArrowRightLeft, Plus, Search, Unlink } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { TOUCH_TARGET } from "@/features/today/touch";
import { useTasks, useTaskActions } from "@/hooks/useTasks";
import { ApiError } from "@/lib/api-client";
import type { Entry, LogItem, Section } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { TaskStatusIcon } from "./status";

const LIST_LIMIT = 30;

interface MoveToTaskProps {
  entryId: string;
  section: Section;
  index: number;
  item: LogItem;
  onMoved?: (entry: Entry) => void;
  className?: string;
}

/**
 * The manual fix for AI task linking: move a log item to another task, start a new task for it,
 * or mark it as routine work that isn't tracked.
 */
export function MoveToTask({ entryId, section, index, item, onMoved, className }: MoveToTaskProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="ghost"
        size="xs"
        className={cn("text-muted-foreground", TOUCH_TARGET, className)}
        onClick={() => setOpen(true)}
        aria-label={`${item.taskId ? "Move to another task" : "Track as a task"}: ${item.text}`}
        title="Linked to the wrong task? Move it."
      >
        <ArrowRightLeft aria-hidden="true" />
        {item.taskId ? "Move" : "Track"}
      </Button>
      {open && (
        <MoveDialog
          entryId={entryId}
          section={section}
          index={index}
          item={item}
          onClose={() => setOpen(false)}
          onMoved={onMoved}
        />
      )}
    </>
  );
}

function MoveDialog({ entryId, section, index, item, onMoved, onClose }: MoveToTaskProps & { onClose: () => void }) {
  const searchId = useId();
  const { tasks, isLoading } = useTasks();
  const { createTask, linkItem } = useTaskActions();
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = tasks.filter(
      (t) => t.id !== item.taskId && (!q || `${t.title} ${t.project ?? ""}`.toLowerCase().includes(q)),
    );
    return list.slice(0, LIST_LIMIT);
  }, [tasks, query, item.taskId]);

  async function move(target: string | null | { title: string }) {
    setBusy(true);
    try {
      const taskId = target && typeof target === "object" ? (await createTask(target.title, item.project)).id : target;
      const entry = await linkItem(entryId, section, index, taskId);
      onMoved?.(entry);
      toast.success(taskId ? "Moved to task." : "Marked as routine work.");
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't move it. Please try again.");
      setBusy(false);
    }
  }

  const newTitle = (query.trim() || item.text).slice(0, 160);

  return (
    <Dialog open onOpenChange={(next) => !next && !busy && onClose()}>
      <DialogContent className="flex max-h-[85dvh] flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Move to a task</DialogTitle>
          <DialogDescription className="line-clamp-2">“{item.text}”</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <label htmlFor={searchId} className="sr-only">
            Search tasks
          </label>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id={searchId}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, or type a new task name"
            className="pl-8 max-sm:h-11"
            autoFocus
          />
        </div>
        <ul aria-label="Tasks" aria-busy={isLoading} className="-mx-1 min-h-0 flex-1 overflow-y-auto">
          {matches.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                disabled={busy}
                onClick={() => void move(t.id)}
                className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-wait max-sm:min-h-11"
              >
                <TaskStatusIcon status={t.status} />
                <span className="min-w-0 flex-1 truncate">{t.title}</span>
                {t.project && <span className="shrink-0 font-mono text-xs text-muted-foreground">{t.project}</span>}
              </button>
            </li>
          ))}
          {!isLoading && !matches.length && (
            <li className="px-2 py-3 text-sm text-muted-foreground">No matching tasks.</li>
          )}
        </ul>
        <div className="flex flex-col gap-2 border-t border-border pt-3 sm:flex-row">
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => void move({ title: newTitle })}
            className="h-auto min-h-9 flex-1 justify-start whitespace-normal text-left"
          >
            <Plus aria-hidden="true" />
            <span className="min-w-0">
              New task: <span className="font-normal">{newTitle}</span>
            </span>
          </Button>
          {item.taskId && (
            <Button variant="ghost" disabled={busy} onClick={() => void move(null)} className="min-h-9">
              <Unlink aria-hidden="true" />
              Not a task
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
