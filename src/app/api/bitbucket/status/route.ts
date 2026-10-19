import { NO_STORE, userRoute } from "@/lib/api/route";
import { getBitbucketConnection } from "@/lib/db/repo";
import type { IntegrationStatus } from "@/lib/domain/types";
import { bitbucketConfig } from "@/lib/server/bitbucket";

export const GET = userRoute({}, async ({ user }) => {
  const consumer = bitbucketConfig();
  const conn = consumer ? await getBitbucketConnection(user.id) : null;
  const status: IntegrationStatus = {
    enabled: Boolean(consumer),
    connected: Boolean(conn),
    login: conn?.username ?? null,
    manageUrl: conn ? "https://bitbucket.org/account/settings/app-authorizations/" : null,
  };
  return Response.json(status, { headers: NO_STORE });
});
