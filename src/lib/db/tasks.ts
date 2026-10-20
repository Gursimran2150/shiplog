import "server-only";
import { z } from "zod";
import {
  NOTE_KINDS,
  SECTIONS,
  type NoteKind,
  type Section,
  type TaskEvent,
  type TaskNote,
  type TaskStatus,
  type TaskSummary,
} from "@/lib/domain/types";
import { db } from "./client";

/**
 * Tasks ("journeys"). A task's history lives in the daily logs: every log item with a matching
 * `taskId` is one step. Status and dates are derived from those steps in SQL, so editing or
 * deleting a log can never leave a task out of sync. Every query is scoped by user id.
 */

const idRow = z.object({ id: z.string() });
const rows = <S extends z.ZodType>(schema: S, result: unknown): z.infer<S>[] => z.array(schema).parse(result);

const summaryRow = z.object({
  id: z.string(),
  title: z.string(),
  project: z.string().nullable(),
  first_date: z.string().nullable(),
  last_date: z.string().nullable(),
  events: z.coerce.number(),
  notes: z.coerce.number(),
  has_work: z.boolean().nullable(),
  last_sections: z.array(z.string()).nullable(),
});

/**
 * Status from the latest day the task was worked on (planning-only days don't count): blocked if
 * that day had a blocker, in progress if it was still being worked on, done if it was finished.
 */
export function deriveStatus(hasWork: boolean, lastSections: readonly string[]): TaskStatus {
  if (!hasWork) return "planned";
  if (lastSections.includes("blockers")) return "blocked";
  if (lastSections.includes("inProgress")) return "in_progress";
  return lastSections.includes("done") ? "done" : "in_progress";
}

const toSummary = (r: z.infer<typeof summaryRow>): TaskSummary => ({
  id: r.id,
  title: r.title,
  project: r.project,
  status: deriveStatus(Boolean(r.has_work), r.last_sections ?? []),
  firstDate: r.first_date,
  lastDate: r.last_date,
  events: r.events,
  notes: r.notes,
});

/**
 * Task summaries for a user, most recently active first. One pass over the user's log items
 * (jsonb_array_elements per section), grouped per task. `only` narrows it to one task.
 */
async function summaries(userId: string, only: string | null): Promise<TaskSummary[]> {
  const result = await db()`
    WITH ev AS (
      SELECT item->>'taskId' AS task_id, e.date, s.section
      FROM entries e
      CROSS JOIN LATERAL (VALUES ('done'), ('inProgress'), ('blockers'), ('tomorrow')) AS s(section)
      CROSS JOIN LATERAL jsonb_array_elements(e.data -> s.section) AS item
      WHERE e.user_id = ${userId} AND item ? 'taskId'
        AND (${only}::text IS NULL OR item->>'taskId' = ${only}::text)
    ),
    agg AS (
      SELECT task_id, min(date) AS first_date, max(date) AS last_date, count(*) AS events,
             max(date) FILTER (WHERE section <> 'tomorrow') AS last_work,
             bool_or(section <> 'tomorrow') AS has_work
      FROM ev GROUP BY task_id
    ),
    latest AS (
      SELECT ev.task_id, array_agg(DISTINCT ev.section) AS last_sections
      FROM ev JOIN agg ON agg.task_id = ev.task_id AND ev.date = agg.last_work
      GROUP BY ev.task_id
    )
    SELECT t.id, t.title, t.project, agg.first_date::text, agg.last_date::text,
           coalesce(agg.events, 0) AS events, agg.has_work, latest.last_sections,
           (SELECT count(*) FROM task_notes n WHERE n.task_id = t.id) AS notes
    FROM tasks t
    LEFT JOIN agg ON agg.task_id = t.id::text
    LEFT JOIN latest ON latest.task_id = t.id::text
    WHERE t.user_id = ${userId} AND (${only}::uuid IS NULL OR t.id = ${only}::uuid)
    ORDER BY coalesce(agg.last_date, t.created_at::date) DESC, t.created_at DESC
    LIMIT 1000`;
  return rows(summaryRow, result).map(toSummary);
}

export const listTasks = (userId: string) => summaries(userId, null);

export async function getTask(userId: string, id: string): Promise<TaskSummary | null> {
  return (await summaries(userId, id))[0] ?? null;
}

/** Tasks still open and touched in the last `days` days: what the AI may link new log items to. */
export async function openTasks(userId: string, today: string, days = 45, limit = 40): Promise<TaskSummary[]> {
  const all = await listTasks(userId);
  const since = new Date(Date.parse(`${today}T00:00:00Z`) - days * 86_400_000).toISOString().slice(0, 10);
  return all.filter((t) => t.status !== "done" && (t.lastDate ?? today) >= since).slice(0, limit);
}

/** True when every id is one of this user's tasks (so a log can't point at someone else's). */
export async function ownsTasks(userId: string, ids: readonly string[]): Promise<boolean> {
  const unique = [...new Set(ids)];
  if (!unique.length) return true;
  const result = await db()`SELECT count(*) AS n FROM tasks WHERE user_id = ${userId} AND id = ANY(${unique}::uuid[])`;
  return rows(z.object({ n: z.coerce.number() }), result)[0].n === unique.length;
}

/** Creates tasks with caller-chosen ids in one statement (ids let the logs reference them right away). */
export async function insertTasks(
  userId: string,
  tasks: readonly { id: string; title: string; project: string | null }[],
): Promise<void> {
  if (!tasks.length) return;
  await db()`
    INSERT INTO tasks (id, user_id, title, project)
    SELECT i::uuid, ${userId}::uuid, t, nullif(p, '')
    FROM unnest(${tasks.map((t) => t.id)}::text[], ${tasks.map((t) => t.title)}::text[],
                ${tasks.map((t) => t.project ?? "")}::text[]) AS x(i, t, p)`;
}

export async function updateTask(
  userId: string,
  id: string,
  input: { title: string; project: string | null },
): Promise<boolean> {
  const result = await db()`
    UPDATE tasks SET title = ${input.title}, project = ${input.project}
    WHERE id = ${id} AND user_id = ${userId} RETURNING id`;
  return rows(idRow, result).length > 0;
}

const eventRow = z.object({
  task_id: z.string(),
  entry_id: z.string(),
  date: z.string(),
  section: z.enum(SECTIONS),
  idx: z.coerce.number(),
  text: z.string(),
});

const SECTION_ORDER: Record<Section, number> = { tomorrow: 0, inProgress: 1, blockers: 2, done: 3 };

/**
 * Every log item on the given tasks' journeys in one query, grouped by task, oldest first
 * (within a day: planned → working → blocked → done).
 */
export async function eventsForTasks(userId: string, taskIds: readonly string[]): Promise<Map<string, TaskEvent[]>> {
  const out = new Map<string, TaskEvent[]>(taskIds.map((id) => [id, []]));
  if (!taskIds.length) return out;
  const result = await db()`
    SELECT item.value->>'taskId' AS task_id, e.id AS entry_id, e.date::text, s.section, (item.ord - 1) AS idx,
           item.value->>'text' AS text
    FROM entries e
    CROSS JOIN LATERAL (VALUES ('done'), ('inProgress'), ('blockers'), ('tomorrow')) AS s(section)
    CROSS JOIN LATERAL jsonb_array_elements(e.data -> s.section) WITH ORDINALITY AS item(value, ord)
    WHERE e.user_id = ${userId} AND item.value->>'taskId' = ANY(${[...taskIds]}::text[])
    ORDER BY e.date, e.created_at`;
  for (const r of rows(eventRow, result)) {
    out.get(r.task_id)?.push({ entryId: r.entry_id, date: r.date, section: r.section, index: r.idx, text: r.text });
  }
  for (const list of out.values()) {
    list.sort((a, b) => a.date.localeCompare(b.date) || SECTION_ORDER[a.section] - SECTION_ORDER[b.section]);
  }
  return out;
}

/** Every log item on one task's journey, oldest first. */
export async function taskEvents(userId: string, taskId: string): Promise<TaskEvent[]> {
  return (await eventsForTasks(userId, [taskId])).get(taskId) ?? [];
}

const noteRow = z.object({ id: z.string(), kind: z.enum(NOTE_KINDS), body: z.string(), created_at: z.coerce.string() });
const toNote = (r: z.infer<typeof noteRow>): TaskNote => ({
  id: r.id,
  kind: r.kind,
  body: r.body,
  createdAt: r.created_at,
});

export async function taskNotes(userId: string, taskId: string): Promise<TaskNote[]> {
  const result = await db()`
    SELECT id, kind, body, created_at::text FROM task_notes
    WHERE user_id = ${userId} AND task_id = ${taskId} ORDER BY created_at`;
  return rows(noteRow, result).map(toNote);
}

/** Adds a note to one of the user's own tasks; null when the task isn't theirs. */
export async function addNote(userId: string, taskId: string, kind: NoteKind, body: string): Promise<TaskNote | null> {
  const result = await db()`
    INSERT INTO task_notes (task_id, user_id, kind, body)
    SELECT id, user_id, ${kind}, ${body} FROM tasks WHERE id = ${taskId} AND user_id = ${userId}
    RETURNING id, kind, body, created_at::text`;
  const [row] = rows(noteRow, result);
  return row ? toNote(row) : null;
}

export async function deleteNote(userId: string, taskId: string, noteId: string): Promise<boolean> {
  const result = await db()`
    DELETE FROM task_notes WHERE id = ${noteId} AND task_id = ${taskId} AND user_id = ${userId} RETURNING id`;
  return rows(idRow, result).length > 0;
}

/** Seeds notes for demo accounts in one statement. */
export async function insertNotes(
  userId: string,
  notes: readonly { taskId: string; kind: NoteKind; body: string }[],
): Promise<void> {
  if (!notes.length) return;
  await db()`
    INSERT INTO task_notes (task_id, user_id, kind, body)
    SELECT t::uuid, ${userId}::uuid, k, b
    FROM unnest(${notes.map((n) => n.taskId)}::text[], ${notes.map((n) => n.kind)}::text[],
                ${notes.map((n) => n.body)}::text[]) AS x(t, k, b)`;
}
