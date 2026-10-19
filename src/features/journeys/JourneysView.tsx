"use client";

import { useEffect, useRef } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useTaskJourney, useTasks } from "@/hooks/useTasks";
import { TaskJourneyPanel } from "./TaskJourneyPanel";
import { TaskTree } from "./TaskTree";
import { useSelectedTask } from "./useSelectedTask";

/** Journeys: every task as a tree by project, and the chosen task's path from start to done, with notes. */
export function JourneysView() {
  const { tasks, isLoading } = useTasks();
  const [linked, select] = useSelectedTask();
  // No task in the URL: show the most recently active one.
  const selectedId = linked ?? tasks[0]?.id ?? null;
  const { journey, isLoading: journeyLoading, missing } = useTaskJourney(selectedId);
  const detail = useRef<HTMLDivElement>(null);
  const picked = useRef(false);

  // On small screens the journey is below the tree: bring it into view after a pick.
  useEffect(() => {
    if (!picked.current || !journey || window.matchMedia("(min-width: 1024px)").matches) return;
    picked.current = false;
    detail.current?.scrollIntoView({ block: "start" });
  }, [journey]);

  return (
    <>
      <PageHeader
        eyebrow="Task history"
        title="Journeys"
        description="Every task you've logged, from the day it started to the day it shipped: blockers, how they got fixed and what you learned."
      />
      <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="surface h-fit max-h-[55dvh] overflow-y-auto p-3 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)]">
          <TaskTree
            tasks={tasks}
            isLoading={isLoading}
            selectedId={selectedId}
            onSelect={(id) => {
              picked.current = true;
              select(id);
            }}
          />
        </aside>
        <div
          ref={detail}
          className="surface min-w-0 scroll-mt-20 p-4 sm:p-6"
          aria-live="polite"
          aria-busy={journeyLoading}
        >
          {missing ? (
            <p className="text-sm text-muted-foreground">
              This task doesn&apos;t exist any more. Pick another from the list.
            </p>
          ) : !isLoading && !tasks.length ? (
            <div className="flex flex-col gap-2 py-8 text-center">
              <p className="font-medium">No journeys yet</p>
              <p className="text-sm text-muted-foreground">
                Log your day on Today. ShipLog links each piece of work to its task, so you can see here how it moved
                from started to shipped.
              </p>
            </div>
          ) : (
            <TaskJourneyPanel journey={journey} isLoading={journeyLoading || isLoading} />
          )}
        </div>
      </div>
    </>
  );
}
