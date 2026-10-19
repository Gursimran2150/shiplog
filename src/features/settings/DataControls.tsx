"use client";

import { Download, Loader2, Trash2 } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api-client";
import { hardNavigate } from "@/lib/navigation";

const CONFIRM_WORD = "DELETE";

/** Export the journal as Markdown, or permanently delete the account (typed confirmation). */
export function DataControls() {
  const confirmId = useId();
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function deleteAccount() {
    setDeleting(true);
    try {
      await api.delete("/api/account");
      hardNavigate("/login");
    } catch {
      setDeleting(false);
      toast.error("Could not delete your account. Please try again.");
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <Button asChild variant="outline">
        {/* A plain link: the browser downloads the server's Markdown response directly. */}
        <a href="/api/export" download>
          <Download aria-hidden="true" /> Export journal (.md)
        </a>
      </Button>

      <Dialog onOpenChange={() => setConfirm("")}>
        <DialogTrigger asChild>
          <Button variant="outline" className="text-destructive hover:text-destructive">
            <Trash2 aria-hidden="true" /> Delete account
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>Delete your account?</DialogTitle>
          <DialogDescription>
            This permanently deletes your account, every journal entry and every saved report. It can&rsquo;t be undone.
            Export your journal first if you want to keep it.
          </DialogDescription>
          <div className="mt-2 flex flex-col gap-1.5">
            <Label htmlFor={confirmId}>
              Type <span className="font-mono">{CONFIRM_WORD}</span> to confirm
            </Label>
            <Input
              id={confirmId}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="off"
              className="h-10"
            />
          </div>
          <Button
            variant="destructive"
            disabled={confirm !== CONFIRM_WORD || deleting}
            onClick={() => void deleteAccount()}
          >
            {deleting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Permanently delete
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
