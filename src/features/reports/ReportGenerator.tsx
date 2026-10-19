"use client";

import { Download, FileText, Loader2, Square } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { StreamPanel } from "@/components/StreamPanel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEntries } from "@/hooks/useData";
import { useStreamingText } from "@/hooks/useStreamingText";
import { formatDay } from "@/lib/domain/dates";
import type { ReportKind, StandupFormat } from "@/lib/domain/types";
import { downloadMarkdown } from "./download";
import { reportFilename, type DateRange } from "./ranges";

interface ReportGeneratorProps {
  kind: ReportKind;
  range: DateRange;
  format: StandupFormat;
  buttonLabel: string;
}

const SHORT_DAY: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };

/**
 * Entry count, generate button and streamed output for one report and range.
 * Parents key it by range + format, so changing either starts from a clean panel.
 */
export function ReportGenerator({ kind, range, format, buttonLabel }: ReportGeneratorProps) {
  const { entries, isLoading } = useEntries(range.from, range.to);
  const { text, status, error, cached, run, stop, isStreaming } = useStreamingText("/api/reports");
  const count = entries.length;
  const isEmpty = !isLoading && count === 0;
  const period =
    range.from === range.to
      ? formatDay(range.from, SHORT_DAY)
      : `${formatDay(range.from, SHORT_DAY)} – ${formatDay(range.to, SHORT_DAY)}`;

  // Abort an in-flight generation when the user switches tab or range.
  useEffect(() => stop, [stop]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground" aria-live="polite">
          {isLoading ? (
            <>
              <Skeleton className="h-4 w-48" />
              <span className="sr-only">Counting entries…</span>
            </>
          ) : (
            <>
              <span className="font-medium text-foreground tabular-nums">{count}</span>{" "}
              {count === 1 ? "entry" : "entries"} · {period}
            </>
          )}
        </div>
        <div className="flex gap-2">
          {isStreaming && (
            <Button variant="outline" onClick={stop}>
              <Square aria-hidden="true" /> Stop
            </Button>
          )}
          <Button
            onClick={() => void run({ kind, from: range.from, to: range.to, format })}
            disabled={isLoading || isEmpty || isStreaming}
          >
            {isStreaming ? <Loader2 className="animate-spin" aria-hidden="true" /> : <FileText aria-hidden="true" />}
            {buttonLabel}
          </Button>
        </div>
      </div>

      {isEmpty ? (
        <div className="surface flex flex-col items-start gap-3 p-5">
          <p className="font-medium">No entries for {period} yet</p>
          <p className="text-sm text-muted-foreground">
            Reports are written from your logs. Dictate a quick update for the day, then come back here.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/">Log your day</Link>
          </Button>
        </div>
      ) : (
        <StreamPanel
          text={text}
          status={status}
          error={error}
          emptyHint="Your report will appear here, written only from the entries in this period."
          actions={
            <>
              <Button variant="outline" size="sm" onClick={() => downloadMarkdown(text, reportFilename(kind, range))}>
                <Download aria-hidden="true" /> Download .md
              </Button>
              {cached && (
                <span className="ml-auto font-mono text-xs text-muted-foreground">SAVED REPORT · no new AI call</span>
              )}
            </>
          }
        />
      )}
    </div>
  );
}
