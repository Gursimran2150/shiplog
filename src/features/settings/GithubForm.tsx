"use client";

import { Loader2 } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { githubUsernameError, normalizeGithubUsername } from "./github-username";

interface GithubFormProps {
  initial: string | null;
  onSave: (githubUsername: string | null) => Promise<void>;
}

/** GitHub username with inline validation. Mounted once settings have loaded, so `initial` is real data. */
export function GithubForm({ initial, onSave }: GithubFormProps) {
  const ids = { input: useId(), hint: useId(), error: useId() };
  const [value, setValue] = useState(initial ?? "");
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const error = githubUsernameError(value);
  const showError = touched && error !== null;
  const next = normalizeGithubUsername(value) || null;
  const unchanged = next === initial;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (error || saving) return;
    setSaving(true);
    try {
      await onSave(next);
      setValue(next ?? "");
      toast.success(next ? `Connected GitHub as @${next}` : "GitHub disconnected");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-2">
      <Label htmlFor={ids.input}>GitHub username</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-sm text-muted-foreground"
          >
            @
          </span>
          <Input
            id={ids.input}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="octocat"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={40}
            aria-invalid={showError}
            aria-describedby={showError ? `${ids.error} ${ids.hint}` : ids.hint}
            className="pl-6"
          />
        </div>
        <Button type="submit" disabled={saving || unchanged}>
          {saving && <Loader2 className="animate-spin" aria-hidden="true" />}
          Save
        </Button>
      </div>
      {showError && (
        <p id={ids.error} className="text-sm text-destructive">
          {error}
        </p>
      )}
      <p id={ids.hint} className="text-xs text-muted-foreground">
        Leave empty to disconnect.
      </p>
    </form>
  );
}
