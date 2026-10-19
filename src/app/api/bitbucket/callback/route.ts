import { z } from "zod";
import { userRoute } from "@/lib/api/route";
import { saveBitbucketConnection } from "@/lib/db/repo";
import { bitbucketConfig, currentUser, exchangeCode } from "@/lib/server/bitbucket";
import { encryptSecret } from "@/lib/server/crypto";
import { verifyOAuthState } from "@/lib/server/oauth-state";

const callbackQuery = z.object({ code: z.string().min(1).max(200), state: z.string().min(1).max(2000) });

/** Bitbucket redirects here after the user approves; tokens are stored encrypted. */
export const GET = userRoute({}, async ({ request, user }) => {
  const settingsUrl = (result: string) => new URL(`/settings?bitbucket=${result}`, request.url).toString();
  const consumer = bitbucketConfig();
  const query = callbackQuery.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!consumer || !query.success) return Response.redirect(settingsUrl("error"), 302);
  if (!(await verifyOAuthState(query.data.state, user.id, "bitbucket-connect"))) {
    return Response.redirect(settingsUrl("expired"), 302);
  }

  try {
    const tokens = await exchangeCode(consumer, query.data.code);
    const account = await currentUser(tokens.accessToken);
    await saveBitbucketConnection(user.id, {
      accountUuid: account.uuid,
      username: account.username,
      sealedAccessToken: encryptSecret(tokens.accessToken),
      sealedRefreshToken: encryptSecret(tokens.refreshToken),
      expiresAt: tokens.expiresAt,
    });
    return Response.redirect(settingsUrl("connected"), 302);
  } catch (error) {
    console.warn("[bitbucket:callback]", error);
    return Response.redirect(settingsUrl("error"), 302);
  }
});
