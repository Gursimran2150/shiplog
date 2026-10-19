import { NO_STORE, userRoute } from "@/lib/api/route";
import { getGithubConnection } from "@/lib/db/repo";
import type { IntegrationStatus } from "@/lib/domain/types";
import { appConfig } from "@/lib/server/github-app";

export const GET = userRoute({}, async ({ user }) => {
  const app = appConfig();
  const conn = app ? await getGithubConnection(user.id) : null;
  const status: IntegrationStatus = {
    enabled: Boolean(app),
    connected: Boolean(conn),
    login: conn?.login ?? null,
    manageUrl: conn ? `https://github.com/settings/installations/${conn.installationId}` : null,
  };
  return Response.json(status, { headers: NO_STORE });
});
