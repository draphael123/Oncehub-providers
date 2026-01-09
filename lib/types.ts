export type Program = "HRT" | "TRT";
export type VisitType = "Initial" | "Follow Up";

export interface ResourcePool {
  program: Program;
  state: string;
  visitType: VisitType;
  users: string[];
}

export interface StateExclusion {
  program: Program;
  state: string;
  user: string;
  visitType?: VisitType; // Optional - if not specified, applies to both
}

export interface ExclusionsData {
  excludedUsers: string[]; // Global exclusions (legacy)
  stateExclusions: StateExclusion[]; // Per-state exclusions
}

export interface UserEntry {
  name: string;
  state: string;
  visitType: VisitType;
  isExcluded: boolean;
}
