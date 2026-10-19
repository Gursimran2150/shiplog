import { userRoute } from "@/lib/api/route";
import { clearSessionCookie } from "@/lib/auth/session";
import { deleteUser } from "@/lib/db/repo";

/** Permanently deletes the account and everything in it, then ends the session. */
export const DELETE = userRoute({ rateLimit: true }, async ({ user }) => {
  await deleteUser(user.id);
  return new Response(null, { status: 204, headers: { "Set-Cookie": clearSessionCookie() } });
});
