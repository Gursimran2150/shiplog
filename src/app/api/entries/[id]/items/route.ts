import { z } from "zod";
import { NO_STORE, userRoute } from "@/lib/api/route";
import { getEntry, updateEntryData } from "@/lib/db/repo";
import { ownsTasks } from "@/lib/db/tasks";
import { jsonError } from "@/lib/security/http";
import { linkItemBody } from "@/lib/server/schemas";

/** Moves one log item to another task (or unlinks it): the manual fix for AI task linking. */
export const PATCH = userRoute(
  { body: linkItemBody },
  async ({ user, body }, ctx: RouteContext<"/api/entries/[id]/items">) => {
    const { id } = await ctx.params;
    if (!z.uuid().safeParse(id).success) return jsonError(400, "Invalid entry id.");
    if (body.taskId && !(await ownsTasks(user.id, [body.taskId]))) return jsonError(404, "Task not found.");
    const entry = await getEntry(user.id, id);
    const item = entry?.data[body.section][body.index];
    if (!entry || !item) return jsonError(404, "Item not found.");

    const moved = body.taskId ? { ...item, taskId: body.taskId } : { text: item.text, project: item.project };
    const data = {
      ...entry.data,
      [body.section]: entry.data[body.section].map((it, i) => (i === body.index ? moved : it)),
    };
    const updated = await updateEntryData(user.id, id, data);
    return updated ? Response.json({ entry: updated }, { headers: NO_STORE }) : jsonError(404, "Item not found.");
  },
);
