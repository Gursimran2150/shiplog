import "server-only";
import { getGithubConnection, getSettings } from "@/lib/db/repo";
import type { Activity } from "@/lib/domain/types";
import { bitbucketActivity } from "./bitbucket";
import { bitbucketSession } from "./bitbucket-session";
import { fetchActivity } from "./github";
import { appConfig, privateActivity } from "./github-app";

interface ActivityResult {
  login: string | null;
  activity: Activity[];
}

/** Never let one provider's outage hide the others' activity. */
async function safely(label: string, run: () => Promise<Activity[]>): Promise<Activity[]> {
  try {
    return await run();
  } catch (error) {
    console.warn(`[${label}]`, error);
    return [];
  }
}

/**
 * All of the user's code activity for local dates [from, to], fetched in parallel:
 * GitHub (private + public via the App, or public-only via the saved username) and Bitbucket.
 */
export async function userActivity(
  userId: string,
  from: string,
  to: string,
  timeZone: string,
): Promise<ActivityResult> {
  const app = appConfig();
  const [githubConn, settings, bitbucket] = await Promise.all([
    app ? getGithubConnection(userId) : null,
    getSettings(userId),
    bitbucketSession(userId).catch((error: unknown) => {
      console.warn("[bitbucket-session]", error);
      return null;
    }),
  ]);

  const githubLogin = githubConn?.login ?? settings.githubUsername;
  const [github, bb] = await Promise.all([
    app && githubConn
      ? safely("github-app", () => privateActivity(app, githubConn, from, to, timeZone))
      : settings.githubUsername
        ? fetchActivity(settings.githubUsername, from, to, timeZone)
        : Promise.resolve([]),
    bitbucket
      ? safely("bitbucket", () => bitbucketActivity(bitbucket.token, bitbucket, from, to, timeZone))
      : Promise.resolve([]),
  ]);

  return { login: githubLogin ?? bitbucket?.username ?? null, activity: [...github, ...bb] };
}
