import { publicRoute } from "@/lib/api/route";
import { clearSessionCookie } from "@/lib/auth/session";

export const POST = publicRoute({}, () =>
  Response.json({ ok: true }, { headers: { "Set-Cookie": clearSessionCookie() } }),
);
