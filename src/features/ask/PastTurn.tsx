import { memo } from "react";
import { SimpleMarkdown } from "@/components/SimpleMarkdown";

export interface Turn {
  id: number;
  question: string;
  /** undefined while streaming, null if it failed or was stopped before any text. */
  answer?: string | null;
}

function Question({ text }: { text: string }) {
  return (
    <p className="ml-auto w-fit max-w-[85%] rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground">
      <span className="sr-only">You asked: </span>
      {text}
    </p>
  );
}

/** A finished question and answer. Memoised so earlier turns don't re-render while a new one streams. */
export const PastTurn = memo(function PastTurn({ turn }: { turn: Turn }) {
  return (
    <li className="flex flex-col gap-3">
      <Question text={turn.question} />
      <div className="surface p-5">
        {turn.answer ? (
          <SimpleMarkdown text={turn.answer} />
        ) : (
          <p className="text-sm text-muted-foreground">No answer for this question.</p>
        )}
      </div>
    </li>
  );
});

export { Question };
