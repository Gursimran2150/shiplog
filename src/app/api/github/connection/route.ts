import { userRoute } from "@/lib/api/route";
import { deleteGithubConnection } from "@/lib/db/repo";

/** Forgets the installation in ShipLog. (The user can also uninstall the App on GitHub.) */
export const DELETE = userRoute({}, async ({ user }) => {
  await deleteGithubConnection(user.id);
  return new Response(null, { status: 204 });
});
