import { publicRoute } from "@/lib/api/route";
import { verifyPassword } from "@/lib/auth/password";
import { loginSchema } from "@/lib/auth/schemas";
import { sessionCookie } from "@/lib/auth/session";
import { findUserByEmail, insertEntries, recentEntries } from "@/lib/db/repo";
import { localDate } from "@/lib/domain/dates";
import { jsonError } from "@/lib/security/http";
import { demoEntries } from "@/lib/server/demo-data";

export const POST = publicRoute({ rateLimit: true, body: loginSchema }, async ({ body }) => {
  const user = await findUserByEmail(body.email);
  // Same message for unknown email and wrong password, so accounts can't be enumerated.
  if (!user || !(await verifyPassword(body.password, user.password_hash))) {
    return jsonError(401, "Email or password is incorrect.");
  }
  // The shared demo login comes with the same sample journal as one-tap demos.
  if (user.is_demo && !(await recentEntries(user.id, 1)).length) {
    await insertEntries(user.id, demoEntries(localDate(new Date(), "Asia/Kolkata")));
  }
  const session = { id: user.id, name: user.name, email: user.email, isDemo: user.is_demo };
  return Response.json({ user: session }, { headers: { "Set-Cookie": await sessionCookie(session) } });
});
