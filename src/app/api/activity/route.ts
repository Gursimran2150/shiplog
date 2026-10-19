import { NO_STORE, userRoute } from "@/lib/api/route";
import { getSettings } from "@/lib/db/repo";
import { fetchActivity } from "@/lib/server/github";
import { activityQuery } from "@/lib/server/schemas";

/** The user's public GitHub commits and PRs for one local day. */
export const GET = userRoute({ query: activityQuery }, async ({ user, query }) => {
  const { githubUsername } = await getSettings(user.id);
  const activity = githubUsername ? await fetchActivity(githubUsername, query.date, query.date, query.timeZone) : [];
  return Response.json({ githubUsername, activity }, { headers: NO_STORE });
});
