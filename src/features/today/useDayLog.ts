"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useJournalActions } from "@/hooks/useData";
import type { Entry, EntryData, FollowUpAnswer, MissedActivity } from "@/lib/domain/types";
import { errorMessage } from "./errors";
import { appendToDone, repoFromUrl } from "./log-text";

interface DayLogResult {
  entry: Entry;
  missed: MissedActivity[];
  /** Questions ShipLog asks to make blockers actionable and vague items concrete. */
  followUps: string[];
  /** Just structured in this session (vs. today's earlier log shown on arrival). */
  fresh: boolean;
}

/**
 * Submitting a spoken log, the structured result, and folding missed GitHub work back into it.
 * `restore` is today's latest saved log: shown (and editable) until a new one is structured, so
 * coming back to Today shows your day instead of an empty page.
 */
export function useDayLog(today: string | null, timeZone: string | null, restore: Entry | null = null) {
  const { createEntry, updateEntry, refineEntry } = useJournalActions();
  const [own, setOwn] = useState<DayLogResult | null>(null);
  const restored = useMemo(
    () => (restore ? { entry: restore, missed: [], followUps: [], fresh: false } : null),
    [restore],
  );
  const result = own ?? restored;
  /** Latest result for `editResult`, so its identity doesn't change on every edit. */
  const latest = useRef(result);
  useEffect(() => {
    latest.current = result;
  }, [result]);
  /** State updates start from what's on screen, including a restored log. */
  const setResult = useCallback(
    (next: DayLogResult | null | ((current: DayLogResult | null) => DayLogResult | null)) =>
      setOwn((cur) => (typeof next === "function" ? next(cur ?? latest.current) : next)),
    [],
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Bumped per edit so an older save finishing late can't overwrite a newer optimistic state. */
  const editVersion = useRef(0);

  const submit = useCallback(
    async (text: string): Promise<boolean> => {
      if (!today || !timeZone) return false;
      setSubmitting(true);
      setError(null);
      try {
        const { entry, missed, followUps } = await createEntry(text, today, timeZone);
        setResult({ entry, missed, followUps, fresh: true });
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
    [createEntry, setResult, today, timeZone],
  );

  const addMissed = useCallback(
    async (item: MissedActivity) => {
      if (!result) return;
      try {
        const entry = await updateEntry(
          result.entry.id,
          appendToDone(result.entry.data, item.text, repoFromUrl(item.url)),
        );
        setResult(
          (current) => current && { ...current, entry, missed: current.missed.filter((m) => m.url !== item.url) },
        );
        toast.success("Added to Done.");
      } catch (err) {
        toast.error(errorMessage(err));
      }
    },
    [result, setResult, updateEntry],
  );

  /**
   * Applies an inline edit to the result: shown immediately, saved in the background, rolled back with a
   * toast if the save fails. Takes an updater so callers stay stable across edits (see `latest`).
   */
  const editResult = useCallback(
    async (change: (data: EntryData) => EntryData) => {
      const current = latest.current?.entry;
      if (!current) return;
      const data = change(current.data);
      if (data === current.data) return;
      const version = ++editVersion.current;
      const sameEntry = (entry: Entry) => (r: DayLogResult | null) =>
        r && r.entry.id === current.id ? { ...r, entry } : r;
      setResult(sameEntry({ ...current, data }));
      try {
        const saved = await updateEntry(current.id, data);
        if (version === editVersion.current) setResult(sameEntry(saved));
      } catch (err) {
        if (version === editVersion.current) setResult(sameEntry(current));
        toast.error(errorMessage(err, "Couldn't save that change. Please try again."));
      }
    },
    [setResult, updateEntry],
  );

  /** Drops the result card if its entry was deleted from the list below. */
  const forget = useCallback(
    (id: string) => setResult((current) => (current?.entry.id === id ? null : current)),
    [setResult],
  );

  /** Sends answers to the follow-up questions; the AI folds them into the saved entry. */
  const refine = useCallback(
    async (answers: FollowUpAnswer[]): Promise<boolean> => {
      const current = latest.current;
      if (!current || !answers.length) return false;
      try {
        const entry = await refineEntry(current.entry.id, answers);
        setResult((r) => (r && r.entry.id === entry.id ? { ...r, entry, followUps: [] } : r));
        toast.success("Log updated with your answers.");
        return true;
      } catch (err) {
        toast.error(errorMessage(err));
        return false;
      }
    },
    [refineEntry, setResult],
  );

  /** Shows an entry saved elsewhere (e.g. an item moved to another task) if it's the current result. */
  const replaceEntry = useCallback(
    (entry: Entry) => setResult((r) => (r && r.entry.id === entry.id ? { ...r, entry } : r)),
    [setResult],
  );

  const dismissFollowUps = useCallback(() => setResult((r) => r && { ...r, followUps: [] }), [setResult]);

  return { result, submitting, error, submit, addMissed, editResult, replaceEntry, refine, dismissFollowUps, forget };
}
