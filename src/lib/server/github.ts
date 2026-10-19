import "server-only";
import { z } from "zod";
import { createAnswerCache } from "@/lib/ai/cache";
import { addDays, localDate } from "@/lib/domain/dates";
import type { Activity } from "@/lib/domain/types";

/**
 * Public GitHub activity (commits and pull requests) via the Search API.
 * Read-only and public-only: no OAuth, so judges and demo users need no GitHub access.
 * Responses are cached for 5 minutes per query to stay well inside GitHub's rate limits.
 */

const API = "https://api.github.com";
const cache = createAnswerCache(500, 5 * 60 * 1000);

const commitSearch = z.object({
  items: z.array(
    z.object({
      html_url: z.string().url(),
      commit: z.object({ message: z.string(), committer: z.object({ date: z.string() }) }),
      repository: z.object({ full_name: z.string() }),
    }),
  ),
});

const prSearch = z.object({
  items: z.array(
    z.object({
      html_url: z.string().url(),
      title: z.string(),
      created_at: z.string(),
      repository_url: z.string(),
    }),
  ),
});

async function search(path: string): Promise<unknown> {
  const token = process.env.GITHUB_TOKEN;
  const res = await fetch(`${API}${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
  return res.json();
}

/**
 * Commits and PRs authored by `username` on local dates [from, to] in `timeZone`.
 * Returns an empty list (never throws) if GitHub is unavailable, so logging still works.
 */
export async function fetchActivity(username: string, from: string, to: string, timeZone: string): Promise<Activity[]> {
  const key = `${username.toLowerCase()}|${from}|${to}|${timeZone}`;
  const hit = cache.get(key);
  if (hit) return JSON.parse(hit) as Activity[];

  // Widen by a day on each side: GitHub filters in UTC, we filter again by local date below.
  const range = `${addDays(from, -1)}..${addDays(to, 1)}`;
  const user = encodeURIComponent(username);
  try {
    const [commits, prs] = await Promise.all([
      search(`/search/commits?q=author:${user}+committer-date:${range}&sort=committer-date&order=desc&per_page=50`),
      search(`/search/issues?q=author:${user}+type:pr+created:${range}&sort=created&order=desc&per_page=30`),
    ]);

    const activity: Activity[] = [
      ...commitSearch.parse(commits).items.map((c) => ({
        kind: "commit" as const,
        repo: c.repository.full_name,
        title: c.commit.message.split("\n")[0].slice(0, 200),
        url: c.html_url,
        date: localDate(new Date(c.commit.committer.date), timeZone),
      })),
      ...prSearch.parse(prs).items.map((p) => ({
        kind: "pr" as const,
        repo: p.repository_url.split("/repos/")[1] ?? "",
        title: p.title.slice(0, 200),
        url: p.html_url,
        date: localDate(new Date(p.created_at), timeZone),
      })),
    ].filter((a) => a.date >= from && a.date <= to);

    cache.set(key, JSON.stringify(activity));
    return activity;
  } catch (error) {
    console.warn("[github]", error);
    return [];
  }
}

/** Compact one-line-per-item form for prompts. */
export function formatActivity(activity: readonly Activity[]): string {
  return activity
    .map((a) => `${a.date} ${a.kind === "pr" ? "PR" : "commit"} [${a.repo}] ${a.title} <${a.url}>`)
    .join("\n");
}
