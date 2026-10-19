"use client";

import { CalendarRange, FileText, GitBranch, MessageSquareText, Mic, Route, Sparkles } from "lucide-react";
import { useId } from "react";
import { FORMAT_OPTIONS } from "@/components/format-options";
import { LogoMark } from "@/components/Logo";
import { SegmentedControl } from "@/components/SegmentedControl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { StandupFormat } from "@/lib/domain/types";

export interface TourDraft {
  githubUsername: string;
  standupFormat: StandupFormat;
}

interface StepProps {
  name: string;
  draft: TourDraft;
  onDraft: (patch: Partial<TourDraft>) => void;
  githubError: string | null;
}

function Kbd({ children }: { children: string }) {
  return <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs">{children}</kbd>;
}

function Welcome({ name }: StepProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <LogoMark className="size-14" />
      <p className="mt-4 text-sm text-muted-foreground">
        Hi {name.split(" ")[0]}, ShipLog turns 30 seconds of talking into the updates you usually type: a clean daily
        log, your standup, a weekly report and a brag doc for appraisals.
      </p>
      <p className="mt-3 text-sm text-muted-foreground">This quick tour sets you up in under a minute.</p>
    </div>
  );
}

function Speak() {
  return (
    <div className="flex flex-col gap-4 text-sm">
      <p className="text-muted-foreground">
        At the end of your day, open <strong className="text-foreground">Today</strong>, click the big box, then hold
        your Wispr Flow key and just talk:
      </p>
      <div className="flex flex-wrap gap-2">
        <span className="flex items-center gap-1.5">
          Mac <Kbd>fn</Kbd>
        </span>
        <span className="flex items-center gap-1.5">
          Windows <Kbd>Ctrl</Kbd> + <Kbd>Win</Kbd>
        </span>
      </div>
      <blockquote className="rounded-md border-l-2 border-foreground bg-muted px-3 py-2 text-muted-foreground italic">
        &ldquo;aaj login bug fix kiya, PR raise kiya, dashboard pe kaam chal raha hai, backend API ready nahi
        hai…&rdquo;
      </blockquote>
      <p className="text-muted-foreground">
        Hinglish, pauses and filler words are fine. ShipLog writes it up as clean English in four sections: Done, In
        progress, Blockers and Tomorrow. Press <Kbd>⌘/Ctrl + Enter</Kbd> to save.
      </p>
    </div>
  );
}

function Github({ draft, onDraft, githubError }: StepProps) {
  const id = useId();
  const errorId = useId();
  return (
    <div className="flex flex-col gap-3 text-sm">
      <p className="text-muted-foreground">
        Add your GitHub username and ShipLog checks your public commits and PRs each day, flagging work you shipped but
        forgot to mention. No GitHub login or token needed. Optional; you can add it later in Settings.
      </p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id}>GitHub username</Label>
        <Input
          id={id}
          value={draft.githubUsername}
          onChange={(e) => onDraft({ githubUsername: e.target.value })}
          placeholder="e.g. octocat"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={githubError ? true : undefined}
          aria-describedby={githubError ? errorId : undefined}
          className="h-10"
        />
        {githubError && (
          <p id={errorId} className="text-xs text-destructive">
            {githubError}
          </p>
        )}
      </div>
    </div>
  );
}

function Format({ draft, onDraft }: StepProps) {
  return (
    <div className="flex flex-col gap-4 text-sm">
      <p className="text-muted-foreground">
        Where do you post your standup? ShipLog formats it so you can paste it straight in.
      </p>
      <SegmentedControl
        legend="Standup format"
        options={FORMAT_OPTIONS}
        value={draft.standupFormat}
        onChange={(standupFormat) => onDraft({ standupFormat })}
      />
    </div>
  );
}

const TOOLS = [
  { icon: FileText, name: "Reports", text: "Standup, weekly report or brag doc from your logs, in one click." },
  { icon: CalendarRange, name: "Timeline", text: "A heatmap of every day you logged, with streaks and stats." },
  {
    icon: Route,
    name: "Journeys",
    text: "Each task from start to shipped: blockers, how they were fixed, your learnings. Tap “Journey” on any item.",
  },
  { icon: MessageSquareText, name: "Ask", text: "“When did I last work on onboarding?”, answered with dates." },
];

function Tools() {
  return (
    <div className="flex flex-col gap-3 text-sm">
      <ul className="flex flex-col gap-2">
        {TOOLS.map(({ icon: Icon, name, text }) => (
          <li key={name} className="flex gap-3 rounded-md border border-border p-3">
            <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              <span className="font-medium">{name}</span>
              <span className="text-muted-foreground"> · {text}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="text-muted-foreground">
        Press <Kbd>⌘K</Kbd> (or <Kbd>Ctrl K</Kbd>) anywhere to jump to any page or action, and <Kbd>?</Kbd> to see all
        shortcuts.
      </p>
    </div>
  );
}

interface TourStep {
  title: string;
  icon: typeof Mic;
  Body: (props: StepProps) => React.ReactNode;
}

export const TOUR_STEPS: readonly TourStep[] = [
  { title: "Welcome to ShipLog", icon: Sparkles, Body: Welcome },
  { title: "Speak your day", icon: Mic, Body: Speak },
  { title: "Connect GitHub", icon: GitBranch, Body: Github },
  { title: "Pick your standup format", icon: MessageSquareText, Body: Format },
  { title: "Your toolkit", icon: FileText, Body: Tools },
];
