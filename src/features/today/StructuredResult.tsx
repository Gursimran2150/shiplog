"use client";

import { useEffect, useRef } from "react";
import { SECTIONS, type Entry } from "@/lib/domain/types";
import { SectionCard } from "./SectionCard";
import { TicketDialog } from "./TicketDialog";
import { useTicket } from "./useTicket";

/** The freshly structured entry as four cards. Focus moves to its heading when a new entry arrives. */
export function StructuredResult({ entry }: { entry: Entry }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { state, draft, close } = useTicket(entry.data.summary);

  useEffect(() => {
    headingRef.current?.focus();
  }, [entry.id]);

  return (
    <section aria-labelledby="today-result-heading" className="flex flex-col gap-3">
      <div>
        <h2
          id="today-result-heading"
          ref={headingRef}
          tabIndex={-1}
          className="rounded-md text-lg font-semibold tracking-[-0.03em] outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Your day, structured
        </h2>
        {entry.data.summary && <p className="mt-1 text-sm text-muted-foreground">{entry.data.summary}</p>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {SECTIONS.map((section) => (
          <SectionCard key={section} section={section} items={entry.data[section]} onCreateTicket={draft} />
        ))}
      </div>
      <TicketDialog state={state} onClose={close} onRetry={draft} />
    </section>
  );
}
