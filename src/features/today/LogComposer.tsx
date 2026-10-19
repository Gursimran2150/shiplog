"use client";

import { Sparkles } from "lucide-react";
import { useId, useState, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MAX_LOG_CHARS } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { countWords } from "./log-text";

const MIN_CHARS = 3;
const PLACEHOLDER =
  "aaj login bug fix kiya, PR raise kiya for the auth refactor. Staging pe deploy blocked hai — waiting on DevOps. Kal dashboard charts…";

interface LogComposerProps {
  ready: boolean;
  submitting: boolean;
  error: string | null;
  onSubmit: (text: string) => Promise<boolean>;
}

/** The dictation box: Wispr Flow types into it, ⌘/Ctrl+Enter sends it to be structured. */
export function LogComposer({ ready, submitting, error, onSubmit }: LogComposerProps) {
  const ids = { text: useId(), hint: useId(), count: useId(), error: useId() };
  const [text, setText] = useState("");
  const chars = text.length;
  const canSubmit = ready && !submitting && text.trim().length >= MIN_CHARS;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    if (await onSubmit(text.trim())) setText("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="surface p-4 sm:p-5" aria-busy={submitting}>
      <Label htmlFor={ids.text} className="text-base font-semibold tracking-[-0.02em]">
        Tell ShipLog about your day
      </Label>
      <p id={ids.hint} className="mt-1.5 text-sm text-muted-foreground">
        Hold your Wispr Flow key and talk — Hinglish is fine. Press{" "}
        <kbd className="rounded border border-border bg-muted px-1 font-mono text-xs">⌘/Ctrl + Enter</kbd> to submit.
      </p>
      <textarea
        id={ids.text}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        maxLength={MAX_LOG_CHARS}
        rows={7}
        placeholder={PLACEHOLDER}
        aria-describedby={`${ids.hint} ${ids.count}${error ? ` ${ids.error}` : ""}`}
        aria-invalid={error ? true : undefined}
        disabled={submitting}
        className="mt-3 block min-h-40 w-full resize-y rounded-md border border-input bg-transparent px-3 py-2.5 text-base leading-relaxed outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60 aria-invalid:border-destructive dark:bg-input/30"
      />
      {error && (
        <p id={ids.error} role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p
          id={ids.count}
          className={cn("font-mono text-xs text-muted-foreground", chars >= MAX_LOG_CHARS && "text-destructive")}
        >
          {countWords(text)} words · {chars.toLocaleString("en-IN")}/{MAX_LOG_CHARS.toLocaleString("en-IN")} characters
        </p>
        <Button
          type="submit"
          size="lg"
          disabled={!canSubmit}
          aria-keyshortcuts="Meta+Enter Control+Enter"
          className="h-11 px-4 sm:h-9"
        >
          <Sparkles aria-hidden="true" />
          {submitting ? "Structuring…" : "Structure my day"}
        </Button>
      </div>
    </form>
  );
}
