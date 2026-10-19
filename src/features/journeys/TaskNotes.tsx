"use client";

import { Lightbulb, NotebookPen, Trash2, Wrench, type LucideIcon } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { MicButton } from "@/components/MicButton";
import { SegmentedControl } from "@/components/SegmentedControl";
import { Button } from "@/components/ui/button";
import { TOUCH_TARGET } from "@/features/today/touch";
import { useDictationField } from "@/hooks/useDictationField";
import { useTaskActions } from "@/hooks/useTasks";
import { ApiError } from "@/lib/api-client";
import { formatDay } from "@/lib/domain/dates";
import { MAX_NOTE_CHARS, NOTE_KIND_LABELS, NOTE_KINDS, type NoteKind, type TaskNote } from "@/lib/domain/types";

const KIND_ICONS: Record<NoteKind, LucideIcon> = { fix: Wrench, learning: Lightbulb, note: NotebookPen };
const KIND_OPTIONS = NOTE_KINDS.map((value) => ({ value, label: NOTE_KIND_LABELS[value] }));
const PLACEHOLDERS: Record<NoteKind, string> = {
  fix: "What was wrong and what fixed it?",
  learning: "What would you do differently next time?",
  note: "Anything worth remembering about this task.",
};

/** Notes on a task: how it was fixed, what was learned. Dictation-friendly, like every text box in ShipLog. */
export function TaskNotes({ taskId, notes }: { taskId: string; notes: TaskNote[] }) {
  const ids = { heading: useId(), body: useId() };
  const { addNote, deleteNote } = useTaskActions();
  const { ref: bodyRef, value: draft, setValue, append, read } = useDictationField<HTMLTextAreaElement>();
  const [kind, setKind] = useState<NoteKind>("fix");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const body = read().trim();
    if (!body) return;
    setSaving(true);
    try {
      await addNote(taskId, kind, body);
      setValue("");
      toast.success("Note saved.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't save the note.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    try {
      await deleteNote(taskId, id);
    } catch {
      toast.error("Couldn't delete the note.");
    }
  }

  return (
    <section aria-labelledby={ids.heading} className="flex flex-col gap-4">
      <h3 id={ids.heading} className="text-sm font-semibold">
        Notes & learnings
      </h3>
      {notes.length > 0 && (
        <ul className="flex flex-col gap-2">
          {notes.map((note) => {
            const Icon = KIND_ICONS[note.kind];
            return (
              <li key={note.id} className="rounded-lg border border-border bg-muted/40 p-3">
                <div className="flex items-center gap-2">
                  <Icon aria-hidden="true" className="size-4 text-muted-foreground" />
                  <span className="eyebrow">{NOTE_KIND_LABELS[note.kind]}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {formatDay(note.createdAt.slice(0, 10), { day: "numeric", month: "short" })}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => void remove(note.id)}
                    className={`ml-auto text-muted-foreground hover:text-destructive ${TOUCH_TARGET}`}
                    aria-label={`Delete note: ${note.body.slice(0, 40)}`}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap">{note.body}</p>
              </li>
            );
          })}
        </ul>
      )}
      <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-lg border border-dashed border-border p-3">
        <SegmentedControl legend="Note type" hideLegend options={KIND_OPTIONS} value={kind} onChange={setKind} />
        <label htmlFor={ids.body} className="sr-only">
          {NOTE_KIND_LABELS[kind]}
        </label>
        <textarea
          id={ids.body}
          ref={bodyRef}
          rows={3}
          maxLength={MAX_NOTE_CHARS}
          placeholder={`${PLACEHOLDERS[kind]} Speak or type.`}
          disabled={saving}
          className="block w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-base leading-relaxed outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60 sm:text-sm dark:bg-input/30"
        />
        <div className="flex flex-wrap items-start justify-between gap-2">
          <MicButton onText={append} disabled={saving} />
          <Button type="submit" size="sm" disabled={saving || !draft.trim()} className={TOUCH_TARGET}>
            {saving ? "Saving…" : "Save note"}
          </Button>
        </div>
      </form>
    </section>
  );
}
