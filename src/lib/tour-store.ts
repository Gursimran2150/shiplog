/**
 * Tiny external store for "replay the tour" requests from anywhere (user menu, command
 * palette) without threading context through the whole tree.
 */
let replayRequested = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export const tourStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot: () => replayRequested,
  getServerSnapshot: () => false,
  replay() {
    replayRequested = true;
    emit();
  },
  close() {
    replayRequested = false;
    emit();
  },
};
