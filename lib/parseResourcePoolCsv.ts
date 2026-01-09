import Papa from "papaparse";
import { ResourcePool, Program } from "./types";
import { normalizeUserName, shouldIgnoreColumn, isValidUser, dedupeUsers } from "./normalize";

/**
 * Parse CSV content into ResourcePool array.
 * @param csvContent - Raw CSV string content
 * @param program - "HRT" or "TRT"
 * @returns Array of ResourcePool objects
 */
export function parseResourcePoolCsv(csvContent: string, program: Program): ResourcePool[] {
  const result = Papa.parse<string[]>(csvContent, {
    header: false,
    skipEmptyLines: true,
  });

  if (result.errors.length > 0) {
    console.warn("CSV parsing warnings:", result.errors);
  }

  const rows = result.data;
  if (rows.length === 0) {
    return [];
  }

  // First row is headers
  const headers = rows[0];
  const dataRows = rows.slice(1);

  // Build a map of column index -> state name (only for valid columns)
  const columnMap: Map<number, string> = new Map();
  headers.forEach((header, index) => {
    if (!shouldIgnoreColumn(header)) {
      columnMap.set(index, header.trim());
    }
  });

  // Collect users per state
  const stateUsersMap: Map<string, string[]> = new Map();

  // Initialize empty arrays for each state
  columnMap.forEach((state) => {
    stateUsersMap.set(state, []);
  });

  // Process each data row
  dataRows.forEach((row) => {
    columnMap.forEach((state, colIndex) => {
      const cellValue = row[colIndex];
      if (cellValue !== undefined && cellValue !== null) {
        const normalized = normalizeUserName(String(cellValue));
        if (isValidUser(normalized)) {
          const users = stateUsersMap.get(state)!;
          users.push(normalized);
        }
      }
    });
  });

  // Convert map to array of ResourcePool objects
  const resourcePools: ResourcePool[] = [];
  stateUsersMap.forEach((users, state) => {
    // De-duplicate by default in the parsed data
    const dedupedUsers = dedupeUsers(users);
    resourcePools.push({
      program,
      state,
      users: dedupedUsers,
    });
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

