import { NO_STORE, userRoute } from "@/lib/api/route";
import { waitingItems } from "@/lib/server/waiting";

/** Open blockers, with who each one is waiting on and since when. */
export const GET = userRoute({}, async ({ user }) =>
  Response.json({ items: await waitingItems(user.id) }, { headers: NO_STORE }),
);
