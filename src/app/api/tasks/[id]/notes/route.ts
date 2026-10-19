import { z } from "zod";
import { NO_STORE, userRoute } from "@/lib/api/route";
import { addNote } from "@/lib/db/tasks";
import { jsonError } from "@/lib/security/http";
import { noteBody } from "@/lib/server/schemas";

/** Adds a note to a task: how it was fixed, what was learned, or anything else. */
export const POST = userRoute(
  { body: noteBody },
  async ({ user, body }, ctx: RouteContext<"/api/tasks/[id]/notes">) => {
    const { id } = await ctx.params;
    if (!z.uuid().safeParse(id).success) return jsonError(400, "Invalid task id.");
    const note = await addNote(user.id, id, body.kind, body.body);
    return note ? Response.json({ note }, { status: 201, headers: NO_STORE }) : jsonError(404, "Task not found.");
  },
);
