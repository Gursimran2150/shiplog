"use client";

import { useMemo } from "react";
import { useEntries } from "@/hooks/useData";
import { useTimeZone, useToday } from "@/hooks/useToday";
import { SECTIONS, SECTION_LABELS, type Entry } from "@/lib/domain/types";
import { EarlierToday } from "./EarlierToday";
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
  const { result, submitting, error, submit, addMissed, forget } = useDayLog(today, timeZone);
  const wordsToday = useMemo(() => entries.reduce((sum, e) => sum + e.words, 0), [entries]);

  return (
    <>
      <TodayHeader today={today} wordsToday={wordsToday} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <LogComposer ready={Boolean(today && timeZone)} submitting={submitting} error={error} onSubmit={submit} />
          <p role="status" aria-live="polite" className="sr-only">
            {submitting ? "Structuring your day…" : result ? announce(result.entry) : ""}
          </p>
          {submitting ? (
            <SectionsSkeleton />
          ) : (
            result && (
              <>
                <StructuredResult entry={result.entry} />
                <MissedPanel missed={result.missed} onAdd={addMissed} />
              </>
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
