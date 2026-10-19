"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useJournalActions } from "@/hooks/useData";
import type { Entry } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { EntrySections } from "./EntrySections";
import { errorMessage } from "./errors";
import { TOUCH_TARGET } from "./touch";

const timeOf = (iso: string) => new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

interface EarlierTodayProps {
  entries: Entry[];
  isLoading: boolean;
  onDeleted: (id: string) => void;
}

/** Today's saved logs, each collapsible, with a confirmed delete. */
export function EarlierToday({ entries, isLoading, onDeleted }: EarlierTodayProps) {
  const { deleteEntry } = useJournalActions();
  const [pending, setPending] = useState<Entry | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function confirmDelete() {
    if (!pending) return;
    setDeleting(true);
    try {
      await deleteEntry(pending.id);
      onDeleted(pending.id);
      toast.success("Entry deleted.");
      setPending(null);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section aria-labelledby="earlier-heading">
      <h2 id="earlier-heading" className="eyebrow mb-3">
        Earlier today
      </h2>
      {isLoading ? (
        <Skeleton className="h-14 w-full rounded-xl" />
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No logs yet today. Your first one will show up here.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {entries.map((entry) => (
            <li key={entry.id} className="surface flex items-start gap-2 p-1">
              <details className="group min-w-0 flex-1">
                <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 rounded-md px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">{timeOf(entry.createdAt)}</span>
                  <span className="truncate">{entry.data.summary || "Untitled log"}</span>
                  <span className="ml-auto shrink-0 font-mono text-xs text-muted-foreground">{entry.words} words</span>
                </summary>
                <div className="px-3 pt-1 pb-3">
                  <EntrySections data={entry.data} />
                </div>
              </details>
              <Button
                variant="ghost"
                size="icon"
                className={cn("mt-1.5 text-muted-foreground hover:text-destructive", TOUCH_TARGET)}
                onClick={() => setPending(entry)}
                aria-label={`Delete log from ${timeOf(entry.createdAt)}`}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <Dialog open={pending !== null} onOpenChange={(open) => !open && !deleting && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this log?</DialogTitle>
            <DialogDescription>
              It will be removed from your timeline and reports. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={deleting}>
                Cancel
              </Button>
            </DialogClose>
            <Button variant="destructive" onClick={() => void confirmDelete()} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
