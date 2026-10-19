import { NO_STORE, userRoute } from "@/lib/api/route";
import { setBitbucketExcluded } from "@/lib/db/repo";
import type { RepoAccess } from "@/lib/domain/types";
import { jsonError } from "@/lib/security/http";
import { memberRepos } from "@/lib/server/bitbucket";
import { bitbucketSession } from "@/lib/server/bitbucket-session";
import { excludedReposBody } from "@/lib/server/schemas";

/** Bitbucket repos the user can access, each marked tracked or excluded. */
export const GET = userRoute({}, async ({ user }) => {
  const session = await bitbucketSession(user.id);
  if (!session) return jsonError(404, "Connect Bitbucket first.");
  const excluded = new Set(session.excluded);
  const repos: RepoAccess[] = (await memberRepos(session.token, session.uuid)).map((r) => ({
    ...r,
    tracked: !excluded.has(r.fullName),
  }));
  return Response.json({ repos }, { headers: NO_STORE });
});

export const PUT = userRoute({ body: excludedReposBody }, async ({ user, body }) => {
  const saved = await setBitbucketExcluded(user.id, body.excluded);
  return saved
    ? Response.json({ excluded: body.excluded }, { headers: NO_STORE })
    : jsonError(404, "Connect Bitbucket first.");
});
