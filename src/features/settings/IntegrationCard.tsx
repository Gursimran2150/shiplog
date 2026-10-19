"use client";

import { ExternalLink, Plug, Unplug } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useIntegration, useIntegrationRepos } from "@/hooks/useData";
import type { Integration } from "@/lib/domain/types";
import { RepoTracker } from "./RepoTracker";

interface ProviderCopy {
  name: string;
  connectHref: string;
  pitch: string;
  manageLabel: string;
  emptyHint: string;
}

const PROVIDERS: Record<Integration, ProviderCopy> = {
  github: {
    name: "GitHub",
    connectHref: "/api/github/install",
    pitch:
      "Install the ShipLog GitHub App on your account or organization. It gets read-only access (commits, pull requests, metadata) to only the repos you pick on GitHub.",
    manageLabel: "Manage access on GitHub",
    emptyHint: "No repositories granted yet. Use “Manage access on GitHub” to add some.",
  },
  bitbucket: {
    name: "Bitbucket",
    connectHref: "/api/bitbucket/connect",
    pitch:
      "Authorize ShipLog on bitbucket.org with read-only access to your repositories and pull requests. Tokens are stored encrypted.",
    manageLabel: "Manage authorization on Bitbucket",
    emptyHint: "No repositories found for this Bitbucket account.",
  },
};

const RESULT_TOASTS: Record<string, (name: string) => void> = {
  connected: (n) => toast.success(`${n} connected. Choose which repos to track below.`),
  denied: (n) => toast.error(`${n} didn't confirm you can access that installation.`),
  expired: () => toast.error("That connect link expired. Please try again."),
  error: (n) => toast.error(`Couldn't connect ${n}. Please try again.`),
};

/** Shows the outcome of the connect redirect (?github=… / ?bitbucket=…) once, then cleans the URL. */
function useConnectResult(provider: Integration, name: string) {
  useEffect(() => {
    const url = new URL(window.location.href);
    const result = url.searchParams.get(provider);
    if (!result) return;
    RESULT_TOASTS[result]?.(name);
    url.searchParams.delete(provider);
    window.history.replaceState(null, "", url);
  }, [provider, name]);
}

/** Connect / disconnect a code host and choose which of its repos ShipLog tracks. */
export function IntegrationCard({ provider }: { provider: Integration }) {
  const copy = PROVIDERS[provider];
  useConnectResult(provider, copy.name);
  const { status, isLoading, disconnect } = useIntegration(provider);
  const repos = useIntegrationRepos(provider, Boolean(status?.connected));

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-medium">{copy.name}</h3>
        {status?.connected && <p className="text-sm text-muted-foreground">Connected as @{status.login}</p>}
      </div>

      {isLoading || !status ? (
        <Skeleton className="h-16 w-full" />
      ) : !status.enabled ? (
        <p className="text-sm text-muted-foreground">{copy.name} isn&rsquo;t enabled on this deployment yet.</p>
      ) : !status.connected ? (
        <div className="flex flex-col gap-3 text-sm">
          <p className="text-muted-foreground">{copy.pitch}</p>
          <Button asChild className="self-start">
            {/* Server route: signs a one-time state, then redirects to the provider's consent screen. */}
            <a href={copy.connectHref}>
              <Plug aria-hidden="true" /> Connect {copy.name}
            </a>
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {status.manageUrl && (
              <Button asChild variant="outline" size="sm">
                <a href={status.manageUrl} target="_blank" rel="noopener noreferrer">
                  {copy.manageLabel} <ExternalLink aria-hidden="true" />
                  <span className="sr-only">(opens in new tab)</span>
                </a>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                disconnect().then(
                  () => toast.success(`${copy.name} disconnected.`),
                  () => toast.error("Couldn't disconnect. Please try again."),
                )
              }
            >
              <Unplug aria-hidden="true" /> Disconnect
            </Button>
          </div>
          <RepoTracker {...repos} emptyHint={copy.emptyHint} />
        </>
      )}
    </div>
  );
}
