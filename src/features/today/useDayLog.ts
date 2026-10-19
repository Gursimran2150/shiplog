"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useJournalActions } from "@/hooks/useData";
import type { Entry, MissedActivity } from "@/lib/domain/types";
import { errorMessage } from "./errors";
import { appendToDone, repoFromUrl } from "./log-text";

interface DayLogResult {
  entry: Entry;
  missed: MissedActivity[];
}

/** Submitting a spoken log, the structured result, and folding missed GitHub work back into it. */
export function useDayLog(today: string | null, timeZone: string | null) {
  const { createEntry, updateEntry } = useJournalActions();
  const [result, setResult] = useState<DayLogResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (text: string): Promise<boolean> => {
      if (!today || !timeZone) return false;
      setSubmitting(true);
      setError(null);
      try {
        const { entry, missed } = await createEntry(text, today, timeZone);
        setResult({ entry, missed });
        toast.success("Your day is structured and saved.");
        return true;
      } catch (err) {
        const message = errorMessage(err);
        setError(message);
        toast.error(message);
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [createEntry, today, timeZone],
  );

  const addMissed = useCallback(
    async (item: MissedActivity) => {
      if (!result) return;
      try {
        const entry = await updateEntry(
          result.entry.id,
          appendToDone(result.entry.data, item.text, repoFromUrl(item.url)),
        );
        setResult((current) => current && { entry, missed: current.missed.filter((m) => m.url !== item.url) });
        toast.success("Added to Done.");
      } catch (err) {
        toast.error(errorMessage(err));
      }
    },
    [result, updateEntry],
  );

  /** Drops the result card if its entry was deleted from the list below. */
  const forget = useCallback((id: string) => setResult((current) => (current?.entry.id === id ? null : current)), []);

  return { result, submitting, error, submit, addMissed, forget };
}
