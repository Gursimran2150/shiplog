import { publicRoute } from "@/lib/api/route";
import { verifyPassword } from "@/lib/auth/password";
import { loginSchema } from "@/lib/auth/schemas";
import { sessionCookie } from "@/lib/auth/session";
import { findUserByEmail } from "@/lib/db/repo";
import { jsonError } from "@/lib/security/http";

export const POST = publicRoute({ rateLimit: true, body: loginSchema }, async ({ body }) => {
  const user = await findUserByEmail(body.email);
  // Same message for unknown email and wrong password, so accounts can't be enumerated.
  if (!user || !(await verifyPassword(body.password, user.password_hash))) {
    return jsonError(401, "Email or password is incorrect.");
  }
  const session = { id: user.id, name: user.name, email: user.email, isDemo: user.is_demo };
  return Response.json({ user: session }, { headers: { "Set-Cookie": await sessionCookie(session) } });
});
