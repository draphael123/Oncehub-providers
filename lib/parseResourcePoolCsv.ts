import Papa from "papaparse";
import { ResourcePool, Program, VisitType } from "./types";
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
 * Determine visit type from the second row header
 */
function getVisitType(label: string): VisitType {
  const lower = (label || "").toLowerCase().trim();
  if (lower.includes("follow")) return "Follow Up";
  return "Initial"; // Default to Initial
}

/**
 * Parse CSV content into ResourcePool array.
 * Handles format where:
 * - Row 1: State names (alternating with empty for Initial/Follow up pairs)
 * - Row 2: "Initial"/"Follow up" labels
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
  // Second row is Initial/Follow up labels
  const visitTypeRow = rows[1];
  // Data starts from row 3 (index 2)
  const dataRows = rows.slice(2);

  // Build a map of column index -> { state, visitType }
  const columnMap: Map<number, { state: string; visitType: VisitType }> = new Map();
  let lastValidState = "";

  headerRow.forEach((header, index) => {
    const trimmed = header?.trim() || "";
    const visitTypeLabel = visitTypeRow[index] || "";
    const visitType = getVisitType(visitTypeLabel);
    
    if (!shouldIgnoreHeader(trimmed) && trimmed !== "") {
      // Clean up state name (remove trailing parenthetical notes)
      let stateName = trimmed
        .replace(/\s*\(.*\)\s*$/g, "") // Remove (no marketing) etc
        .replace(/\s+/g, " ")
        .trim();
      
      lastValidState = stateName;
      columnMap.set(index, { state: stateName, visitType });
    } else if (trimmed === "" && lastValidState) {
      // Empty column after a state - this is the "Follow up" column for that state
      columnMap.set(index, { state: lastValidState, visitType });
    }
  });

  // Collect users per state+visitType
  const poolKey = (state: string, visitType: VisitType) => `${state}|${visitType}`;
  const stateUsersMap: Map<string, string[]> = new Map();

  // Process each data row
  dataRows.forEach((row) => {
    if (!row || row.length === 0) return;
    
    columnMap.forEach(({ state, visitType }, colIndex) => {
      const cellValue = row[colIndex];
      if (cellValue !== undefined && cellValue !== null) {
        const normalized = normalizeUserName(String(cellValue));
        
        // Skip invalid entries, legend text, and "Closed" markers
        if (!isValidUser(normalized)) return;
        const lower = normalized.toLowerCase();
        if (lower === "closed" || lower.includes("please add") || lower === "key" || lower === "back-up") return;
        
        // Skip entries that look like legend/key text
        if (lower.includes("pending") || lower.includes("provider has") || lower.includes("license")) return;
        
        // Get or create the users array for this state+visitType
        const key = poolKey(state, visitType);
        if (!stateUsersMap.has(key)) {
          stateUsersMap.set(key, []);
        }
        stateUsersMap.get(key)!.push(normalized);
      }
    });
  });

  // Convert map to array of ResourcePool objects
  const resourcePools: ResourcePool[] = [];
  stateUsersMap.forEach((users, key) => {
    const [state, visitType] = key.split("|") as [string, VisitType];
    // De-duplicate users within each pool
    const dedupedUsers = dedupeUsers(users);
    
    // Only include pools with at least one user
    if (dedupedUsers.length > 0) {
      resourcePools.push({
        program,
        state,
        visitType,
        users: dedupedUsers,
      });
    }
  });

  // Sort by state name, then visit type
  resourcePools.sort((a, b) => {
    const stateCompare = a.state.localeCompare(b.state);
    if (stateCompare !== 0) return stateCompare;
    return a.visitType === "Initial" ? -1 : 1;
  });

  return resourcePools;
}

/**
 * Get users for a specific state from resource pools.
 */
export function getUsersForState(
  resourcePools: ResourcePool[],
  state: string,
  visitType?: VisitType,
  showDuplicates: boolean = false
): string[] {
  let pools = resourcePools.filter((p) => p.state === state);
  if (visitType) {
    pools = pools.filter((p) => p.visitType === visitType);
  }
  
  const allUsers = pools.flatMap((p) => p.users);
  
  if (showDuplicates) {
    return allUsers;
  }
  return dedupeUsers(allUsers);
}

/**
 * Get all users across all states for a program.
 */
export function getAllUsers(
  resourcePools: ResourcePool[]
): { name: string; state: string; visitType: VisitType }[] {
  const allUsers: { name: string; state: string; visitType: VisitType }[] = [];
  
  resourcePools.forEach((pool) => {
    pool.users.forEach((user) => {
      allUsers.push({ name: user, state: pool.state, visitType: pool.visitType });
    });
  });

  // Sort by name, then by state, then by visit type
  allUsers.sort((a, b) => {
    const nameCompare = a.name.localeCompare(b.name);
    if (nameCompare !== 0) return nameCompare;
    const stateCompare = a.state.localeCompare(b.state);
    if (stateCompare !== 0) return stateCompare;
    return a.visitType === "Initial" ? -1 : 1;
  });

  return allUsers;
}

/**
 * Group resource pools by state (combining Initial and Follow Up)
 */
export function groupPoolsByState(
  resourcePools: ResourcePool[]
): Map<string, { initial: ResourcePool | null; followUp: ResourcePool | null }> {
  const stateMap = new Map<string, { initial: ResourcePool | null; followUp: ResourcePool | null }>();
  
  resourcePools.forEach((pool) => {
    if (!stateMap.has(pool.state)) {
      stateMap.set(pool.state, { initial: null, followUp: null });
    }
    const entry = stateMap.get(pool.state)!;
    if (pool.visitType === "Initial") {
      entry.initial = pool;
    } else {
      entry.followUp = pool;
    }
  });
  
  return stateMap;
}
