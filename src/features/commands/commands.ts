export interface Command {
  id: string;
  label: string;
  group: "Navigate" | "Create" | "Preferences" | "Account";
  /** Extra words that should match, e.g. "standup" for Reports. */
  keywords?: string;
  shortcut?: string;
}

export const COMMANDS: readonly Command[] = [
  { id: "go:/", label: "Log today's work", group: "Create", keywords: "today speak dictate wispr entry" },
  { id: "go:/reports", label: "Generate a standup or report", group: "Create", keywords: "standup weekly brag doc" },
  {
    id: "go:/reports?tab=pr",
    label: "Write a PR description",
    group: "Create",
    keywords: "pull request pr review github bitbucket voice",
  },
  {
    id: "go:/#waiting",
    label: "See who you're waiting on",
    group: "Navigate",
    keywords: "blockers blocked follow up nudge ping slack",
  },
  { id: "go:/ask", label: "Ask your journal", group: "Create", keywords: "question search history" },
  {
    id: "go:/journeys",
    label: "Open task journeys",
    group: "Navigate",
    keywords: "tasks tree history blockers notes learnings fixed",
  },
  { id: "go:/timeline", label: "Go to Timeline", group: "Navigate", keywords: "heatmap streak calendar history" },
  { id: "go:/settings", label: "Go to Settings", group: "Navigate", keywords: "github format account" },
  { id: "theme:light", label: "Switch to light theme", group: "Preferences" },
  { id: "theme:dark", label: "Switch to dark theme", group: "Preferences" },
  { id: "theme:system", label: "Use system theme", group: "Preferences" },
  { id: "tour", label: "Replay the welcome tour", group: "Preferences", keywords: "onboarding help guide" },
  { id: "shortcuts", label: "Show keyboard shortcuts", group: "Preferences", keywords: "keys help", shortcut: "?" },
  { id: "logout", label: "Log out", group: "Account", keywords: "sign out" },
];

/** Case-insensitive match on label and keywords; every typed word must appear somewhere. */
export function filterCommands(query: string, commands: readonly Command[] = COMMANDS): Command[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [...commands];
  return commands.filter((c) => {
    const haystack = `${c.label} ${c.keywords ?? ""}`.toLowerCase();
    return words.every((w) => haystack.includes(w));
  });
}

/** True when a keystroke happens while the user is typing, so single-key shortcuts must not fire. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

export const SHORTCUTS: readonly { keys: string; action: string }[] = [
  { keys: "⌘/Ctrl + K", action: "Open the command menu" },
  { keys: "⌘/Ctrl + Enter", action: "Save your spoken log (on Today)" },
  { keys: "?", action: "Show this list" },
  { keys: "← ↑ → ↓", action: "Move between days in the Timeline heatmap" },
  { keys: "Esc", action: "Close any dialog" },
];
