"use client";

import { RefreshCw, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { SegmentedControl } from "@/components/SegmentedControl";
import { StreamPanel } from "@/components/StreamPanel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStreamingText } from "@/hooks/useStreamingText";

type Tone = "friendly" | "firm";
const TONES: readonly { value: Tone; label: string }[] = [
  { value: "friendly", label: "Friendly" },
  { value: "firm", label: "Firm" },
];

interface NudgeDialogProps {
  taskId: string;
  person: string | null;
  blocker: string;
  today: string;
  onClose: () => void;
}

/**
 * Drafts a follow-up message for a blocker as soon as it opens. Change the tone to redraft.
 * ShipLog never sends anything: the engineer copies it into Slack or Teams themselves.
 */
export function NudgeDialog({ taskId, person, blocker, today, onClose }: NudgeDialogProps) {
  const [tone, setTone] = useState<Tone>("friendly");
  const { text, status, error, run, stop, isStreaming } = useStreamingText("/api/waiting/nudge");

  useEffect(() => {
    void run({ taskId, tone, today });
  }, [run, taskId, tone, today]);
  useEffect(() => stop, [stop]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send aria-hidden="true" className="size-4" />
            {person ? `Nudge ${person}` : "Draft a follow-up"}
          </DialogTitle>
          <DialogDescription className="line-clamp-2">{blocker}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <SegmentedControl
            legend="Tone"
            hideLegend
            options={TONES}
            value={tone}
            onChange={setTone}
            disabled={isStreaming}
          />
          <Button variant="ghost" size="sm" onClick={() => void run({ taskId, tone, today })} disabled={isStreaming}>
            <RefreshCw aria-hidden="true" />
            Redraft
          </Button>
        </div>
        <StreamPanel
          text={text}
          status={status}
          error={error}
          label="Nudge message"
          emptyHint="Drafting a short message…"
        />
        <p className="text-xs text-muted-foreground">
          Written from your logs on this task. Copy it into Slack or Teams; ShipLog never sends messages for you.
        </p>
      </DialogContent>
    </Dialog>
  );
}
