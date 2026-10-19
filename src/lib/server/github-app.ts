import "server-only";
import { createPrivateKey, type KeyObject } from "node:crypto";
import { SignJWT } from "jose";
import { z } from "zod";
import { createAnswerCache } from "@/lib/ai/cache";
import { localDate } from "@/lib/domain/dates";
import type { Activity } from "@/lib/domain/types";
import { getEnv } from "@/lib/env";
import { mapLimit } from "./concurrency";

/**
 * ShipLog GitHub App: read-only access (contents, metadata, pull requests) to the repos the
 * user picked at install time. Only the installation id is stored; short-lived installation
 * tokens are minted on demand and cached in memory until shortly before they expire.
 */

const API = "https://api.github.com";
const HEADERS = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" } as const;
const MAX_REPOS = 25; // bound the fan-out per request
const CONCURRENCY = 5;

interface AppConfig {
  appId: string;
  slug: string;
  clientId: string;
  clientSecret: string;
  privateKey: KeyObject;
}

let config: AppConfig | null | undefined;

/** The App config, or null when the server runs in public-username mode only. */
export function appConfig(): AppConfig | null {
  if (config !== undefined) return config;
  const env = getEnv();
  if (
    !env.GITHUB_APP_ID ||
    !env.GITHUB_APP_SLUG ||
    !env.GITHUB_APP_CLIENT_ID ||
    !env.GITHUB_APP_CLIENT_SECRET ||
    !env.GITHUB_APP_PRIVATE_KEY
  ) {
    config = null;
    return config;
  }
  config = {
    appId: env.GITHUB_APP_ID,
    slug: env.GITHUB_APP_SLUG,
    clientId: env.GITHUB_APP_CLIENT_ID,
    clientSecret: env.GITHUB_APP_CLIENT_SECRET,
    // GitHub issues PKCS#1 keys; node:crypto accepts them (and "\n"-escaped env values).
    privateKey: createPrivateKey(env.GITHUB_APP_PRIVATE_KEY.replaceAll("\\n", "\n")),
  };
  return config;
}

/** A 9-minute App JWT (GitHub allows 10), back-dated 60s for clock drift. */
async function appJwt(app: AppConfig): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: "RS256" })
    .setIssuer(app.appId)
    .setIssuedAt(now - 60)
    .setExpirationTime(now + 9 * 60)
    .sign(app.privateKey);
}

async function github(path: string, token: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { ...HEADERS, Authorization: `Bearer ${token}`, ...init?.headers },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`GitHub ${res.status} ${path.split("?")[0]}`);
  return res.json();
}

const tokens = new Map<number, { token: string; expiresAt: number }>();

async function installationToken(app: AppConfig, installationId: number): Promise<string> {
  const hit = tokens.get(installationId);
  if (hit && hit.expiresAt - Date.now() > 5 * 60_000) return hit.token;
  const body = z
    .object({ token: z.string(), expires_at: z.string() })
    .parse(await github(`/app/installations/${installationId}/access_tokens`, await appJwt(app), { method: "POST" }));
  tokens.set(installationId, { token: body.token, expiresAt: Date.parse(body.expires_at) });
  return body.token;
}

const repoCache = createAnswerCache(200, 5 * 60_000);
const repoList = z.object({
  total_count: z.number(),
  repositories: z.array(z.object({ full_name: z.string(), private: z.boolean() })),
});

/** Repos the installation can see (what the user granted on GitHub), cached for 5 minutes. */
export async function installationRepos(
  app: AppConfig,
  installationId: number,
): Promise<{ fullName: string; private: boolean }[]> {
  const key = String(installationId);
  const hit = repoCache.get(key);
  if (hit) return JSON.parse(hit) as { fullName: string; private: boolean }[];
  const token = await installationToken(app, installationId);
  const repos: { fullName: string; private: boolean }[] = [];
  for (let page = 1; page <= 3; page++) {
    const body = repoList.parse(await github(`/installation/repositories?per_page=100&page=${page}`, token));
    repos.push(...body.repositories.map((r) => ({ fullName: r.full_name, private: r.private })));
    if (repos.length >= body.total_count) break;
  }
  repos.sort((a, b) => a.fullName.localeCompare(b.fullName));
  repoCache.set(key, JSON.stringify(repos));
  return repos;
}

const commitList = z.array(
  z.object({
    html_url: z.string().url(),
    commit: z.object({ message: z.string(), committer: z.object({ date: z.string() }).nullable() }),
  }),
);
const prSearch = z.object({
  items: z.array(
    z.object({ html_url: z.string().url(), title: z.string(), created_at: z.string(), repository_url: z.string() }),
  ),
});

/** The user's commits and PRs in their tracked repos, for local dates [from, to]. */
export async function privateActivity(
  app: AppConfig,
  conn: { installationId: number; login: string; excluded: readonly string[] },
  from: string,
  to: string,
  timeZone: string,
): Promise<Activity[]> {
  const excluded = new Set(conn.excluded);
  const repos = (await installationRepos(app, conn.installationId))
    .filter((r) => !excluded.has(r.fullName))
    .slice(0, MAX_REPOS);
  if (!repos.length) return [];

  const token = await installationToken(app, conn.installationId);
  // Widen by a day: GitHub filters in UTC, we filter again by the user's local date.
  const since = new Date(Date.parse(`${from}T00:00:00Z`) - 86_400_000).toISOString();
  const until = new Date(Date.parse(`${to}T23:59:59Z`) + 86_400_000).toISOString();
  const author = encodeURIComponent(conn.login);

  const [commitLists, prs] = await Promise.all([
    mapLimit(repos, CONCURRENCY, async (r) => {
      try {
        const body = commitList.parse(
          await github(
            `/repos/${r.fullName}/commits?author=${author}&since=${since}&until=${until}&per_page=50`,
            token,
          ),
        );
        return body.flatMap((c) =>
          c.commit.committer
            ? [
                {
                  kind: "commit" as const,
                  repo: r.fullName,
                  title: c.commit.message.split("\n")[0].slice(0, 200),
                  url: c.html_url,
                  date: localDate(new Date(c.commit.committer.date), timeZone),
                },
              ]
            : [],
        );
      } catch {
        return []; // an empty or archived repo shouldn't hide the others
      }
    }),
    github(
      `/search/issues?q=${encodeURIComponent(`type:pr author:${conn.login} created:${since.slice(0, 10)}..${until.slice(0, 10)}`)}&per_page=50`,
      token,
    )
      .then((body) => prSearch.parse(body).items)
      .catch(() => []),
  ]);

  const tracked = new Set(repos.map((r) => r.fullName));
  const prActivity: Activity[] = prs.flatMap((p) => {
    const repo = p.repository_url.split("/repos/")[1] ?? "";
    return tracked.has(repo)
      ? [
          {
            kind: "pr" as const,
            repo,
            title: p.title.slice(0, 200),
            url: p.html_url,
            date: localDate(new Date(p.created_at), timeZone),
          },
        ]
      : [];
  });

  return [...commitLists.flat(), ...prActivity].filter((a) => a.date >= from && a.date <= to);
}

// ---------- install flow ----------

/** Exchanges the OAuth code from the install redirect and returns the GitHub login, if it owns the installation. */
export async function verifyInstallation(app: AppConfig, code: string, installationId: number): Promise<string | null> {
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: app.clientId, client_secret: app.clientSecret, code }),
    signal: AbortSignal.timeout(8000),
  });
  const parsed = z.object({ access_token: z.string() }).safeParse(await tokenRes.json());
  if (!parsed.success) return null;
  const userToken = parsed.data.access_token;

  // The user token is used for these two checks only and is never stored.
  const [user, installs] = await Promise.all([
    github("/user", userToken).then((b) => z.object({ login: z.string() }).parse(b)),
    github("/user/installations?per_page=100", userToken).then((b) =>
      z.object({ installations: z.array(z.object({ id: z.number() })) }).parse(b),
    ),
  ]);
  return installs.installations.some((i) => i.id === installationId) ? user.login : null;
}
