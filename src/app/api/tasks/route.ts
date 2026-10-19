import { randomUUID } from "node:crypto";
import { NO_STORE, userRoute } from "@/lib/api/route";
import { getTask, insertTasks, listTasks } from "@/lib/db/tasks";
import { taskBody } from "@/lib/server/schemas";

/** All of the user's tasks with status and dates derived from their logs. */
export const GET = userRoute({}, async ({ user }) =>
  Response.json({ tasks: await listTasks(user.id) }, { headers: NO_STORE }),
);

/** Creates an empty task, e.g. from "Move to task → New task". */
export const POST = userRoute({ body: taskBody }, async ({ user, body }) => {
  const id = randomUUID();
  await insertTasks(user.id, [{ id, title: body.title, project: body.project || null }]);
  return Response.json({ task: await getTask(user.id, id) }, { status: 201, headers: NO_STORE });
});
