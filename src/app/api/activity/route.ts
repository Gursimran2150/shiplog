import { NO_STORE, userRoute } from "@/lib/api/route";
import { userActivity } from "@/lib/server/activity";
import { activityQuery } from "@/lib/server/schemas";

/** The user's GitHub commits and PRs for one local day (private via the App, or public). */
export const GET = userRoute({ query: activityQuery }, async ({ user, query }) => {
  const { login, activity } = await userActivity(user.id, query.date, query.date, query.timeZone);
  return Response.json({ githubUsername: login, activity }, { headers: NO_STORE });
});
