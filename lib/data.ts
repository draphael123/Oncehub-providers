import fs from "fs";
import path from "path";
import { parseResourcePoolCsv } from "./parseResourcePoolCsv";
import { ResourcePool, Program, ExclusionsData } from "./types";

/**
 * Load and parse CSV data for a program.
 * Server-side only.
 */
export function loadProgramData(program: Program): ResourcePool[] {
  const filename = program === "HRT" ? "hrt.csv" : "trt.csv";
  const filePath = path.join(process.cwd(), "data", filename);
  
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return parseResourcePoolCsv(content, program);
  } catch (error) {
    console.error(`Error loading ${filename}:`, error);
    return [];
  }
}

/**
 * Load exclusions data from JSON file.
 * Server-side only.
 */
export function loadExclusions(): ExclusionsData {
  const filePath = path.join(process.cwd(), "data", "exclusions.json");
  
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(content);
    return {
      excludedUsers: Array.isArray(data.excludedUsers) ? data.excludedUsers : [],
      stateExclusions: Array.isArray(data.stateExclusions) ? data.stateExclusions : [],
    };
  } catch (error) {
    console.error("Error loading exclusions.json:", error);
    return { excludedUsers: [], stateExclusions: [] };
  }
}

/**
 * Get all program data with exclusions.
 */
export function getAllProgramData(): {
  hrt: ResourcePool[];
  trt: ResourcePool[];
  exclusions: ExclusionsData;
} {
  return {
    hrt: loadProgramData("HRT"),
    trt: loadProgramData("TRT"),
    exclusions: loadExclusions(),
  };
}
