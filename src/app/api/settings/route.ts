import { NO_STORE, userRoute } from "@/lib/api/route";
import { getSettings, saveSettings } from "@/lib/db/repo";
import { settingsSchema } from "@/lib/server/schemas";

export const GET = userRoute({}, async ({ user }) =>
  Response.json({ settings: await getSettings(user.id) }, { headers: NO_STORE }),
);

export const PUT = userRoute({ body: settingsSchema }, async ({ user, body }) => {
  await saveSettings(user.id, body);
  return Response.json({ settings: body }, { headers: NO_STORE });
});
