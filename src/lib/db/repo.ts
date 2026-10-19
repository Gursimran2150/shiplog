import "server-only";
import { z } from "zod";
import type { DayCount, Entry, EntryData, ReportKind, Settings } from "@/lib/domain/types";
import { entryDataSchema, settingsSchema } from "@/lib/server/schemas";
import { db } from "./client";

/**
 * All queries are parameterised tagged templates (no string-built SQL) and scoped by user id.
 * Rows are validated with zod on the way out, so the rest of the app never trusts raw DB shapes.
 */

const userRow = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  password_hash: z.string(),
  is_demo: z.boolean(),
});
type UserRow = z.infer<typeof userRow>;

const entryRow = z.object({
  id: z.string(),
  date: z.string(),
  raw: z.string(),
  data: entryDataSchema,
  words: z.coerce.number(),
  created_at: z.coerce.string(),
});

const dayCountRow = z.object({ date: z.string(), entries: z.coerce.number(), items: z.coerce.number() });
const idRow = z.object({ id: z.string() });

/** Parses query results into typed rows (throws on schema drift instead of failing silently later). */
const rows = <S extends z.ZodType>(schema: S, result: unknown): z.infer<S>[] => z.array(schema).parse(result);

const toEntry = (r: z.infer<typeof entryRow>): Entry => ({
  id: r.id,
  date: r.date,
  raw: r.raw,
  data: r.data,
  words: r.words,
  createdAt: r.created_at,
});

// ---------- users ----------

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const result = await db()`SELECT id, email, name, password_hash, is_demo FROM users WHERE email = ${email}`;
  return rows(userRow, result)[0] ?? null;
}

export async function createUser(input: {
  email: string;
  name: string;
  passwordHash: string;
  isDemo?: boolean;
}): Promise<UserRow | null> {
  const result = await db()`
    INSERT INTO users (email, name, password_hash, is_demo)
    VALUES (${input.email}, ${input.name}, ${input.passwordHash}, ${input.isDemo ?? false})
    ON CONFLICT (email) DO NOTHING
    RETURNING id, email, name, password_hash, is_demo`;
  return rows(userRow, result)[0] ?? null;
}

/** Deletes the user; ON DELETE CASCADE removes their settings, entries and reports in the same statement. */
export async function deleteUser(userId: string): Promise<void> {
  await db()`DELETE FROM users WHERE id = ${userId}`;
}

// ---------- settings ----------

const DEFAULT_SETTINGS: Settings = { githubUsername: null, standupFormat: "slack", onboarded: false };

export async function getSettings(userId: string): Promise<Settings> {
  const result = await db()`SELECT github_username, standup_format, onboarded FROM settings WHERE user_id = ${userId}`;
  const [row] = rows(
    z.object({ github_username: z.string().nullable(), standup_format: z.string(), onboarded: z.boolean() }),
    result,
  );
  if (!row) return DEFAULT_SETTINGS;
  const parsed = settingsSchema.safeParse({
    githubUsername: row.github_username,
    standupFormat: row.standup_format,
    onboarded: row.onboarded,
  });
  return parsed.success ? parsed.data : DEFAULT_SETTINGS;
}

export async function saveSettings(userId: string, settings: Settings): Promise<void> {
  await db()`
    INSERT INTO settings (user_id, github_username, standup_format, onboarded, updated_at)
    VALUES (${userId}, ${settings.githubUsername}, ${settings.standupFormat}, ${settings.onboarded}, now())
    ON CONFLICT (user_id) DO UPDATE
      SET github_username = EXCLUDED.github_username, standup_format = EXCLUDED.standup_format,
          onboarded = EXCLUDED.onboarded, updated_at = now()`;
}

// ---------- entries ----------

export async function createEntry(
  userId: string,
  input: { date: string; raw: string; data: EntryData; words: number },
): Promise<Entry> {
  const result = await db()`
    INSERT INTO entries (user_id, date, raw, data, words)
    VALUES (${userId}, ${input.date}, ${input.raw}, ${JSON.stringify(input.data)}, ${input.words})
    RETURNING id, date::text, raw, data, words, created_at`;
  return toEntry(rows(entryRow, result)[0]);
}

export async function updateEntryData(userId: string, id: string, data: EntryData): Promise<Entry | null> {
  const result = await db()`
    UPDATE entries SET data = ${JSON.stringify(data)} WHERE id = ${id} AND user_id = ${userId}
    RETURNING id, date::text, raw, data, words, created_at`;
  const [row] = rows(entryRow, result);
  return row ? toEntry(row) : null;
}

export async function deleteEntry(userId: string, id: string): Promise<boolean> {
  const result = await db()`DELETE FROM entries WHERE id = ${id} AND user_id = ${userId} RETURNING id`;
  return rows(idRow, result).length > 0;
}

/** Entries in [from, to], newest first. The date range is filtered in SQL, using the (user_id, date) index. */
export async function listEntries(userId: string, from: string, to: string, limit = 200): Promise<Entry[]> {
  const result = await db()`
    SELECT id, date::text, raw, data, words, created_at FROM entries
    WHERE user_id = ${userId} AND date BETWEEN ${from}::date AND ${to}::date
    ORDER BY date DESC, created_at DESC LIMIT ${limit}`;
  return rows(entryRow, result).map(toEntry);
}

/** Per-day counts for the heatmap, aggregated in SQL so only one small row per day leaves the database. */
export async function dayCounts(userId: string, from: string, to: string): Promise<DayCount[]> {
  const result = await db()`
    SELECT date::text AS date,
           count(*) AS entries,
           sum(jsonb_array_length(data -> 'done') + jsonb_array_length(data -> 'inProgress')) AS items
    FROM entries
    WHERE user_id = ${userId} AND date BETWEEN ${from}::date AND ${to}::date
    GROUP BY date ORDER BY date`;
  return rows(dayCountRow, result);
}

/** Full-text search (GIN index) for "Ask your journal"; falls back to the most recent entries. */
export async function searchEntries(userId: string, query: string, limit = 12): Promise<Entry[]> {
  const result = await db()`
    SELECT id, date::text, raw, data, words, created_at FROM entries
    WHERE user_id = ${userId} AND search @@ websearch_to_tsquery('english', ${query})
    ORDER BY ts_rank(search, websearch_to_tsquery('english', ${query})) DESC, date DESC
    LIMIT ${limit}`;
  return rows(entryRow, result).map(toEntry);
}

export async function recentEntries(userId: string, limit = 10): Promise<Entry[]> {
  const result = await db()`
    SELECT id, date::text, raw, data, words, created_at FROM entries
    WHERE user_id = ${userId} ORDER BY date DESC, created_at DESC LIMIT ${limit}`;
  return rows(entryRow, result).map(toEntry);
}

/** Bulk insert in one round-trip (used to seed demo accounts). */
export async function insertEntries(userId: string, items: { date: string; raw: string; data: EntryData }[]) {
  if (!items.length) return;
  await db()`
    INSERT INTO entries (user_id, date, raw, data, words)
    SELECT ${userId}::uuid, d::date, r, x::jsonb, w
    FROM unnest(
      ${items.map((i) => i.date)}::text[],
      ${items.map((i) => i.raw)}::text[],
      ${items.map((i) => JSON.stringify(i.data))}::text[],
      ${items.map((i) => i.raw.split(/\s+/).filter(Boolean).length)}::int[]
    ) AS t(d, r, x, w)`;
}

// ---------- reports (cache keyed by input hash) ----------

export async function findReport(userId: string, kind: ReportKind, sourceHash: string): Promise<string | null> {
  const result = await db()`
    SELECT content FROM reports WHERE user_id = ${userId} AND kind = ${kind} AND source_hash = ${sourceHash}`;
  return rows(z.object({ content: z.string() }), result)[0]?.content ?? null;
}

export async function saveReport(userId: string, kind: ReportKind, sourceHash: string, content: string) {
  await db()`
    INSERT INTO reports (user_id, kind, source_hash, content) VALUES (${userId}, ${kind}, ${sourceHash}, ${content})
    ON CONFLICT (user_id, kind, source_hash) DO UPDATE SET content = EXCLUDED.content, created_at = now()`;
}

// ---------- GitHub App connections ----------

interface GithubConnectionRow {
  installationId: number;
  login: string;
  excluded: string[];
}

const connectionRow = z.object({
  installation_id: z.coerce.number(),
  github_login: z.string(),
  excluded_repos: z.array(z.string()),
});

export async function getGithubConnection(userId: string): Promise<GithubConnectionRow | null> {
  const result = await db()`
    SELECT installation_id, github_login, excluded_repos FROM github_connections WHERE user_id = ${userId}`;
  const [row] = rows(connectionRow, result);
  return row ? { installationId: row.installation_id, login: row.github_login, excluded: row.excluded_repos } : null;
}

export async function saveGithubConnection(userId: string, installationId: number, login: string): Promise<void> {
  await db()`
    INSERT INTO github_connections (user_id, installation_id, github_login) VALUES (${userId}, ${installationId}, ${login})
    ON CONFLICT (user_id) DO UPDATE SET installation_id = EXCLUDED.installation_id, github_login = EXCLUDED.github_login`;
}

export async function setExcludedRepos(userId: string, excluded: string[]): Promise<boolean> {
  const result = await db()`
    UPDATE github_connections SET excluded_repos = ${excluded}::text[] WHERE user_id = ${userId} RETURNING user_id AS id`;
  return rows(idRow, result).length > 0;
}

export async function deleteGithubConnection(userId: string): Promise<void> {
  await db()`DELETE FROM github_connections WHERE user_id = ${userId}`;
}

// ---------- Bitbucket connections (tokens arrive and leave encrypted; see lib/server/crypto) ----------

const bitbucketRow = z.object({
  account_uuid: z.string(),
  username: z.string(),
  access_token: z.string(),
  refresh_token: z.string(),
  expires_at: z.coerce.date(),
  excluded_repos: z.array(z.string()),
});

interface StoredBitbucketConnection {
  accountUuid: string;
  username: string;
  sealedAccessToken: string;
  sealedRefreshToken: string;
  expiresAt: Date;
  excluded: string[];
}

export async function getBitbucketConnection(userId: string): Promise<StoredBitbucketConnection | null> {
  const result = await db()`
    SELECT account_uuid, username, access_token, refresh_token, expires_at, excluded_repos
    FROM bitbucket_connections WHERE user_id = ${userId}`;
  const [row] = rows(bitbucketRow, result);
  return row
    ? {
        accountUuid: row.account_uuid,
        username: row.username,
        sealedAccessToken: row.access_token,
        sealedRefreshToken: row.refresh_token,
        expiresAt: row.expires_at,
        excluded: row.excluded_repos,
      }
    : null;
}

export async function saveBitbucketConnection(
  userId: string,
  c: Omit<StoredBitbucketConnection, "excluded">,
): Promise<void> {
  await db()`
    INSERT INTO bitbucket_connections (user_id, account_uuid, username, access_token, refresh_token, expires_at)
    VALUES (${userId}, ${c.accountUuid}, ${c.username}, ${c.sealedAccessToken}, ${c.sealedRefreshToken}, ${c.expiresAt.toISOString()})
    ON CONFLICT (user_id) DO UPDATE SET
      account_uuid = EXCLUDED.account_uuid, username = EXCLUDED.username,
      access_token = EXCLUDED.access_token, refresh_token = EXCLUDED.refresh_token, expires_at = EXCLUDED.expires_at`;
}

export async function setBitbucketExcluded(userId: string, excluded: string[]): Promise<boolean> {
  const result = await db()`
    UPDATE bitbucket_connections SET excluded_repos = ${excluded}::text[] WHERE user_id = ${userId} RETURNING user_id AS id`;
  return rows(idRow, result).length > 0;
}

export async function deleteBitbucketConnection(userId: string): Promise<void> {
  await db()`DELETE FROM bitbucket_connections WHERE user_id = ${userId}`;
}
