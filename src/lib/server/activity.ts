import "server-only";
import { getGithubConnection, getSettings } from "@/lib/db/repo";
import type { Activity } from "@/lib/domain/types";
import { fetchActivity } from "./github";
import { appConfig, privateActivity } from "./github-app";

interface ActivityResult {
  source: "app" | "public" | null;
  login: string | null;
  activity: Activity[];
}

/**
 * The user's GitHub activity for local dates [from, to]: private + public tracked repos via the
 * GitHub App when connected, otherwise public activity for the saved username.
 */
export async function userActivity(
  userId: string,
  from: string,
  to: string,
  timeZone: string,
): Promise<ActivityResult> {
  const app = appConfig();
  const [conn, settings] = await Promise.all([app ? getGithubConnection(userId) : null, getSettings(userId)]);
  if (app && conn) {
    try {
      return { source: "app", login: conn.login, activity: await privateActivity(app, conn, from, to, timeZone) };
    } catch (error) {
      console.warn("[github-app]", error);
      return { source: "app", login: conn.login, activity: [] };
    }
  }
  if (settings.githubUsername) {
    return {
      source: "public",
      login: settings.githubUsername,
      activity: await fetchActivity(settings.githubUsername, from, to, timeZone),
    };
  }
  return { source: null, login: null, activity: [] };
}
