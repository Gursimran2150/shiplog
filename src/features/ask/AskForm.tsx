"use client";

import { ArrowUp, Mic, Square } from "lucide-react";
import { useId, useState, type FormEvent, type Ref } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAX_QUESTION_CHARS } from "@/lib/domain/types";

interface AskFormProps {
  onAsk: (question: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled: boolean;
  ref?: Ref<HTMLInputElement>;
}

/** Question input with a character count; the input keeps focus between questions. */
export function AskForm({ onAsk, onStop, isStreaming, disabled, ref }: AskFormProps) {
  const ids = { input: useId(), hint: useId() };
  const [question, setQuestion] = useState("");
  const trimmed = question.trim();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!trimmed || isStreaming || disabled) return;
    onAsk(trimmed);
    setQuestion("");
  }

  return (
    <form onSubmit={onSubmit} className="surface flex flex-col gap-2 p-4">
      <Label htmlFor={ids.input}>Ask a question about your work</Label>
      <div className="flex gap-2">
        <Input
          ref={ref}
          id={ids.input}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={MAX_QUESTION_CHARS}
          placeholder="e.g. What did I ship last week?"
          aria-describedby={ids.hint}
          autoComplete="off"
          className="h-9"
        />
        {isStreaming ? (
          <Button type="button" variant="outline" size="lg" onClick={onStop}>
            <Square aria-hidden="true" /> Stop
          </Button>
        ) : (
          <Button type="submit" size="lg" disabled={!trimmed || disabled}>
            <ArrowUp aria-hidden="true" /> Ask
          </Button>
        )}
      </div>
      <p id={ids.hint} className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Mic className="size-3.5" aria-hidden="true" /> Dictate with Wispr Flow
        </span>
        <span className="font-mono tabular-nums">
          {question.length}/{MAX_QUESTION_CHARS}
        </span>
      </p>
    </form>
  );
}
