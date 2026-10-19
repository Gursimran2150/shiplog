"use client";

import { Lock } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { RepoAccess } from "@/lib/domain/types";

interface RepoTrackerProps {
  repos: RepoAccess[] | null;
  isLoading: boolean;
  failed: boolean;
  emptyHint: string;
  setExcluded: (excluded: string[]) => Promise<void>;
}

/** Include/exclude list for one provider's repos, with bulk actions and a filter for long lists. */
export function RepoTracker({ repos, isLoading, failed, emptyHint, setExcluded }: RepoTrackerProps) {
  const [filter, setFilter] = useState("");
  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return (repos ?? []).filter((r) => !q || r.fullName.toLowerCase().includes(q));
  }, [repos, filter]);

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (failed || !repos) return <p className="text-sm text-destructive">Couldn&rsquo;t load your repositories.</p>;
  if (!repos.length) return <p className="text-sm text-muted-foreground">{emptyHint}</p>;

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
          <Button variant="ghost" size="sm" onClick={() => void save([])}>
            Track all
          </Button>
          <Button variant="ghost" size="sm" onClick={() => void save(repos.map((r) => r.fullName))}>
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
