"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { SECTIONS, type Entry, type EntryData, type Section } from "@/lib/domain/types";
import { addItem, removeItem, updateItem } from "./entry-edit";
import { NextSteps } from "./NextSteps";
import { SectionCard } from "./SectionCard";
import { TicketDialog } from "./TicketDialog";
import { useTicket } from "./useTicket";

interface StructuredResultProps {
  entry: Entry;
  /** Just structured: move focus to the heading. (A log restored on arrival leaves focus alone.) */
  fresh: boolean;
  onEdit: (change: (data: EntryData) => EntryData) => void;
  /** An item was moved to another task (saved on the server): show the returned entry. */
  onLinked: (entry: Entry) => void;
  /** Panels that refine the entry (follow-up questions, missed GitHub work), shown above Next steps. */
  children?: ReactNode;
}

/** The freshly structured entry as four editable cards. Focus moves to its heading when a new entry arrives. */
export function StructuredResult({ entry, fresh, onEdit, onLinked, children }: StructuredResultProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const { state, draft, close } = useTicket(entry.data.summary);

  useEffect(() => {
    if (fresh) headingRef.current?.focus();
  }, [entry.id, fresh]);

  const onUpdate = useCallback(
    (section: Section, index: number, text: string) => onEdit((data) => updateItem(data, section, index, text)),
    [onEdit],
  );
  const onRemove = useCallback(
    (section: Section, index: number) => onEdit((data) => removeItem(data, section, index)),
    [onEdit],
  );
  const onAdd = useCallback(
    (section: Section, text: string) => onEdit((data) => addItem(data, section, text)),
    [onEdit],
  );

  /** "Turn blockers into tickets": bring the first blocker's Create ticket button into view and focus it. */
  const focusFirstBlocker = useCallback(() => {
    const button = cardsRef.current?.querySelector<HTMLButtonElement>('[data-section="blockers"] [data-ticket]');
    if (!button) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    button.scrollIntoView({ block: "center", behavior: smooth ? "smooth" : "auto" });
    button.focus({ preventScroll: true });
  }, []);

  return (
    <section aria-labelledby="today-result-heading" className="flex flex-col gap-4">
      <div>
        <h2
          id="today-result-heading"
          ref={headingRef}
          tabIndex={-1}
          className="rounded-md text-lg font-semibold tracking-[-0.03em] outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Your day, structured
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {entry.data.summary && <>{entry.data.summary} </>}
          Anything off? Edit, remove or add items — changes save automatically.
        </p>
      </div>
      <div ref={cardsRef} className="grid gap-3 sm:grid-cols-2">
        {SECTIONS.map((section) => (
          <SectionCard
            key={section}
            section={section}
            items={entry.data[section]}
            entryId={entry.id}
            onLinked={onLinked}
            onCreateTicket={draft}
            onUpdate={onUpdate}
            onRemove={onRemove}
            onAdd={onAdd}
          />
        ))}
      </div>
      {children}
      <NextSteps hasBlockers={entry.data.blockers.length > 0} onTicketBlockers={focusFirstBlocker} />
      <TicketDialog state={state} onClose={close} onRetry={draft} />
    </section>
  );
}
