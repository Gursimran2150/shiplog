"use client";

import { ArrowRight, Database, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export type DemoData = "mock" | "empty";

const OPTIONS = [
  {
    value: "mock",
    Icon: Database,
    title: "Account with mock data",
    body: "18 months of realistic work logs: projects, blockers, reviews and shipped results. Timeline, reports and Ask work right away.",
    badge: "Recommended",
  },
  {
    value: "empty",
    Icon: Sparkles,
    title: "Fresh empty account",
    body: "Start from a blank journal and log your own day by voice.",
    badge: null,
  },
] as const;

interface DemoChooserProps {
  busy: DemoData | null;
  disabled: boolean;
  onPick: (data: DemoData) => void;
}

/** "Try the demo" opens a choice: an account pre-filled with mock data, or a blank one. */
export function DemoChooser({ busy, disabled, onPick }: DemoChooserProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={(next) => busy === null && setOpen(next)}>
      <DialogTrigger asChild>
        <Button type="button" disabled={disabled} className="mt-6 h-11 w-full rounded-full text-sm font-medium">
          Try the demo
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>How do you want to try ShipLog?</DialogTitle>
          <DialogDescription>Both are private test accounts — no sign-up, nobody else sees them.</DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-3">
          {OPTIONS.map(({ value, Icon, title, body, badge }) => (
            <li key={value}>
              <button
                type="button"
                onClick={() => onPick(value)}
                disabled={busy !== null}
                className="group flex w-full cursor-pointer items-start gap-3 rounded-xl border border-border p-4 text-left transition-colors hover:border-foreground/40 hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-wait disabled:opacity-60"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted">
                  {busy === value ? (
                    <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                  ) : (
                    <Icon aria-hidden="true" className="size-4" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2 font-medium">
                    {title}
                    {badge && (
                      <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-normal text-success">
                        {badge}
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">{body}</span>
                </span>
                <ArrowRight
                  aria-hidden="true"
                  className="mt-2.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                />
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
