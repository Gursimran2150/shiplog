import { NO_STORE, userRoute } from "@/lib/api/route";
import { dayCounts } from "@/lib/db/repo";
import { rangeQuery } from "@/lib/server/schemas";

/** Per-day counts for the heatmap and streak (aggregated in SQL). */
export const GET = userRoute({ query: rangeQuery }, async ({ user, query }) =>
  Response.json({ days: await dayCounts(user.id, query.from, query.to) }, { headers: NO_STORE }),
);
