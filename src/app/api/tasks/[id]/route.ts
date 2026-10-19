import { z } from "zod";
import { NO_STORE, userRoute } from "@/lib/api/route";
import { getTask, taskEvents, taskNotes, updateTask } from "@/lib/db/tasks";
import { jsonError } from "@/lib/security/http";
import { taskBody } from "@/lib/server/schemas";

type Ctx = RouteContext<"/api/tasks/[id]">;

async function taskId(ctx: Ctx): Promise<string | null> {
  const { id } = await ctx.params;
  return z.uuid().safeParse(id).success ? id : null;
}

/** A task's journey: summary, every log item on it (oldest first) and its notes. */
export const GET = userRoute({}, async ({ user }, ctx: Ctx) => {
  const id = await taskId(ctx);
  if (!id) return jsonError(400, "Invalid task id.");
  const [task, events, notes] = await Promise.all([
    getTask(user.id, id),
    taskEvents(user.id, id),
    taskNotes(user.id, id),
  ]);
  return task ? Response.json({ task, events, notes }, { headers: NO_STORE }) : jsonError(404, "Task not found.");
});

/** Renames a task or changes its project. */
export const PATCH = userRoute({ body: taskBody }, async ({ user, body }, ctx: Ctx) => {
  const id = await taskId(ctx);
  if (!id) return jsonError(400, "Invalid task id.");
  if (!(await updateTask(user.id, id, { title: body.title, project: body.project || null }))) {
    return jsonError(404, "Task not found.");
  }
  return Response.json({ task: await getTask(user.id, id) }, { headers: NO_STORE });
});
