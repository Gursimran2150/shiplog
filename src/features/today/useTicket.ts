"use client";

import { useCallback, useRef, useState } from "react";
import { api } from "@/lib/api-client";
import type { Ticket } from "@/lib/domain/types";
import { errorMessage } from "./errors";

export type TicketState =
  | { status: "idle" }
  | { status: "loading"; text: string }
  | { status: "ready"; text: string; ticket: Ticket }
  | { status: "error"; text: string; error: string };

/** Drafts a GitHub issue from one blocker/to-do. Stale responses (dialog reopened for another item) are ignored. */
export function useTicket(context: string) {
  const [state, setState] = useState<TicketState>({ status: "idle" });
  const latest = useRef(0);

  const draft = useCallback(
    async (text: string) => {
      const id = ++latest.current;
      setState({ status: "loading", text });
      try {
        const { ticket } = await api.post<{ ticket: Ticket }>("/api/tickets", {
          text: text.slice(0, 500),
          context: context.slice(0, 1500),
        });
        if (id === latest.current) setState({ status: "ready", text, ticket });
      } catch (err) {
        if (id === latest.current) setState({ status: "error", text, error: errorMessage(err) });
      }
    },
    [context],
  );

  const close = useCallback(() => {
    latest.current++;
    setState({ status: "idle" });
  }, []);

  return { state, draft, close };
}
