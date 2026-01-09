"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ExclusionsData, Program, StateExclusion } from "./types";

const LOCAL_STORAGE_KEY = "resourcePoolViewer_stateExclusions";

interface UseExclusionsReturn {
  isExcluded: (name: string, state?: string, program?: Program) => boolean;
  toggleExcluded: (name: string, state: string, program: Program) => void;
  showExcluded: boolean;
  setShowExcluded: (show: boolean) => void;
  getExcludedCountForState: (state: string, program: Program) => number;
  getTotalExcludedCount: (program: Program) => number;
  isLoaded: boolean;
}

/**
 * Hook for managing user exclusions.
 * Now supports per-state exclusions.
 */
export function useExclusions(
  serverExclusions: ExclusionsData
): UseExclusionsReturn {
  const [localOverrides, setLocalOverrides] = useState<StateExclusion[]>([]);
  const [showExcluded, setShowExcluded] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load localStorage on mount (client-side only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setLocalOverrides(parsed);
        }
      }
    } catch (e) {
      console.warn("Failed to load exclusions from localStorage:", e);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage when overrides change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localOverrides));
      } catch (e) {
        console.warn("Failed to save exclusions to localStorage:", e);
      }
    }
  }, [localOverrides, isLoaded]);

  // Merge server exclusions with local overrides
  const allExclusions = useMemo(() => {
    const exclusions: StateExclusion[] = [
      ...(serverExclusions.stateExclusions || []),
    ];
    
    // Local overrides can add or remove exclusions
    // We track "removed" exclusions separately
    return {
      serverExclusions: exclusions,
      localOverrides,
    };
  }, [serverExclusions.stateExclusions, localOverrides]);

  const isExcluded = useCallback(
    (name: string, state?: string, program?: Program): boolean => {
      const lowerName = name.toLowerCase().trim();
      
      // If no state provided, check if excluded in ANY state (for global views)
      if (!state || !program) {
        // Check server state exclusions
        const serverExcluded = allExclusions.serverExclusions.some(
          (e) => e.user.toLowerCase().trim() === lowerName
        );
        
        // Check local overrides
        const localExcluded = localOverrides.some(
          (e) => e.user.toLowerCase().trim() === lowerName
        );
        
        return serverExcluded || localExcluded;
      }
      
      // Check if excluded for specific state
      const key = `${program}-${state}-${lowerName}`;
      
      // Check local overrides first (they take precedence)
      const localOverride = localOverrides.find(
        (e) => 
          e.program === program && 
          e.state === state && 
          e.user.toLowerCase().trim() === lowerName
      );
      
      if (localOverride !== undefined) {
        return true; // Local override says excluded
      }
      
      // Check server exclusions
      const serverExcluded = allExclusions.serverExclusions.some(
        (e) => 
          e.program === program && 
          e.state === state && 
          e.user.toLowerCase().trim() === lowerName
      );
      
      return serverExcluded;
    },
    [allExclusions, localOverrides]
  );

  const toggleExcluded = useCallback((name: string, state: string, program: Program): void => {
    setLocalOverrides((prev) => {
      const lowerName = name.toLowerCase().trim();
      const existingIndex = prev.findIndex(
        (e) => 
          e.program === program && 
          e.state === state && 
          e.user.toLowerCase().trim() === lowerName
      );
      
      if (existingIndex >= 0) {
        // Remove the override (toggle off)
        return prev.filter((_, i) => i !== existingIndex);
      } else {
        // Add new exclusion
        return [...prev, { program, state, user: name }];
      }
    });
  }, []);

  const getExcludedCountForState = useCallback(
    (state: string, program: Program): number => {
      const serverCount = allExclusions.serverExclusions.filter(
        (e) => e.program === program && e.state === state
      ).length;
      
      const localCount = localOverrides.filter(
        (e) => e.program === program && e.state === state
      ).length;
      
      // This is a rough count - proper deduplication would require user list
      return serverCount + localCount;
    },
    [allExclusions, localOverrides]
  );

  const getTotalExcludedCount = useCallback(
    (program: Program): number => {
      const serverCount = allExclusions.serverExclusions.filter(
        (e) => e.program === program
      ).length;
      
      const localCount = localOverrides.filter(
        (e) => e.program === program
      ).length;
      
      return serverCount + localCount;
    },
    [allExclusions, localOverrides]
  );

  return {
    isExcluded,
    toggleExcluded,
    showExcluded,
    setShowExcluded,
    getExcludedCountForState,
    getTotalExcludedCount,
    isLoaded,
  };
}
