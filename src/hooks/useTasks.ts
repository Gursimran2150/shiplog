"use client";

import { useCallback } from "react";
import useSWR, { useSWRConfig } from "swr";
import { api, fetcher } from "@/lib/api-client";
import type { Entry, NoteKind, Section, TaskJourney, TaskNote, TaskSummary, WaitingItem } from "@/lib/domain/types";
import { isJournalKey } from "./useData";

const EMPTY_TASKS: TaskSummary[] = [];
const EMPTY_WAITING: WaitingItem[] = [];

/** Open blockers: who each one is waiting on and since when. */
export function useWaiting() {
  const { data, isLoading } = useSWR<{ items: WaitingItem[] }>("/api/waiting", fetcher);
  return { items: data?.items ?? EMPTY_WAITING, isLoading };
}

/** Every task (journey) with its derived status, most recently active first. */
export function useTasks() {
  const { data, isLoading } = useSWR<{ tasks: TaskSummary[] }>("/api/tasks", fetcher);
  return { tasks: data?.tasks ?? EMPTY_TASKS, isLoading };
}

/** One task's journey: its log items oldest first, plus notes. Pass null to skip. */
export function useTaskJourney(id: string | null) {
  const { data, isLoading, error } = useSWR<TaskJourney>(id ? `/api/tasks/${id}` : null, fetcher);
  return { journey: data ?? null, isLoading: Boolean(id) && isLoading, missing: Boolean(error) };
}

/** Task mutations. Anything that changes links refreshes logs, stats and tasks together. */
export function useTaskActions() {
  const { mutate } = useSWRConfig();
  const refresh = useCallback(() => mutate(isJournalKey), [mutate]);

  const createTask = useCallback(
    async (title: string, project: string | null) => {
      const { task } = await api.post<{ task: TaskSummary }>("/api/tasks", { title, project });
      await refresh();
      return task;
    },
    [refresh],
  );

  const renameTask = useCallback(
    async (id: string, title: string, project: string | null) => {
      await api.patch(`/api/tasks/${id}`, { title, project });
      await refresh();
    },
    [refresh],
  );

  /** Moves one log item to a task, or unlinks it with null. */
  const linkItem = useCallback(
    async (entryId: string, section: Section, index: number, taskId: string | null) => {
      const { entry } = await api.patch<{ entry: Entry }>(`/api/entries/${entryId}/items`, { section, index, taskId });
      await refresh();
      return entry;
    },
    [refresh],
  );

  const addNote = useCallback(
    async (taskId: string, kind: NoteKind, body: string) => {
      const { note } = await api.post<{ note: TaskNote }>(`/api/tasks/${taskId}/notes`, { kind, body });
      await mutate(`/api/tasks/${taskId}`);
      await mutate("/api/tasks");
      return note;
    },
    [mutate],
  );

  const deleteNote = useCallback(
    async (taskId: string, noteId: string) => {
      await api.delete(`/api/tasks/${taskId}/notes/${noteId}`);
      await mutate(`/api/tasks/${taskId}`);
      await mutate("/api/tasks");
    },
    [mutate],
  );

  return { createTask, renameTask, linkItem, addNote, deleteNote };
}
