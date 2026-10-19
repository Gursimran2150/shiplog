"use client";

import { GitCommitHorizontal, GitPullRequest } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useActivity } from "@/hooks/useData";
import { safeGithubUrl } from "./github-links";

/** Today's public commits and PRs, so the user can jog their memory before dictating. */
export function GithubActivityPanel({ today, timeZone }: { today: string | null; timeZone: string | null }) {
  const { githubUsername, activity, isLoading } = useActivity(today, timeZone);

  return (
    <section aria-labelledby="github-today-heading" aria-busy={isLoading} className="surface p-4">
      <h2 id="github-today-heading" className="eyebrow">
        Today on GitHub
      </h2>
      {isLoading ? (
        <div role="status" aria-label="Loading GitHub activity" className="mt-3 flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-2.5">
              <Skeleton className="size-4 shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-3 w-5/12" />
                <Skeleton className="h-3.5 w-11/12" />
              </div>
            </div>
          ))}
        </div>
      ) : !githubUsername ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Add your GitHub username in{" "}
          <Link href="/settings" className="text-link underline-offset-4 hover:underline">
            Settings
          </Link>{" "}
          to cross-check your log against your commits.
        </p>
      ) : activity.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No public commits or PRs yet today.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {activity.map((a) => {
            const Icon = a.kind === "pr" ? GitPullRequest : GitCommitHorizontal;
            const href = safeGithubUrl(a.url);
            return (
              <li key={a.url} className="flex gap-2.5 text-sm">
                <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    <span className="sr-only">{a.kind === "pr" ? "Pull request in " : "Commit in "}</span>
                    {a.repo}
                  </p>
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="line-clamp-2 rounded-sm break-words hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      {a.title}
                    </a>
                  ) : (
                    <p className="line-clamp-2 break-words">{a.title}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
