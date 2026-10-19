"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { FORMAT_OPTIONS } from "@/components/format-options";
import { SegmentedControl } from "@/components/SegmentedControl";
import { useSettings } from "@/hooks/useData";
import type { StandupFormat } from "@/lib/domain/types";
import { AccountDetails } from "./AccountDetails";
import { GithubForm } from "./GithubForm";
import { SettingsSection } from "./SettingsSection";

function ControlSkeleton() {
  return (
    <div className="flex flex-col gap-2" role="status" aria-label="Loading settings">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-8 w-full max-w-sm" />
    </div>
  );
}

const FORMAT_NAMES: Record<StandupFormat, string> = { slack: "Slack", teams: "Teams", plain: "Plain text" };

export function SettingsView() {
  const { settings, isLoading, save } = useSettings();

  const saveGithub = useCallback(
    (githubUsername: string | null) => save({ ...settings, githubUsername }),
    [save, settings],
  );

  const saveFormat = useCallback(
    async (standupFormat: StandupFormat) => {
      try {
        await save({ ...settings, standupFormat });
        toast.success(`Standups will use ${FORMAT_NAMES[standupFormat]} formatting`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not save. Please try again.");
      }
    },
    [save, settings],
  );

  return (
    <>
      <PageHeader eyebrow="Preferences" title="Settings" />
      <div className="flex flex-col gap-4">
        <SettingsSection
          title="GitHub"
          description="Public commits and PRs only. No GitHub login needed. ShipLog uses them to spot work you forgot to mention."
        >
          {isLoading ? <ControlSkeleton /> : <GithubForm initial={settings.githubUsername} onSave={saveGithub} />}
        </SettingsSection>

        <SettingsSection title="Standup format" description="The default formatting for generated standups.">
          {isLoading ? (
            <ControlSkeleton />
          ) : (
            <SegmentedControl
              legend="Standup format"
              hideLegend
              options={FORMAT_OPTIONS}
              value={settings.standupFormat}
              onChange={(f) => void saveFormat(f)}
            />
          )}
        </SettingsSection>

        <SettingsSection title="Account" description="You're signed in as this user.">
          <AccountDetails />
        </SettingsSection>
      </div>
    </>
  );
}
