"use client";

import { ChevronRight, FolderGit2, Search } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { SegmentedControl } from "@/components/SegmentedControl";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDay } from "@/lib/domain/dates";
import type { TaskSummary } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { groupTasks, STATUS_FILTERS, type StatusFilter } from "./journey-steps";
import { TaskStatusIcon } from "./status";

/** Projects shown expanded before the user opens more: keeps a long history scannable. */
const OPEN_BY_DEFAULT = 3;

interface TaskTreeProps {
  tasks: TaskSummary[];
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/** The left pane: search, status filter, and projects → tasks as an expandable tree. */
export function TaskTree({ tasks, isLoading, selectedId, onSelect }: TaskTreeProps) {
  const searchId = useId();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [toggled, setToggled] = useState<ReadonlySet<string>>(new Set());
  const groups = useMemo(() => groupTasks(tasks, query, filter), [tasks, query, filter]);
  const selectedProject = tasks.find((t) => t.id === selectedId)?.project ?? null;

  const isOpen = (project: string, i: number) => {
    // Searching opens everything; otherwise the first few and the selected task's project start open.
    const initial = Boolean(query.trim()) || i < OPEN_BY_DEFAULT || project === selectedProject;
    return toggled.has(project) ? !initial : initial;
  };
  const toggle = (project: string) =>
    setToggled((cur) => {
      const next = new Set(cur);
      if (!next.delete(project)) next.add(project);
      return next;
    });

  return (
    <nav aria-label="Tasks by project" className="flex flex-col gap-3">
      <div className="relative">
        <label htmlFor={searchId} className="sr-only">
          Search tasks or projects
        </label>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id={searchId}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tasks or projects"
          className="pl-8 max-sm:h-11"
        />
      </div>
      <SegmentedControl legend="Status" hideLegend options={STATUS_FILTERS} value={filter} onChange={setFilter} />

      {isLoading ? (
        <div className="flex flex-col gap-2" aria-hidden="true">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {tasks.length ? "No tasks match." : "No tasks yet. Log your day and ShipLog starts tracking them."}
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {groups.map((group, i) => {
            const open = isOpen(group.project, i);
            const listId = `project-${i}`;
            return (
              <li key={group.project}>
                <button
                  type="button"
                  onClick={() => toggle(group.project)}
                  aria-expanded={open}
                  aria-controls={listId}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring max-sm:min-h-11"
                >
                  <ChevronRight
                    aria-hidden="true"
                    className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-90")}
                  />
                  <FolderGit2 aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate font-mono text-[13px]">{group.project}</span>
                  <span className="shrink-0 font-mono text-xs font-normal text-muted-foreground">
                    {group.open ? `${group.open} open · ` : ""}
                    {group.tasks.length}
                  </span>
                </button>
                {open && (
                  <ul id={listId} className="mt-0.5 mb-1 ml-[1.15rem] flex flex-col border-l border-border pl-2">
                    {group.tasks.map((task) => {
                      const selected = task.id === selectedId;
                      return (
                        <li key={task.id}>
                          <button
                            type="button"
                            onClick={() => onSelect(task.id)}
                            aria-current={selected ? "true" : undefined}
                            className={cn(
                              "flex w-full cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring max-sm:min-h-11",
                              selected && "bg-muted font-medium",
                            )}
                          >
                            <span className="mt-0.5">
                              <TaskStatusIcon status={task.status} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="line-clamp-2">{task.title}</span>
                              {task.lastDate && (
                                <span className="block font-mono text-[11px] font-normal text-muted-foreground">
                                  {formatDay(task.lastDate, { day: "numeric", month: "short", year: "2-digit" })}
                                  {task.notes ? ` · ${task.notes} note${task.notes === 1 ? "" : "s"}` : ""}
                                </span>
                              )}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </nav>
  );
}
