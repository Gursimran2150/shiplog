"use client";

import { Check, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { TOUCH_TARGET } from "./touch";

const MAX_ITEM_CHARS = 300;

interface ItemInputProps {
  initial?: string;
  /** Accessible name of the text field, e.g. "Edit item: Fixed login". */
  label: string;
  submitLabel: string;
  onSubmit: (text: string) => void;
  onCancel: () => void;
}

/** One-line editor for a log item: Enter saves, Escape cancels. Focuses itself on mount. */
export function ItemInput({ initial = "", label, submitLabel, onSubmit, onCancel }: ItemInputProps) {
  const [draft, setDraft] = useState(initial);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSubmit(draft);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onCancel();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-1">
      <Input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        aria-label={label}
        maxLength={MAX_ITEM_CHARS}
        enterKeyHint="done"
        className="h-11 sm:h-8"
      />
      <Button type="submit" variant="ghost" size="icon-sm" aria-label={submitLabel} className={TOUCH_TARGET}>
        <Check aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onCancel}
        aria-label="Cancel"
        className={cn("text-muted-foreground", TOUCH_TARGET)}
      >
        <X aria-hidden="true" />
      </Button>
    </form>
  );
}
