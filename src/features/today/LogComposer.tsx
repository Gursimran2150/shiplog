"use client";

import { CircleCheck, Sparkles } from "lucide-react";
import { useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MAX_LOG_CHARS } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { appendStarter, countWords } from "./log-text";
import { SpeakingPrompts } from "./SpeakingPrompts";

const MIN_CHARS = 3;
const PLACEHOLDER =
  "aaj login bug fix kiya, PR raise kiya for the auth refactor. Staging pe deploy blocked hai — waiting on DevOps. Kal dashboard charts…";

interface LogComposerProps {
  ready: boolean;
  submitting: boolean;
  error: string | null;
  onSubmit: (text: string) => Promise<boolean>;
  /** Stats of the last successful save, shown until the user starts a new log. */
  saved?: { words: number; items: number } | null;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** The dictation box: Wispr Flow types into it, ⌘/Ctrl+Enter sends it to be structured. */
export function LogComposer({ ready, submitting, error, onSubmit, saved = null }: LogComposerProps) {
  const ids = { text: useId(), hint: useId(), count: useId(), error: useId() };
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chars = text.length;
  const canSubmit = ready && !submitting && text.trim().length >= MIN_CHARS;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    if (await onSubmit(text.trim())) setText("");
  }

  /** Adds a starter phrase on a new line and puts the caret after it, ready for dictation. */
  function handlePrompt(starter: string) {
    const next = appendStarter(text, starter);
    setText(next);
    const box = textareaRef.current;
    if (!box) return;
    box.focus();
    requestAnimationFrame(() => box.setSelectionRange(next.length, next.length));
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
        ref={textareaRef}
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
      <SpeakingPrompts disabled={submitting} onPick={handlePrompt} />
      {saved && !text && !submitting && !error && (
        <p className="mt-3 flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
          <CircleCheck aria-hidden="true" className="size-3.5 text-success" />
          Saved · {plural(saved.words, "word")} → {plural(saved.items, "item")}
        </p>
      )}
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
