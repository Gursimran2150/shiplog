"use client";

import { Mic, Square } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { useSpeechDictation } from "@/hooks/useSpeechDictation";
import { cn } from "@/lib/utils";

const LANGS = [
  { value: "en-IN", label: "English" },
  { value: "hi-IN", label: "हिन्दी" },
] as const;

interface MicButtonProps {
  /** Receives each finalised phrase; usually `append` from useDictationField. */
  onText: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Browser microphone dictation for people without Wispr Flow. Hidden where the browser has no
 * Web Speech API (e.g. Firefox), so it never shows a control that can't work.
 */
export function MicButton({ onText, disabled, className }: MicButtonProps) {
  const langId = useId();
  const [lang, setLang] = useState<string>(LANGS[0].value);
  const { supported, listening, interim, error, start, stop } = useSpeechDictation(lang, onText);

  if (!supported) return null;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={listening ? "destructive" : "outline"}
          size="sm"
          onClick={listening ? stop : start}
          disabled={disabled}
          aria-pressed={listening}
          className="h-9 gap-2"
        >
          {listening ? (
            <>
              <Square aria-hidden="true" className="size-3.5" /> Stop
              <span
                aria-hidden="true"
                className="size-2 animate-pulse rounded-full bg-white motion-reduce:animate-none"
              />
            </>
          ) : (
            <>
              <Mic aria-hidden="true" /> Use microphone
            </>
          )}
        </Button>
        <label htmlFor={langId} className="sr-only">
          Dictation language
        </label>
        <select
          id={langId}
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          disabled={listening || disabled}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {LANGS.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      </div>
      <p aria-live="polite" className="min-h-4 text-xs text-muted-foreground">
        {error ? (
          <span className="text-destructive">{error}</span>
        ) : listening ? (
          interim || "Listening… speak naturally."
        ) : (
          ""
        )}
      </p>
    </div>
  );
}
