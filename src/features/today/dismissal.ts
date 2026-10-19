/**
 * Remembers a dismissed hint in localStorage. Storage can be missing or throw (private mode,
 * blocked site data), so both helpers fail soft: unreadable means "not dismissed", unwritable is ignored.
 */
export function readDismissed(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

export function writeDismissed(key: string): void {
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    // Dismissal just won't survive a reload.
  }
}
