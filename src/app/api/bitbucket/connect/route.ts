import { userRoute } from "@/lib/api/route";
import { jsonError } from "@/lib/security/http";
import { authorizeUrl, bitbucketConfig } from "@/lib/server/bitbucket";
import { signOAuthState } from "@/lib/server/oauth-state";

/** Starts Bitbucket OAuth: the user approves read-only access on bitbucket.org. */
export const GET = userRoute({}, async ({ user }) => {
  const consumer = bitbucketConfig();
  if (!consumer) return jsonError(404, "Bitbucket is not configured on this server.");
  return Response.redirect(authorizeUrl(consumer, await signOAuthState(user.id, "bitbucket-connect")), 302);
});
