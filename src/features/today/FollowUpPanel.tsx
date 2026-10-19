"use client";

import { MessageCircleQuestion, Sparkles } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { MicButton } from "@/components/MicButton";
import { Button } from "@/components/ui/button";
import { useDictationField } from "@/hooks/useDictationField";
import type { FollowUpAnswer } from "@/lib/domain/types";
import { TOUCH_TARGET } from "./touch";

const MAX_ANSWER_CHARS = 1000;

interface FollowUpPanelProps {
  questions: string[];
  onAnswer: (answers: FollowUpAnswer[]) => Promise<boolean>;
  onSkip: () => void;
}

/** One question with a dictation-safe answer box. The form reads answers by `name` on submit. */
function FollowUpQuestion({ question, index, disabled }: { question: string; index: number; disabled: boolean }) {
  const id = useId();
  const { ref, append } = useDictationField<HTMLTextAreaElement>();
  return (
    <li className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium">
        {question}
      </label>
      <textarea
        id={id}
        ref={ref}
        name={`answer-${index}`}
        rows={2}
        maxLength={MAX_ANSWER_CHARS}
        disabled={disabled}
        placeholder="Speak or type your answer — or leave it blank."
        className="block w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-base leading-relaxed outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60 sm:text-sm dark:bg-input/30"
      />
      <MicButton onText={append} disabled={disabled} />
    </li>
  );
}

/**
 * ShipLog's follow-up questions after structuring: who a blocker is waiting on, what "almost done"
 * means, and so on. Answers are folded into the saved entry by the AI; every question is optional.
 */
export function FollowUpPanel({ questions, onAnswer, onSkip }: FollowUpPanelProps) {
  const headingId = useId();
  const [sending, setSending] = useState(false);
  const [empty, setEmpty] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const answers = questions
      .map((question, i) => ({ question, answer: String(form.get(`answer-${i}`) ?? "").trim() }))
      .filter((a) => a.answer);
    if (!answers.length) {
      setEmpty(true);
      return;
    }
    setEmpty(false);
    setSending(true);
    try {
      await onAnswer(answers);
    } finally {
      setSending(false);
    }
  }

  if (!questions.length) return null;

  return (
    <section aria-labelledby={headingId} className="surface p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted">
          <MessageCircleQuestion aria-hidden="true" className="size-4" />
        </span>
        <div>
          <h2 id={headingId} className="text-sm font-semibold">
            A few quick questions
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Answer any you like and ShipLog will sharpen your log — useful detail for tomorrow&apos;s standup.
          </p>
        </div>
      </div>
      <form onSubmit={handleSubmit} aria-busy={sending} className="mt-4 flex flex-col gap-4">
        <ol className="flex flex-col gap-5">
          {questions.map((question, i) => (
            <FollowUpQuestion key={question} question={question} index={i} disabled={sending} />
          ))}
        </ol>
        {empty && (
          <p role="alert" className="text-sm text-destructive">
            Answer at least one question, or choose Skip.
          </p>
        )}
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onSkip} disabled={sending} className={TOUCH_TARGET}>
            Skip
          </Button>
          <Button type="submit" size="sm" disabled={sending} className={TOUCH_TARGET}>
            <Sparkles aria-hidden="true" />
            {sending ? "Updating…" : "Update my log"}
          </Button>
        </div>
      </form>
    </section>
  );
}
