"use client";

import { useCallback } from "react";
import useSWR, { useSWRConfig } from "swr";
import { api, fetcher } from "@/lib/api-client";
import type { SessionUser } from "@/lib/auth/token";
import type {
  Activity,
  DayCount,
  Entry,
  EntryData,
  GithubConnection,
  MissedActivity,
  RepoAccess,
  Settings,
} from "@/lib/domain/types";

const EMPTY_ENTRIES: Entry[] = [];
const EMPTY_DAYS: DayCount[] = [];
const EMPTY_ACTIVITY: Activity[] = [];
const DEFAULT_SETTINGS: Settings = { githubUsername: null, standupFormat: "slack", onboarded: true };

/** SWR keys are plain URLs; this matches every cached entries/stats range so one save refreshes them all. */
const isJournalKey = (key: unknown) =>
  typeof key === "string" && (key.startsWith("/api/entries") || key.startsWith("/api/stats"));

/** The logged-in user (from the session cookie). */
export function useSession() {
  const { data, isLoading } = useSWR<{ user: SessionUser }>("/api/auth/me", fetcher, { revalidateOnFocus: false });
  return { user: data?.user ?? null, isLoading };
}

export function useSettings() {
  const { data, isLoading, mutate } = useSWR<{ settings: Settings }>("/api/settings", fetcher);
  const save = useCallback(
    async (next: Settings) => {
      await mutate(api.put<{ settings: Settings }>("/api/settings", next), {
        optimisticData: { settings: next },
        rollbackOnError: true,
        revalidate: false,
      });
    },
    [mutate],
  );
  return { settings: data?.settings ?? DEFAULT_SETTINGS, isLoading, save };
}

/** Entries in [from, to], newest first. Pass nulls to skip fetching (e.g. before the date is known). */
export function useEntries(from: string | null, to: string | null) {
  const key = from && to ? `/api/entries?from=${from}&to=${to}` : null;
  const { data, isLoading } = useSWR<{ entries: Entry[] }>(key, fetcher);
  return { entries: data?.entries ?? EMPTY_ENTRIES, isLoading: isLoading || !key };
}

/** Per-day counts for the heatmap and streak. */
export function useDayCounts(from: string | null, to: string | null) {
  const key = from && to ? `/api/stats?from=${from}&to=${to}` : null;
  const { data, isLoading } = useSWR<{ days: DayCount[] }>(key, fetcher);
  return { days: data?.days ?? EMPTY_DAYS, isLoading: isLoading || !key };
}

/** Public GitHub commits/PRs for one local day. */
export function useActivity(date: string | null, timeZone: string | null) {
  const key = date && timeZone ? `/api/activity?date=${date}&timeZone=${encodeURIComponent(timeZone)}` : null;
  const { data, isLoading } = useSWR<{ githubUsername: string | null; activity: Activity[] }>(key, fetcher);
  return {
    githubUsername: data?.githubUsername ?? null,
    activity: data?.activity ?? EMPTY_ACTIVITY,
    isLoading: isLoading || !key,
  };
}

/** Mutations on the journal; each one refreshes every cached entries/stats range. */
export function useJournalActions() {
  const { mutate } = useSWRConfig();
  const refresh = useCallback(() => mutate(isJournalKey), [mutate]);

  const createEntry = useCallback(
    async (text: string, date: string, timeZone: string) => {
      const result = await api.post<{ entry: Entry; missed: MissedActivity[]; activityCount: number }>("/api/entries", {
        text,
        date,
        timeZone,
      });
      await refresh();
      return result;
    },
    [refresh],
  );

  const updateEntry = useCallback(
    async (id: string, data: EntryData) => {
      const { entry } = await api.patch<{ entry: Entry }>(`/api/entries/${id}`, { data });
      await refresh();
      return entry;
    },
    [refresh],
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      await api.delete(`/api/entries/${id}`);
      await refresh();
    },
    [refresh],
  );

  return { createEntry, updateEntry, deleteEntry };
}

/** GitHub App connection state (private repos). */
export function useGithubConnection() {
  const { data, isLoading, mutate } = useSWR<GithubConnection>("/api/github/status", fetcher);
  const disconnect = useCallback(async () => {
    await api.delete("/api/github/connection");
    await mutate();
  }, [mutate]);
  return { status: data ?? null, isLoading, disconnect };
}

/** Repos granted to the App with their tracked flag; `setExcluded` saves optimistically. */
export function useGithubRepos(enabled: boolean) {
  const { data, isLoading, error, mutate } = useSWR<{ repos: RepoAccess[] }>(
    enabled ? "/api/github/repos" : null,
    fetcher,
  );
  const setExcluded = useCallback(
    async (excluded: string[]) => {
      const skip = new Set(excluded);
      await mutate(
        async (cur) => {
          await api.put("/api/github/repos", { excluded });
          return { repos: (cur?.repos ?? []).map((r) => ({ ...r, tracked: !skip.has(r.fullName) })) };
        },
        {
          optimisticData: (cur) => ({
            repos: (cur?.repos ?? []).map((r) => ({ ...r, tracked: !skip.has(r.fullName) })),
          }),
          rollbackOnError: true,
          revalidate: false,
        },
      );
    },
    [mutate],
  );
  return { repos: data?.repos ?? null, isLoading: enabled && isLoading, failed: Boolean(error), setExcluded };
}
