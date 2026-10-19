import { userRoute } from "@/lib/api/route";
import { jsonError } from "@/lib/security/http";
import { appConfig } from "@/lib/server/github-app";
import { signInstallState } from "@/lib/server/github-state";

/** Starts the GitHub App install: GitHub shows its own "all / only select repositories" picker. */
export const GET = userRoute({}, async ({ user }) => {
  const app = appConfig();
  if (!app) return jsonError(404, "GitHub App is not configured on this server.");
  const state = await signInstallState(user.id);
  return Response.redirect(
    `https://github.com/apps/${app.slug}/installations/new?state=${encodeURIComponent(state)}`,
    302,
  );
});
