"use client";

import { ExternalLink, GitBranch, Lock, Unplug } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGithubConnection, useGithubRepos } from "@/hooks/useData";

const CALLBACK_MESSAGES: Record<string, () => void> = {
  connected: () => toast.success("GitHub connected. Choose which repos to track below."),
  denied: () => toast.error("GitHub didn't confirm you can access that installation."),
  expired: () => toast.error("That connect link expired. Please try again."),
  error: () => toast.error("Couldn't connect GitHub. Please try again."),
};

/** Reads ?github=… once after the install redirect, shows the outcome, and cleans the URL. */
function useCallbackToast() {
  useEffect(() => {
    const url = new URL(window.location.href);
    const result = url.searchParams.get("github");
    if (!result) return;
    CALLBACK_MESSAGES[result]?.();
    url.searchParams.delete("github");
    window.history.replaceState(null, "", url);
  }, []);
}

/** Private-repo access through the ShipLog GitHub App, with per-repo include/exclude. */
export function GithubIntegration() {
  useCallbackToast();
  const { status, isLoading, disconnect } = useGithubConnection();

  if (isLoading || !status) return <Skeleton className="h-24 w-full" />;
  if (!status.appEnabled) {
    return (
      <p className="text-sm text-muted-foreground">Private repositories aren&rsquo;t enabled on this deployment.</p>
    );
  }
  if (!status.connected) {
    return (
      <div className="flex flex-col gap-3 text-sm">
        <p className="text-muted-foreground">
          Install the ShipLog GitHub App to include private and company repositories. It has read-only access (commits,
          pull requests, metadata) to the repos you choose on GitHub, and you can exclude any of them here.
        </p>
        <Button asChild className="self-start">
          {/* Server route: signs a one-time state, then redirects to GitHub's install screen. */}
          <a href="/api/github/install">
            <GitBranch aria-hidden="true" /> Connect private repos
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm">
          <GitBranch className="size-4" aria-hidden="true" />
          Connected as <span className="font-medium">@{status.login}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {status.manageUrl && (
            <Button asChild variant="outline" size="sm">
              <a href={status.manageUrl} target="_blank" rel="noopener noreferrer">
                Manage access on GitHub <ExternalLink aria-hidden="true" />
                <span className="sr-only">(opens in new tab)</span>
              </a>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              disconnect().then(
                () => toast.success("Disconnected. You can also uninstall the App on GitHub."),
                () => toast.error("Couldn't disconnect. Please try again."),
              )
            }
          >
            <Unplug aria-hidden="true" /> Disconnect
          </Button>
        </div>
      </div>
      <RepoList />
    </div>
  );
}

function RepoList() {
  const { repos, isLoading, failed, setExcluded } = useGithubRepos(true);
  const [filter, setFilter] = useState("");
  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return (repos ?? []).filter((r) => !q || r.fullName.toLowerCase().includes(q));
  }, [repos, filter]);

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (failed || !repos) return <p className="text-sm text-destructive">Couldn&rsquo;t load your repositories.</p>;
  if (!repos.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No repositories granted yet. Use &ldquo;Manage access on GitHub&rdquo; to add some.
      </p>
    );
  }

  const trackedCount = repos.filter((r) => r.tracked).length;
  const save = (excluded: string[]) =>
    setExcluded(excluded).catch(() => toast.error("Couldn't save your repo selection. Please try again."));
  const toggle = (fullName: string, track: boolean) =>
    save(repos.filter((r) => (r.fullName === fullName ? !track : !r.tracked)).map((r) => r.fullName));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="eyebrow">
          Tracking {trackedCount} of {repos.length} repos
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => save([])}>
            Track all
          </Button>
          <Button variant="ghost" size="sm" onClick={() => save(repos.map((r) => r.fullName))}>
            Track none
          </Button>
        </div>
      </div>
      {repos.length > 8 && (
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter repositories"
          aria-label="Filter repositories"
          className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      )}
      <ul className="max-h-80 divide-y divide-border overflow-y-auto rounded-md border border-border">
        {visible.map((r) => (
          <li key={r.fullName} className="flex items-center justify-between gap-3 px-3 py-2">
            <span className="flex min-w-0 items-center gap-2 text-sm">
              <span className="truncate font-mono">{r.fullName}</span>
              {r.private && (
                <Badge variant="outline" className="gap-1 font-normal">
                  <Lock className="size-3" aria-hidden="true" /> Private
                </Badge>
              )}
            </span>
            <TrackSwitch name={r.fullName} checked={r.tracked} onChange={(v) => void toggle(r.fullName, v)} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Accessible on/off switch (native checkbox with role="switch"). */
function TrackSwitch({ name, checked, onChange }: { name: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="relative inline-flex shrink-0 items-center">
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={`Track ${name}`}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="h-5 w-9 rounded-full bg-input transition-colors peer-checked:bg-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-background after:transition-transform peer-checked:after:translate-x-4"
      />
    </label>
  );
}
