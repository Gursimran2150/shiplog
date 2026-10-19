import { z } from "zod";
import { NO_STORE, userRoute } from "@/lib/api/route";
import { deleteEntry, updateEntryData } from "@/lib/db/repo";
import { jsonError } from "@/lib/security/http";
import { updateEntryRequest } from "@/lib/server/schemas";

type Ctx = RouteContext<"/api/entries/[id]">;

async function entryId(ctx: Ctx): Promise<string | null> {
  const { id } = await ctx.params;
  return z.uuid().safeParse(id).success ? id : null;
}

export const PATCH = userRoute({ body: updateEntryRequest }, async ({ user, body }, ctx: Ctx) => {
  const id = await entryId(ctx);
  if (!id) return jsonError(400, "Invalid entry id.");
  const entry = await updateEntryData(user.id, id, body.data);
  return entry ? Response.json({ entry }, { headers: NO_STORE }) : jsonError(404, "Entry not found.");
});

export const DELETE = userRoute({}, async ({ user }, ctx: Ctx) => {
  const id = await entryId(ctx);
  if (!id) return jsonError(400, "Invalid entry id.");
  return (await deleteEntry(user.id, id)) ? new Response(null, { status: 204 }) : jsonError(404, "Entry not found.");
});
