import { Program } from "./types";

/**
 * Encode a state name for use in URL route params.
 * Uses base64url encoding to handle special characters safely.
 */
export function encodeStateParam(state: string): string {
  // Use encodeURIComponent for URL safety
  return encodeURIComponent(state);
}

/**
 * Decode a state name from URL route params.
 */
export function decodeStateParam(encoded: string): string {
  try {
    return decodeURIComponent(encoded);
  } catch {
    return encoded;
  }
}

/**
 * Generate route for state detail page.
 */
export function getStateRoute(program: Program, state: string): string {
  return `/state/${program.toLowerCase()}/${encodeStateParam(state)}`;
}

/**
 * Generate route for all users page.
 */
export function getAllUsersRoute(program: Program): string {
  return `/all/${program.toLowerCase()}`;
}

/**
 * Validate and normalize program param from URL.
 */
export function normalizeProgram(programParam: string): Program | null {
  const upper = programParam.toUpperCase();
  if (upper === "HRT" || upper === "TRT") {
    return upper as Program;
  }
  return null;
}

