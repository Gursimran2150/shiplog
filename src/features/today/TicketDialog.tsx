"use client";

import { Check, Copy, ExternalLink } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useCopy } from "@/hooks/useAnswerActions";
import type { Ticket } from "@/lib/domain/types";
import { buildIssueUrl, isValidRepo, ticketToText } from "./github-links";
import type { TicketState } from "./useTicket";

interface TicketDialogProps {
  state: TicketState;
  onClose: () => void;
  onRetry: (text: string) => void;
}

/** Shows the AI-drafted GitHub issue with Copy and an optional prefilled "Open in GitHub" link. */
export function TicketDialog({ state, onClose, onRetry }: TicketDialogProps) {
  return (
    <Dialog open={state.status !== "idle"} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a ticket</DialogTitle>
          <DialogDescription>{state.status === "idle" ? "" : `From: “${state.text}”`}</DialogDescription>
        </DialogHeader>
        <div aria-live="polite" aria-busy={state.status === "loading"}>
          {state.status === "loading" && (
            <div role="status" aria-label="Drafting ticket" className="flex flex-col gap-2.5">
              <Skeleton className="h-4 w-8/12" />
              <Skeleton className="h-3.5 w-11/12" />
              <Skeleton className="h-3.5 w-10/12" />
              <Skeleton className="h-3.5 w-6/12" />
            </div>
          )}
          {state.status === "error" && (
            <div role="alert" className="flex flex-col items-start gap-3 text-sm text-destructive">
              {state.error}
              <Button variant="outline" size="sm" onClick={() => onRetry(state.text)}>
                Try again
              </Button>
            </div>
          )}
          {state.status === "ready" && <TicketDraft ticket={state.ticket} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TicketDraft({ ticket }: { ticket: Ticket }) {
  const repoId = useId();
  const repoHintId = useId();
  const [repo, setRepo] = useState("");
  const text = useMemo(() => ticketToText(ticket), [ticket]);
  const { copied, copy } = useCopy(text);
  const issueUrl = useMemo(() => buildIssueUrl(repo, ticket), [repo, ticket]);
  const repoInvalid = repo.trim() !== "" && !isValidRepo(repo);

  return (
    <div className="flex flex-col gap-4">
      <div className="surface max-h-72 overflow-y-auto p-4">
        <h3 className="font-semibold tracking-[-0.02em]">{ticket.title}</h3>
        {ticket.labels.length > 0 && (
          <ul aria-label="Labels" className="mt-2 flex flex-wrap gap-1.5">
            {ticket.labels.map((label) => (
              <li key={label}>
                <Badge variant="secondary" className="font-mono text-[11px]">
                  {label}
                </Badge>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-sm whitespace-pre-wrap text-muted-foreground">{ticket.body}</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={repoId}>GitHub repo (optional)</Label>
        <Input
          id={repoId}
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          placeholder="owner/repo"
          autoComplete="off"
          spellCheck={false}
          aria-describedby={repoHintId}
          aria-invalid={repoInvalid || undefined}
          className="font-mono max-sm:h-11"
        />
        <p id={repoHintId} className={repoInvalid ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
          {repoInvalid ? "Use the owner/repo format, e.g. acme/web." : "Add a repo to open a prefilled GitHub issue."}
        </p>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={copy} className="max-sm:h-11">
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {copied ? "Copied" : "Copy"}
        </Button>
        {issueUrl ? (
          <Button asChild className="max-sm:h-11">
            <a href={issueUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink aria-hidden="true" />
              Open in GitHub
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </Button>
        ) : (
          <Button disabled className="max-sm:h-11">
            <ExternalLink aria-hidden="true" />
            Open in GitHub
          </Button>
        )}
        <span role="status" className="sr-only">
          {copied ? "Ticket copied to clipboard" : ""}
        </span>
      </DialogFooter>
    </div>
  );
}
