import { randomBytes } from "node:crypto";
import { publicRoute } from "@/lib/api/route";
import { hashPassword } from "@/lib/auth/password";
import { sessionCookie } from "@/lib/auth/session";
import { createUser, insertEntries, saveSettings } from "@/lib/db/repo";
import { localDate } from "@/lib/domain/dates";
import { getEnv } from "@/lib/env";
import { jsonError } from "@/lib/security/http";
import { demoEntries } from "@/lib/server/demo-data";
import { demoRequest } from "@/lib/server/schemas";

/**
 * One-tap demo: creates a fresh, isolated account (evaluators never see each other's data).
 * "mock" pre-fills two weeks of sample logs so the timeline, reports and search work immediately;
 * "empty" starts blank so you can try ShipLog with your own day.
 */
export const POST = publicRoute({ body: demoRequest, rateLimit: true }, async ({ body }) => {
  const id = randomBytes(6).toString("hex");
  const user = await createUser({
    email: `demo-${id}@demo.shiplog.dev`,
    name: "Demo Engineer",
    passwordHash: await hashPassword(randomBytes(24).toString("base64url")),
    isDemo: true,
  });
  if (!user) return jsonError(500, "Could not start a demo. Please try again.");

  const env = getEnv();
  await Promise.all([
    body.data === "mock" && insertEntries(user.id, demoEntries(localDate(new Date(), "Asia/Kolkata"))),
    saveSettings(user.id, {
      githubUsername: body.data === "mock" ? (env.DEMO_GITHUB_USERNAME ?? null) : null,
      standupFormat: "slack",
      onboarded: false,
    }),
  ]);

  const session = { id: user.id, name: user.name, email: user.email, isDemo: true };
  return Response.json({ user: session }, { status: 201, headers: { "Set-Cookie": await sessionCookie(session) } });
});
