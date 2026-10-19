import { publicRoute } from "@/lib/api/route";
import { hashPassword } from "@/lib/auth/password";
import { signupSchema } from "@/lib/auth/schemas";
import { sessionCookie } from "@/lib/auth/session";
import { createUser } from "@/lib/db/repo";
import { jsonError } from "@/lib/security/http";

export const POST = publicRoute({ rateLimit: true, body: signupSchema }, async ({ body }) => {
  const user = await createUser({ ...body, passwordHash: await hashPassword(body.password) });
  if (!user) return jsonError(409, "An account with this email already exists. Please log in.");

  const session = { id: user.id, name: user.name, email: user.email, isDemo: false };
  return Response.json({ user: session }, { status: 201, headers: { "Set-Cookie": await sessionCookie(session) } });
});
