"use client";

import { Check, Copy } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCopy } from "@/hooks/useAnswerActions";
import { SimpleMarkdown } from "./SimpleMarkdown";

interface StreamPanelProps {
  text: string;
  status: "idle" | "streaming" | "done" | "error";
  error: string | null;
  emptyHint?: ReactNode;
  /** Accessible name of the live region (e2e tests rely on "AI response"). */
  label?: string;
  /** Extra actions shown next to Copy when the answer is complete. */
  actions?: ReactNode;
}

/** Streamed AI output: thinking skeleton, live text, error state, and a Copy action when done. */
export function StreamPanel({ text, status, error, emptyHint, label = "AI response", actions }: StreamPanelProps) {
  const { copied, copy } = useCopy(text);

  if (status === "error") {
    return (
      <div role="alert" className="rounded-xl border border-destructive/30 bg-card p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <section aria-label={label} aria-live="polite" aria-busy={status === "streaming"} className="surface">
      <div className="min-h-32 p-5">
        {text ? (
          <SimpleMarkdown text={text} />
        ) : status === "streaming" ? (
          <div className="flex flex-col gap-2.5" role="status" aria-label="Generating">
            <Skeleton className="h-3.5 w-11/12" />
            <Skeleton className="h-3.5 w-9/12" />
            <Skeleton className="h-3.5 w-10/12" />
            <Skeleton className="h-3.5 w-6/12" />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{emptyHint ?? "The result will appear here."}</p>
        )}
      </div>
      {status === "done" && text && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border px-5 py-3">
          <Button variant="outline" size="sm" onClick={copy}>
            {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
            {copied ? "Copied" : "Copy"}
          </Button>
          {actions}
          <span role="status" className="sr-only">
            {copied ? "Copied to clipboard" : ""}
          </span>
        </div>
      )}
    </section>
  );
}
