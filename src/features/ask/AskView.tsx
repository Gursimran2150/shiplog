"use client";

import { Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StreamPanel } from "@/components/StreamPanel";
import { Button } from "@/components/ui/button";
import { useStreamingText } from "@/hooks/useStreamingText";
import { useToday } from "@/hooks/useToday";
import { AskForm } from "./AskForm";
import { PastTurn, Question, type Turn } from "./PastTurn";
import { SUGGESTIONS } from "./suggestions";

export function AskView() {
  const today = useToday();
  const { text, status, error, run, stop, isStreaming } = useStreamingText("/api/ask");
  const [turns, setTurns] = useState<Turn[]>([]);
  const nextId = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const latestRef = useRef<HTMLLIElement>(null);

  // Abort a running answer when leaving the page.
  useEffect(() => stop, [stop]);

  // Bring the newest question into view; focus stays in the input for the next question.
  useEffect(() => {
    latestRef.current?.scrollIntoView({ block: "nearest" });
  }, [turns.length]);

  const ask = useCallback(
    async (question: string) => {
      if (!today) return;
      const id = nextId.current++;
      // A stopped answer resolves to null; keep whatever text had already streamed.
      const partial = text || null;
      setTurns((prev) => [
        ...prev.map((t, i) => (i === prev.length - 1 && t.answer === null ? { ...t, answer: partial } : t)),
        { id, question },
      ]);
      const answer = await run({ question, today });
      setTurns((prev) => prev.map((t) => (t.id === id ? { ...t, answer } : t)));
    },
    [run, text, today],
  );

  const askSuggestion = (question: string) => {
    void ask(question);
    inputRef.current?.focus();
  };

  const past = turns.slice(0, -1);
  const latest = turns.at(-1);

  return (
    <>
      <PageHeader
        eyebrow="Search"
        title="Ask your journal"
        description="Answers come only from what you've logged, with the dates they happened."
      />

      <div className="flex flex-col gap-6">
        {turns.length > 0 && (
          <ol aria-label="Conversation" className="flex flex-col gap-6">
            {past.map((turn) => (
              <PastTurn key={turn.id} turn={turn} />
            ))}
            {latest && (
              <li ref={latestRef} key={latest.id} className="flex scroll-mb-40 flex-col gap-3">
                <Question text={latest.question} />
                <StreamPanel text={text} status={status} error={error} />
              </li>
            )}
          </ol>
        )}

        {turns.length === 0 && (
          <section aria-labelledby="ask-suggestions" className="flex flex-col gap-3">
            <h2 id="ask-suggestions" className="eyebrow flex items-center gap-2">
              <Sparkles className="size-3.5" aria-hidden="true" /> Try asking
            </h2>
            <ul className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <li key={s}>
                  <Button variant="outline" size="sm" disabled={!today} onClick={() => askSuggestion(s)}>
                    {s}
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <AskForm ref={inputRef} onAsk={(q) => void ask(q)} onStop={stop} isStreaming={isStreaming} disabled={!today} />
      </div>
    </>
  );
}
