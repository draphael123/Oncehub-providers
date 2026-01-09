export type Program = "HRT" | "TRT";

export interface ResourcePool {
  program: Program;
  state: string;
  users: string[];
}

export interface StateExclusion {
  program: Program;
  state: string;
  user: string;
}

export interface ExclusionsData {
  excludedUsers: string[]; // Global exclusions (legacy, keep for backwards compat)
  stateExclusions: StateExclusion[]; // Per-state exclusions
}

export interface UserEntry {
  name: string;
  state: string;
  isExcluded: boolean;
}
