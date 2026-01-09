export type Program = "HRT" | "TRT";

export interface ResourcePool {
  program: Program;
  state: string;
  users: string[];
}

export interface ExclusionsData {
  excludedUsers: string[];
}

export interface UserEntry {
  name: string;
  state: string;
  isExcluded: boolean;
}

