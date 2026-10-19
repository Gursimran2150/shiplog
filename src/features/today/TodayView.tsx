"use client";

import { useMemo } from "react";
import { useEntries } from "@/hooks/useData";
import { useTimeZone, useToday } from "@/hooks/useToday";
import { SECTIONS, SECTION_LABELS, type Entry } from "@/lib/domain/types";
import { EarlierToday } from "./EarlierToday";
import { itemCount } from "./entry-edit";
import { FirstRunGuide } from "./FirstRunGuide";
import { FollowUpPanel } from "./FollowUpPanel";
import { GithubActivityPanel } from "./GithubActivityPanel";
import { LogComposer } from "./LogComposer";
import { MissedPanel } from "./MissedPanel";
import { SectionsSkeleton } from "./SectionsSkeleton";
import { StructuredResult } from "./StructuredResult";
import { TodayHeader } from "./TodayHeader";
import { useDayLog } from "./useDayLog";

/** Screen-reader summary of a structured entry, e.g. "Saved: 3 done, 1 in progress, …". */
function announce(entry: Entry): string {
  return `Saved. ${SECTIONS.map((s) => `${entry.data[s].length} ${SECTION_LABELS[s].toLowerCase()}`).join(", ")}.`;
}

/** Today: dictate the day, get it structured, reconcile with GitHub. */
export function TodayView() {
  const today = useToday();
  const timeZone = useTimeZone();
  const { entries, isLoading } = useEntries(today, today);
  const { result, submitting, error, submit, addMissed, editResult, replaceEntry, refine, dismissFollowUps, forget } =
    useDayLog(today, timeZone, entries[0] ?? null);
  const wordsToday = useMemo(() => entries.reduce((sum, e) => sum + e.words, 0), [entries]);
  const saved = useMemo(() => result && { words: result.entry.words, items: itemCount(result.entry.data) }, [result]);

  return (
    <>
      <TodayHeader today={today} wordsToday={wordsToday} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <FirstRunGuide today={today} />
          <LogComposer
            ready={Boolean(today && timeZone)}
            submitting={submitting}
            error={error}
            onSubmit={submit}
            saved={saved}
          />
          <p role="status" aria-live="polite" className="sr-only">
            {submitting ? "Structuring your day…" : result ? announce(result.entry) : ""}
          </p>
          {submitting ? (
            <SectionsSkeleton />
          ) : (
            result && (
              <StructuredResult entry={result.entry} fresh={result.fresh} onEdit={editResult} onLinked={replaceEntry}>
                <FollowUpPanel questions={result.followUps} onAnswer={refine} onSkip={dismissFollowUps} />
                <MissedPanel missed={result.missed} onAdd={addMissed} />
              </StructuredResult>
            )
          )}
          <EarlierToday entries={entries} isLoading={isLoading} onDeleted={forget} />
        </div>
        <aside className="min-w-0" aria-label="GitHub activity">
          <GithubActivityPanel today={today} timeZone={timeZone} />
        </aside>
      </div>
    </>
  );
}
