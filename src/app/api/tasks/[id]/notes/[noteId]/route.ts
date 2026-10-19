import { z } from "zod";
import { userRoute } from "@/lib/api/route";
import { deleteNote } from "@/lib/db/tasks";
import { jsonError } from "@/lib/security/http";

export const DELETE = userRoute({}, async ({ user }, ctx: RouteContext<"/api/tasks/[id]/notes/[noteId]">) => {
  const { id, noteId } = await ctx.params;
  if (!z.uuid().safeParse(id).success || !z.uuid().safeParse(noteId).success) return jsonError(400, "Invalid id.");
  return (await deleteNote(user.id, id, noteId))
    ? new Response(null, { status: 204 })
    : jsonError(404, "Note not found.");
});
