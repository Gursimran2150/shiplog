import { z } from "zod";
import { userRoute } from "@/lib/api/route";
import { saveGithubConnection } from "@/lib/db/repo";
import { appConfig, verifyInstallation } from "@/lib/server/github-app";
import { verifyOAuthState } from "@/lib/server/oauth-state";

const callbackQuery = z.object({
  code: z.string().min(1).max(100),
  installation_id: z.coerce.number().int().positive(),
  state: z.string().min(1).max(2000).optional(),
  setup_action: z.string().optional(),
});

/**
 * GitHub redirects here after install. We accept the installation only if (1) the signed state
 * belongs to this session's user and (2) GitHub confirms the same person can access it.
 */
export const GET = userRoute({}, async ({ request, user }) => {
  const settingsUrl = (result: string) => new URL(`/settings?github=${result}`, request.url).toString();
  const app = appConfig();
  const query = callbackQuery.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!app || !query.success) return Response.redirect(settingsUrl("error"), 302);

  const { code, installation_id: installationId, state } = query.data;
  if (!state || !(await verifyOAuthState(state, user.id, "github-install")))
    return Response.redirect(settingsUrl("expired"), 302);

  const login = await verifyInstallation(app, code, installationId).catch(() => null);
  if (!login) return Response.redirect(settingsUrl("denied"), 302);

  await saveGithubConnection(user.id, installationId, login);
  return Response.redirect(settingsUrl("connected"), 302);
});
