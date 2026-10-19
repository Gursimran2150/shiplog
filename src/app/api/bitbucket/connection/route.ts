import { userRoute } from "@/lib/api/route";
import { deleteBitbucketConnection } from "@/lib/db/repo";

/** Deletes the stored (encrypted) tokens. The user can also revoke access on bitbucket.org. */
export const DELETE = userRoute({}, async ({ user }) => {
  await deleteBitbucketConnection(user.id);
  return new Response(null, { status: 204 });
});
