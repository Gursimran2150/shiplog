"use client";

import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useSession, useSettings } from "@/hooks/useData";
import { githubUsernameError, normalizeGithubUsername } from "@/lib/domain/github-username";
import type { Settings } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { TOUR_STEPS, type TourDraft } from "./steps";
import { tourStore } from "@/lib/tour-store";

const GITHUB_STEP = TOUR_STEPS.findIndex((s) => s.title === "Connect GitHub");

/**
 * First-run tour: shown once per account (until finished or skipped), replayable from the
 * user menu or ⌘K. It also sets the account up: GitHub username and standup format.
 */
export function OnboardingTour() {
  const { user } = useSession();
  const { settings, isLoading, save } = useSettings();
  const replay = useSyncExternalStore(tourStore.subscribe, tourStore.getSnapshot, tourStore.getServerSnapshot);
  const [dismissed, setDismissed] = useState(false);

  const firstRun = !isLoading && !settings.onboarded && !dismissed;
  const open = Boolean(user) && (firstRun || replay);

  // Closing the dialog also fires onOpenChange(false); without this guard that second call
  // would save the pre-tour settings over the ones the user just chose.
  const finished = useRef(false);
  useEffect(() => {
    if (open) finished.current = false;
  }, [open]);

  async function finish(next: Settings) {
    if (finished.current) return;
    finished.current = true;
    setDismissed(true);
    tourStore.close();
    try {
      await save({ ...next, onboarded: true });
    } catch {
      toast.error("Couldn't save your setup. You can change it any time in Settings.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && void finish(settings)}>
      {open && user && (
        // Remount per opening so the tour always starts at step 1 with fresh values.
        <TourContent
          key={String(replay)}
          name={user.name}
          initial={{ githubUsername: settings.githubUsername ?? "", standupFormat: settings.standupFormat }}
          onSkip={() => void finish(settings)}
          onDone={(draft) =>
            void finish({
              ...settings,
              githubUsername: normalizeGithubUsername(draft.githubUsername) || null,
              standupFormat: draft.standupFormat,
            }).then(() => toast.success("You're all set. Talk about your day to log it."))
          }
        />
      )}
    </Dialog>
  );
}

function TourContent({
  name,
  initial,
  onSkip,
  onDone,
}: {
  name: string;
  initial: TourDraft;
  onSkip: () => void;
  onDone: (draft: TourDraft) => void;
}) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(initial);
  const { title, icon: Icon, Body } = TOUR_STEPS[step];
  const last = step === TOUR_STEPS.length - 1;
  const githubError = githubUsernameError(draft.githubUsername);
  const blocked = step === GITHUB_STEP && Boolean(githubError);

  return (
    <DialogContent className="gap-0 p-0 sm:max-w-lg" showCloseButton={false}>
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <p className="eyebrow">
          Step {step + 1} of {TOUR_STEPS.length}
        </p>
        <Button variant="ghost" size="sm" onClick={onSkip}>
          Skip tour
        </Button>
      </div>
      <div className="px-6 pt-6 pb-2">
        <DialogTitle className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          {step > 0 && <Icon className="size-5" aria-hidden="true" />}
          {title}
        </DialogTitle>
        <DialogDescription className="sr-only">ShipLog setup tour</DialogDescription>
        <div className="mt-4 min-h-48">
          <Body
            name={name}
            draft={draft}
            onDraft={(p) => setDraft((d) => ({ ...d, ...p }))}
            githubError={githubError}
          />
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-border px-6 py-4">
        <ol className="flex gap-1.5" aria-label="Tour progress">
          {TOUR_STEPS.map((s, i) => (
            <li
              key={s.title}
              aria-current={i === step ? "step" : undefined}
              className={cn("h-1.5 w-5 rounded-full bg-border", i <= step && "bg-foreground")}
            >
              <span className="sr-only">{s.title}</span>
            </li>
          ))}
        </ol>
        <div className="flex gap-2">
          {step > 0 && (
            <Button variant="outline" size="sm" onClick={() => setStep(step - 1)}>
              <ArrowLeft aria-hidden="true" /> Back
            </Button>
          )}
          {last ? (
            <Button size="sm" onClick={() => onDone(draft)}>
              <Check aria-hidden="true" /> Start logging
            </Button>
          ) : (
            <Button size="sm" onClick={() => setStep(step + 1)} disabled={blocked}>
              Next <ArrowRight aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>
    </DialogContent>
  );
}
