/**
 * Normalize a user string: trim whitespace and collapse multiple spaces to one.
 */
export function normalizeUserName(name: string): string {
  if (!name || typeof name !== "string") return "";
  return name.trim().replace(/\s+/g, " ");
}

/**
 * Check if a column header should be ignored.
 * Ignores columns starting with "Unnamed" or that are blank.
 */
export function shouldIgnoreColumn(header: string): boolean {
  if (!header || typeof header !== "string") return true;
  const trimmed = header.trim();
  if (trimmed === "") return true;
  if (trimmed.toLowerCase().startsWith("unnamed")) return true;
  return false;
}

/**
 * Check if a user entry is valid (non-empty after normalization).
 */
export function isValidUser(name: string): boolean {
  const normalized = normalizeUserName(name);
  return normalized.length > 0;
}

/**
 * De-duplicate an array of strings (case-sensitive).
 */
export function dedupeUsers(users: string[]): string[] {
  return [...new Set(users)];
}

