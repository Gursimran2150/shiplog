"use client";

import { Command as CommandIcon, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useId, useMemo, useState, type KeyboardEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/lib/api-client";
import { hardNavigate } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { tourStore } from "@/lib/tour-store";
import { filterCommands, isTypingTarget, SHORTCUTS, type Command } from "./commands";

/** ⌘K command menu and the "?" shortcuts sheet, with a header trigger button. */
export function CommandMenu() {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useEffect(() => {
    function onKey(e: globalThis.KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "?" && !isTypingTarget(e.target)) {
        e.preventDefault();
        setShortcutsOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function run(command: Command) {
    setOpen(false);
    const [kind, arg] = command.id.split(":");
    if (kind === "go") router.push(arg);
    else if (kind === "theme") setTheme(arg);
    else if (kind === "tour") tourStore.replay();
    else if (kind === "shortcuts") setShortcutsOpen(true);
    else if (kind === "logout") {
      try {
        await api.post("/api/auth/logout");
        hardNavigate("/login");
      } catch {
        toast.error("Could not log out. Please try again.");
      }
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-8 gap-2 text-muted-foreground"
        aria-keyshortcuts="Meta+K Control+K"
      >
        <Search className="size-3.5" aria-hidden="true" />
        {/* Visible text is part of the accessible name (WCAG 2.5.3); the rest is for screen readers. */}
        <span className="sr-only">Open command menu</span>
        <span className="hidden sm:inline">Search…</span>
        <kbd className="hidden rounded border border-border px-1 font-mono text-[10px] sm:inline">⌘K</kbd>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="top-[20%] translate-y-0 gap-0 p-0 sm:max-w-lg" showCloseButton={false}>
          <DialogTitle className="sr-only">Command menu</DialogTitle>
          <DialogDescription className="sr-only">
            Type to filter, use arrow keys to choose, Enter to run.
          </DialogDescription>
          {open && <CommandList onRun={run} />}
        </DialogContent>
      </Dialog>

      <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="flex items-center gap-2">
            <CommandIcon className="size-4" aria-hidden="true" /> Keyboard shortcuts
          </DialogTitle>
          <DialogDescription className="sr-only">All keyboard shortcuts in ShipLog</DialogDescription>
          <dl className="mt-2 divide-y divide-border text-sm">
            {SHORTCUTS.map((s) => (
              <div key={s.keys} className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-muted-foreground">{s.action}</dt>
                <dd>
                  <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs whitespace-nowrap">
                    {s.keys}
                  </kbd>
                </dd>
              </div>
            ))}
          </dl>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Combobox + listbox (ARIA 1.2 pattern): focus stays in the input, arrows move the active option. */
function CommandList({ onRun }: { onRun: (c: Command) => void }) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const results = useMemo(() => filterCommands(query), [query]);
  const current = Math.min(active, Math.max(results.length - 1, 0));

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") setActive((current + 1) % Math.max(results.length, 1));
    else if (e.key === "ArrowUp") setActive((current - 1 + results.length) % Math.max(results.length, 1));
    else if (e.key === "Enter" && results[current]) onRun(results[current]);
    else return;
    e.preventDefault();
  }

  return (
    <div>
      <div className="flex items-center gap-2 border-b border-border px-4">
        <Search className="size-4 text-muted-foreground" aria-hidden="true" />
        <input
          autoFocus
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={results[current] ? `${listId}-${results[current].id}` : undefined}
          aria-label="Search commands"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="Type a command or search…"
          className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      <ul id={listId} role="listbox" aria-label="Commands" className="max-h-80 overflow-y-auto p-2">
        {results.length === 0 && (
          <li className="px-3 py-6 text-center text-sm text-muted-foreground">No matching commands.</li>
        )}
        {results.map((c, i) => (
          <li
            key={c.id}
            id={`${listId}-${c.id}`}
            role="option"
            aria-selected={i === current}
            onMouseMove={() => setActive(i)}
            onClick={() => onRun(c)}
            className={cn(
              "flex items-center justify-between rounded-md px-3 py-2.5 text-sm",
              i === current && "bg-accent text-accent-foreground",
            )}
          >
            <span>{c.label}</span>
            <span className="font-mono text-[11px] text-muted-foreground">{c.shortcut ?? c.group}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
