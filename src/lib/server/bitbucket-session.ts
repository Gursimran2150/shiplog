import "server-only";
import { getBitbucketConnection, saveBitbucketConnection } from "@/lib/db/repo";
import { bitbucketConfig, refreshTokens } from "./bitbucket";
import { decryptSecret, encryptSecret } from "./crypto";

interface BitbucketSession {
  token: string;
  uuid: string;
  username: string;
  excluded: string[];
}

const REFRESH_MARGIN_MS = 5 * 60_000;

/**
 * A usable Bitbucket access token for the user, refreshing (and re-encrypting) it when it is
 * within 5 minutes of expiry. Null when not connected or the consumer isn't configured.
 */
export async function bitbucketSession(userId: string): Promise<BitbucketSession | null> {
  const consumer = bitbucketConfig();
  const stored = consumer ? await getBitbucketConnection(userId) : null;
  if (!consumer || !stored) return null;

  let token = decryptSecret(stored.sealedAccessToken);
  if (stored.expiresAt.getTime() - Date.now() < REFRESH_MARGIN_MS) {
    const fresh = await refreshTokens(consumer, decryptSecret(stored.sealedRefreshToken));
    await saveBitbucketConnection(userId, {
      accountUuid: stored.accountUuid,
      username: stored.username,
      sealedAccessToken: encryptSecret(fresh.accessToken),
      sealedRefreshToken: encryptSecret(fresh.refreshToken),
      expiresAt: fresh.expiresAt,
    });
    token = fresh.accessToken;
  }
  return { token, uuid: stored.accountUuid, username: stored.username, excluded: stored.excluded };
}
