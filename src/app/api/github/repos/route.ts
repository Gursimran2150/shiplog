import { NO_STORE, userRoute } from "@/lib/api/route";
import { getGithubConnection, setExcludedRepos } from "@/lib/db/repo";
import type { RepoAccess } from "@/lib/domain/types";
import { jsonError } from "@/lib/security/http";
import { appConfig, installationRepos } from "@/lib/server/github-app";
import { excludedReposBody } from "@/lib/server/schemas";

/** Repos granted to the ShipLog App, each marked tracked or excluded. */
export const GET = userRoute({}, async ({ user }) => {
  const app = appConfig();
  const conn = app ? await getGithubConnection(user.id) : null;
  if (!app || !conn) return jsonError(404, "Connect GitHub first.");
  const excluded = new Set(conn.excluded);
  const repos: RepoAccess[] = (await installationRepos(app, conn.installationId)).map((r) => ({
    ...r,
    tracked: !excluded.has(r.fullName),
  }));
  return Response.json({ repos }, { headers: NO_STORE });
});

export const PUT = userRoute({ body: excludedReposBody }, async ({ user, body }) => {
  const saved = await setExcludedRepos(user.id, body.excluded);
  return saved
    ? Response.json({ excluded: body.excluded }, { headers: NO_STORE })
    : jsonError(404, "Connect GitHub first.");
});
