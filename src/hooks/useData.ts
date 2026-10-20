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
  FollowUpAnswer,
  Integration,
  IntegrationStatus,
  MissedActivity,
  RepoAccess,
  Settings,
} from "@/lib/domain/types";

const EMPTY_ENTRIES: Entry[] = [];
const EMPTY_DAYS: DayCount[] = [];
const EMPTY_ACTIVITY: Activity[] = [];
const DEFAULT_SETTINGS: Settings = { githubUsername: null, standupFormat: "slack", onboarded: true };

/**
 * SWR keys are plain URLs; this matches every cached entries/stats range, task journey and the
 * waiting-on list (both derived from the logs) so one save refreshes them all.
 */
export const isJournalKey = (key: unknown) =>
  typeof key === "string" &&
  (key.startsWith("/api/entries") ||
    key.startsWith("/api/stats") ||
    key.startsWith("/api/tasks") ||
    key.startsWith("/api/waiting"));

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
      const result = await api.post<{
        entry: Entry;
        missed: MissedActivity[];
        followUps: string[];
        activityCount: number;
      }>("/api/entries", {
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

  const refineEntry = useCallback(
    async (id: string, answers: FollowUpAnswer[]) => {
      const { entry } = await api.post<{ entry: Entry }>(`/api/entries/${id}/refine`, { answers });
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

  return { createEntry, updateEntry, refineEntry, deleteEntry };
}

/** Connection state for a code host (GitHub App or Bitbucket OAuth). */
export function useIntegration(provider: Integration) {
  const { data, isLoading, mutate } = useSWR<IntegrationStatus>(`/api/${provider}/status`, fetcher);
  const disconnect = useCallback(async () => {
    await api.delete(`/api/${provider}/connection`);
    await mutate();
  }, [mutate, provider]);
  return { status: data ?? null, isLoading, disconnect };
}

/** Repos available through a connected provider, with the tracked flag; `setExcluded` saves optimistically. */
export function useIntegrationRepos(provider: Integration, enabled: boolean) {
  const { data, isLoading, error, mutate } = useSWR<{ repos: RepoAccess[] }>(
    enabled ? `/api/${provider}/repos` : null,
    fetcher,
  );
  const setExcluded = useCallback(
    async (excluded: string[]) => {
      const skip = new Set(excluded);
      const apply = (cur?: { repos: RepoAccess[] }) => ({
        repos: (cur?.repos ?? []).map((r) => ({ ...r, tracked: !skip.has(r.fullName) })),
      });
      await mutate(
        async (cur) => {
          await api.put(`/api/${provider}/repos`, { excluded });
          return apply(cur);
        },
        { optimisticData: apply, rollbackOnError: true, revalidate: false },
      );
    },
    [mutate, provider],
  );
  return { repos: data?.repos ?? null, isLoading: enabled && isLoading, failed: Boolean(error), setExcluded };
}
