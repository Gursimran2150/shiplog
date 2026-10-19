/** Mirrors GitHub's rules: 1–39 letters, digits or single hyphens, not starting or ending with a hyphen. */
const GITHUB_USERNAME = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

/** Trims whitespace and a pasted leading "@". An empty result means "not connected". */
export function normalizeGithubUsername(value: string): string {
  return value.trim().replace(/^@/, "");
}

/** Returns an error message for an invalid username, or null when it is valid or empty. */
export function githubUsernameError(value: string): string | null {
  const name = normalizeGithubUsername(value);
  if (!name || GITHUB_USERNAME.test(name)) return null;
  if (name.length > 39) return "GitHub usernames are at most 39 characters.";
  if (name.startsWith("-") || name.endsWith("-")) return "A username can't start or end with a hyphen.";
  if (name.includes("--")) return "A username can't contain two hyphens in a row.";
  return "Use only letters, numbers and single hyphens.";
}
