"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ExclusionsData, Program, StateExclusion, VisitType } from "./types";

const LOCAL_STORAGE_KEY = "resourcePoolViewer_stateExclusions_v2";

interface UseExclusionsReturn {
  isExcluded: (name: string, state?: string, program?: Program, visitType?: VisitType) => boolean;
  toggleExcluded: (name: string, state: string, program: Program, visitType?: VisitType) => void;
  showExcluded: boolean;
  setShowExcluded: (show: boolean) => void;
  getExcludedCountForState: (state: string, program: Program, visitType?: VisitType) => number;
  getTotalExcludedCount: (program: Program) => number;
  isLoaded: boolean;
}

/**
 * Hook for managing user exclusions.
 * Supports per-state and per-visit-type exclusions.
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
    return {
      serverExclusions: serverExclusions.stateExclusions || [],
      localOverrides,
    };
  }, [serverExclusions.stateExclusions, localOverrides]);

  const isExcluded = useCallback(
    (name: string, state?: string, program?: Program, visitType?: VisitType): boolean => {
      const lowerName = name.toLowerCase().trim();
      
      // If no state provided, check if excluded in ANY state (for global views)
      if (!state || !program) {
        const serverExcluded = allExclusions.serverExclusions.some(
          (e) => e.user.toLowerCase().trim() === lowerName
        );
        const localExcluded = localOverrides.some(
          (e) => e.user.toLowerCase().trim() === lowerName
        );
        return serverExcluded || localExcluded;
      }
      
      // Check local overrides first (they take precedence)
      const localOverride = localOverrides.find(
        (e) => 
          e.program === program && 
          e.state === state && 
          e.user.toLowerCase().trim() === lowerName &&
          (!visitType || !e.visitType || e.visitType === visitType)
      );
      
      if (localOverride !== undefined) {
        return true;
      }
      
      // Check server exclusions
      const serverExcluded = allExclusions.serverExclusions.some(
        (e) => 
          e.program === program && 
          e.state === state && 
          e.user.toLowerCase().trim() === lowerName &&
          (!visitType || !e.visitType || e.visitType === visitType)
      );
      
      return serverExcluded;
    },
    [allExclusions, localOverrides]
  );

  const toggleExcluded = useCallback((name: string, state: string, program: Program, visitType?: VisitType): void => {
    setLocalOverrides((prev) => {
      const lowerName = name.toLowerCase().trim();
      const existingIndex = prev.findIndex(
        (e) => 
          e.program === program && 
          e.state === state && 
          e.user.toLowerCase().trim() === lowerName &&
          e.visitType === visitType
      );
      
      if (existingIndex >= 0) {
        return prev.filter((_, i) => i !== existingIndex);
      } else {
        return [...prev, { program, state, user: name, visitType }];
      }
    });
  }, []);

  const getExcludedCountForState = useCallback(
    (state: string, program: Program, visitType?: VisitType): number => {
      const serverCount = allExclusions.serverExclusions.filter(
        (e) => e.program === program && e.state === state && 
          (!visitType || !e.visitType || e.visitType === visitType)
      ).length;
      
      const localCount = localOverrides.filter(
        (e) => e.program === program && e.state === state &&
          (!visitType || !e.visitType || e.visitType === visitType)
      ).length;
      
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
