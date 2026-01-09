import Papa from "papaparse";
import { ResourcePool, Program } from "./types";
import { normalizeUserName, isValidUser, dedupeUsers } from "./normalize";

/**
 * Check if a header should be ignored (Unnamed, blank, or key/legend text)
 */
function shouldIgnoreHeader(header: string): boolean {
  if (!header || typeof header !== "string") return true;
  const trimmed = header.trim().toLowerCase();
  if (trimmed === "") return true;
  if (trimmed.startsWith("unnamed")) return true;
  if (trimmed === "key") return true;
  if (trimmed.includes("please add")) return true;
  if (trimmed.includes("pending")) return true;
  if (trimmed.includes("provider has")) return true;
  return false;
}

/**
 * Parse CSV content into ResourcePool array.
 * Handles format where:
 * - Row 1: State names (some columns empty for Initial/Follow up pairs)
 * - Row 2: "Initial"/"Follow up" labels (skipped)
 * - Row 3+: Provider names
 * 
 * @param csvContent - Raw CSV string content
 * @param program - "HRT" or "TRT"
 * @returns Array of ResourcePool objects
 */
export function parseResourcePoolCsv(csvContent: string, program: Program): ResourcePool[] {
  const result = Papa.parse<string[]>(csvContent, {
    header: false,
    skipEmptyLines: false,
  });

  if (result.errors.length > 0) {
    console.warn("CSV parsing warnings:", result.errors);
  }

  const rows = result.data;
  if (rows.length < 3) {
    return [];
  }

  // First row is state headers
  const headerRow = rows[0];
  // Second row is Initial/Follow up labels - skip it
  // Data starts from row 3 (index 2)
  const dataRows = rows.slice(2);

  // Build a map of column index -> state name
  // For empty headers, inherit from the previous non-empty header (for Initial/Follow up pairs)
  const columnToState: Map<number, string> = new Map();
  let lastValidState = "";

  headerRow.forEach((header, index) => {
    const trimmed = header?.trim() || "";
    
    if (!shouldIgnoreHeader(trimmed) && trimmed !== "") {
      // Clean up state name (remove trailing parenthetical notes)
      let stateName = trimmed
        .replace(/\s*\(.*\)\s*$/g, "") // Remove (no marketing) etc
        .replace(/\s+/g, " ")
        .trim();
      
      lastValidState = stateName;
      columnToState.set(index, stateName);
    } else if (trimmed === "" && lastValidState) {
      // Empty column after a state - this is the "Follow up" column for that state
      columnToState.set(index, lastValidState);
    }
  });

  // Collect users per state
  const stateUsersMap: Map<string, string[]> = new Map();

  // Process each data row
  dataRows.forEach((row) => {
    if (!row || row.length === 0) return;
    
    columnToState.forEach((state, colIndex) => {
      const cellValue = row[colIndex];
      if (cellValue !== undefined && cellValue !== null) {
        const normalized = normalizeUserName(String(cellValue));
        
        // Skip invalid entries, legend text, and "Closed" markers
        if (!isValidUser(normalized)) return;
        const lower = normalized.toLowerCase();
        if (lower === "closed" || lower.includes("please add") || lower === "key" || lower === "back-up") return;
        
        // Skip entries that look like legend/key text
        if (lower.includes("pending") || lower.includes("provider has") || lower.includes("license")) return;
        
        // Get or create the users array for this state
        if (!stateUsersMap.has(state)) {
          stateUsersMap.set(state, []);
        }
        stateUsersMap.get(state)!.push(normalized);
      }
    });
  });

  // Convert map to array of ResourcePool objects
  const resourcePools: ResourcePool[] = [];
  stateUsersMap.forEach((users, state) => {
    // De-duplicate users within each state
    const dedupedUsers = dedupeUsers(users);
    
    // Only include states with at least one user
    if (dedupedUsers.length > 0) {
      resourcePools.push({
        program,
        state,
        users: dedupedUsers,
      });
    }
  });

  // Sort by state name
  resourcePools.sort((a, b) => a.state.localeCompare(b.state));

  return resourcePools;
}

/**
 * Get users for a specific state from resource pools.
 */
export function getUsersForState(
  resourcePools: ResourcePool[],
  state: string,
  showDuplicates: boolean = false
): string[] {
  const pool = resourcePools.find((p) => p.state === state);
  if (!pool) return [];
  
  if (showDuplicates) {
    return pool.users;
  }
  return dedupeUsers(pool.users);
}

/**
 * Get all users across all states for a program.
 */
export function getAllUsers(
  resourcePools: ResourcePool[]
): { name: string; state: string }[] {
  const allUsers: { name: string; state: string }[] = [];
  
  resourcePools.forEach((pool) => {
    pool.users.forEach((user) => {
      allUsers.push({ name: user, state: pool.state });
    });
  });

  // Sort by name, then by state
  allUsers.sort((a, b) => {
    const nameCompare = a.name.localeCompare(b.name);
    if (nameCompare !== 0) return nameCompare;
    return a.state.localeCompare(b.state);
  });

  return allUsers;
}
