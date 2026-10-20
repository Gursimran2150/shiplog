"use client";

import { Download, FileWarning, RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { StreamPanel } from "@/components/StreamPanel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { downloadMarkdown } from "@/features/reports/download";
import { useStreamingText } from "@/hooks/useStreamingText";

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);

interface PostmortemDialogProps {
  taskId: string;
  title: string;
  today: string;
  onClose: () => void;
}

/** A blameless postmortem drafted from the task's journey and notes, streamed as it's written. */
export function PostmortemDialog({ taskId, title, today, onClose }: PostmortemDialogProps) {
  const { text, status, error, run, stop, isStreaming } = useStreamingText(`/api/tasks/${taskId}/postmortem`);

  useEffect(() => {
    void run({ today });
  }, [run, today]);
  useEffect(() => stop, [stop]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[90dvh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileWarning aria-hidden="true" className="size-4" />
            Postmortem draft
          </DialogTitle>
          <DialogDescription>
            Written only from this task&apos;s logs and notes. Anything not recorded is marked, not guessed.
          </DialogDescription>
        </DialogHeader>
        <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
          <StreamPanel
            text={text}
            status={status}
            error={error}
            label="Postmortem"
            emptyHint="Reading the journey…"
            actions={
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadMarkdown(text, `postmortem-${slug(title) || "task"}.md`)}
                >
                  <Download aria-hidden="true" /> Download .md
                </Button>
                <Button variant="ghost" size="sm" onClick={() => void run({ today })} disabled={isStreaming}>
                  <RefreshCw aria-hidden="true" /> Redraft
                </Button>
              </>
            }
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
