"use client";

import { Pencil, Ticket, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { JourneyLink } from "@/features/journeys/JourneyLink";
import { MoveToTask } from "@/features/journeys/MoveToTask";
import type { Entry, LogItem, Section } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { ItemInput } from "./ItemInput";
import { ProjectBadge } from "./ProjectBadge";
import { TOUCH_TARGET } from "./touch";

interface EditableItemProps {
  item: LogItem;
  /** Where the item lives, for "Move to task". */
  entryId: string;
  section: Section;
  index: number;
  onLinked: (entry: Entry) => void;
  ticketable: boolean;
  onCreateTicket: (text: string) => void;
  onSave: (text: string) => void;
  onRemove: () => void;
}

const ICON_BUTTON = cn("text-muted-foreground", TOUCH_TARGET);

/**
 * A structured log item with edit / remove controls, its task journey link and "Move" (fix the
 * AI's task link), and on blockers and to-dos, "Create ticket".
 */
export function EditableItem({
  item,
  entryId,
  section,
  index,
  onLinked,
  ticketable,
  onCreateTicket,
  onSave,
  onRemove,
}: EditableItemProps) {
  const [editing, setEditing] = useState(false);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const wasEditing = useRef(false);

  // Return focus to the pencil after saving or cancelling, so keyboard users don't lose their place.
  useEffect(() => {
    if (wasEditing.current && !editing) editButtonRef.current?.focus();
    wasEditing.current = editing;
  }, [editing]);

  if (editing) {
    return (
      <li className="text-sm">
        <ItemInput
          initial={item.text}
          label={`Edit item: ${item.text}`}
          submitLabel="Save item"
          onSubmit={(text) => {
            setEditing(false);
            onSave(text);
          }}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-1.5 text-sm">
      <span className="leading-snug break-words">{item.text}</span>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <ProjectBadge project={item.project} />
        {item.taskId && <JourneyLink taskId={item.taskId} text={item.text} />}
        <MoveToTask entryId={entryId} section={section} index={index} item={item} onMoved={onLinked} />
        {ticketable && (
          <Button
            variant="ghost"
            size="xs"
            data-ticket=""
            className={ICON_BUTTON}
            onClick={() => onCreateTicket(item.text)}
            aria-label={`Create ticket: ${item.text}`}
          >
            <Ticket aria-hidden="true" />
            Create ticket
          </Button>
        )}
        <div className="ml-auto flex items-center">
          <Button
            ref={editButtonRef}
            variant="ghost"
            size="icon-xs"
            className={ICON_BUTTON}
            onClick={() => setEditing(true)}
            aria-label={`Edit item: ${item.text}`}
          >
            <Pencil aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            className={cn(ICON_BUTTON, "hover:text-destructive")}
            onClick={onRemove}
            aria-label={`Remove item: ${item.text}`}
          >
            <X aria-hidden="true" />
          </Button>
        </div>
      </div>
    </li>
  );
}
