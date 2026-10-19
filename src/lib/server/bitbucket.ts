import "server-only";
import { z } from "zod";
import { createAnswerCache } from "@/lib/ai/cache";
import { localDate } from "@/lib/domain/dates";
import type { Activity } from "@/lib/domain/types";
import { getEnv } from "@/lib/env";
import { mapLimit } from "./concurrency";

/**
 * Bitbucket Cloud via OAuth 2.0 (one ShipLog "OAuth consumer"; each user just authorizes it).
 * Scopes: account, repository and pullrequest, all read-only.
 */

const SITE = "https://bitbucket.org/site/oauth2";
const API = "https://api.bitbucket.org/2.0";
const MAX_REPOS = 25;
const CONCURRENCY = 5;

interface Consumer {
  clientId: string;
  clientSecret: string;
}

export function bitbucketConfig(): Consumer | null {
  const env = getEnv();
  return env.BITBUCKET_CLIENT_ID && env.BITBUCKET_CLIENT_SECRET
    ? { clientId: env.BITBUCKET_CLIENT_ID, clientSecret: env.BITBUCKET_CLIENT_SECRET }
    : null;
}

export function authorizeUrl(consumer: Consumer, state: string): string {
  return `${SITE}/authorize?${new URLSearchParams({ client_id: consumer.clientId, response_type: "code", state })}`;
}

const tokenResponse = z.object({ access_token: z.string(), refresh_token: z.string(), expires_in: z.number() });

interface BitbucketTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

async function tokenRequest(consumer: Consumer, params: Record<string, string>): Promise<BitbucketTokens> {
  const res = await fetch(`${SITE}/access_token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${consumer.clientId}:${consumer.clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Bitbucket token ${res.status}`);
  const body = tokenResponse.parse(await res.json());
  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    expiresAt: new Date(Date.now() + body.expires_in * 1000),
  };
}

export const exchangeCode = (consumer: Consumer, code: string) =>
  tokenRequest(consumer, { grant_type: "authorization_code", code });

export const refreshTokens = (consumer: Consumer, refreshToken: string) =>
  tokenRequest(consumer, { grant_type: "refresh_token", refresh_token: refreshToken });

async function api(pathOrUrl: string, token: string): Promise<unknown> {
  const url = pathOrUrl.startsWith("https://") ? pathOrUrl : `${API}${pathOrUrl}`;
  if (!url.startsWith(`${API}/`)) throw new Error("Unexpected Bitbucket URL"); // never follow links off-API
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Bitbucket ${res.status} ${new URL(url).pathname}`);
  return res.json();
}

export async function currentUser(token: string): Promise<{ uuid: string; username: string }> {
  const body = z
    .object({ uuid: z.string(), username: z.string().optional(), nickname: z.string().optional() })
    .parse(await api("/user", token));
  return { uuid: body.uuid, username: body.username ?? body.nickname ?? "bitbucket-user" };
}

const repoPage = z.object({
  values: z.array(z.object({ full_name: z.string(), is_private: z.boolean() })),
  next: z.string().optional(),
});
const repoCache = createAnswerCache(200, 5 * 60_000);

/** Repos the user is a member of, cached per account for 5 minutes. */
export async function memberRepos(
  token: string,
  accountUuid: string,
): Promise<{ fullName: string; private: boolean }[]> {
  const hit = repoCache.get(accountUuid);
  if (hit) return JSON.parse(hit) as { fullName: string; private: boolean }[];
  const repos: { fullName: string; private: boolean }[] = [];
  let next: string | undefined = "/repositories?role=member&pagelen=100&sort=-updated_on";
  for (let page = 0; next && page < 3; page++) {
    const body: z.infer<typeof repoPage> = repoPage.parse(await api(next, token));
    repos.push(...body.values.map((r) => ({ fullName: r.full_name, private: r.is_private })));
    next = body.next;
  }
  repos.sort((a, b) => a.fullName.localeCompare(b.fullName));
  repoCache.set(accountUuid, JSON.stringify(repos));
  return repos;
}

const commitPage = z.object({
  values: z.array(
    z.object({
      date: z.string(),
      message: z.string(),
      links: z.object({ html: z.object({ href: z.string().url() }) }),
      author: z.object({ user: z.object({ uuid: z.string() }).optional() }),
    }),
  ),
});
const prPage = z.object({
  values: z.array(
    z.object({
      title: z.string(),
      created_on: z.string(),
      links: z.object({ html: z.object({ href: z.string().url() }) }),
    }),
  ),
});

/** The user's commits and PRs in their tracked Bitbucket repos for local dates [from, to]. */
export async function bitbucketActivity(
  token: string,
  account: { uuid: string; excluded: readonly string[] },
  from: string,
  to: string,
  timeZone: string,
): Promise<Activity[]> {
  const excluded = new Set(account.excluded);
  const repos = (await memberRepos(token, account.uuid)).filter((r) => !excluded.has(r.fullName)).slice(0, MAX_REPOS);
  const since = new Date(Date.parse(`${from}T00:00:00Z`) - 86_400_000).toISOString();
  const authorFilter = encodeURIComponent(`author.uuid="${account.uuid}" AND created_on >= ${since}`);

  const perRepo = await mapLimit(repos, CONCURRENCY, async (r) => {
    try {
      // Commits come newest first; one page covers a normal day per repo.
      const [commits, prs] = await Promise.all([
        api(`/repositories/${r.fullName}/commits?pagelen=50`, token).then((b) => commitPage.parse(b).values),
        api(
          `/repositories/${r.fullName}/pullrequests?state=OPEN&state=MERGED&state=DECLINED&pagelen=50&q=${authorFilter}`,
          token,
        ).then((b) => prPage.parse(b).values),
      ]);
      return [
        ...commits
          .filter((c) => c.author.user?.uuid === account.uuid)
          .map((c) => ({
            kind: "commit" as const,
            repo: r.fullName,
            title: c.message.split("\n")[0].slice(0, 200),
            url: c.links.html.href,
            date: localDate(new Date(c.date), timeZone),
          })),
        ...prs.map((p) => ({
          kind: "pr" as const,
          repo: r.fullName,
          title: p.title.slice(0, 200),
          url: p.links.html.href,
          date: localDate(new Date(p.created_on), timeZone),
        })),
      ];
    } catch {
      return []; // an empty or restricted repo shouldn't hide the others
    }
  });

  return perRepo.flat().filter((a) => a.date >= from && a.date <= to);
}
