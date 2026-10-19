/**
 * Full page load to an absolute same-origin URL. Used after login, logout and session expiry
 * so every client cache (SWR, chat history) starts clean for the new user.
 */
export function hardNavigate(path: string): void {
  window.location.assign(new URL(path, window.location.origin).href);
}
