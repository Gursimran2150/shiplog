import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/token";

/**
 * Optimistic page guard: logged-out visitors go to /login, logged-in ones skip it.
 * API routes authorise themselves (requireUser), so this is not the only check.
 */
export async function proxy(request: NextRequest) {
  const secret = process.env.AUTH_SECRET;
  const user = secret ? await verifySession(request.cookies.get(SESSION_COOKIE)?.value, secret) : null;
  const onLogin = request.nextUrl.pathname === "/login";

  if (!user && !onLogin) return NextResponse.redirect(new URL("/login", request.url));
  if (user && onLogin) return NextResponse.redirect(new URL("/", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon|apple-icon|.*\\.(?:png|svg|ico|webmanifest)$).*)"],
};
