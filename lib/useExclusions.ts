"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ExclusionsData } from "./types";

const LOCAL_STORAGE_KEY = "resourcePoolViewer_exclusions";

interface UseExclusionsReturn {
  isExcluded: (name: string) => boolean;
  toggleExcluded: (name: string) => void;
  showExcluded: boolean;
  setShowExcluded: (show: boolean) => void;
  excludedCount: number;
  allExcludedNames: string[];
  isLoaded: boolean;
}

/**
 * Hook for managing user exclusions.
 * Merges server-side exclusions.json with localStorage overrides.
 * localStorage wins for conflicts.
 */
export function useExclusions(
  serverExclusions: ExclusionsData
): UseExclusionsReturn {
  const [localOverrides, setLocalOverrides] = useState<Record<string, boolean>>({});
  const [showExcluded, setShowExcluded] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load localStorage on mount (client-side only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed === "object" && parsed !== null) {
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

  // Compute merged exclusion set
  const allExcludedNames = useMemo(() => {
    const excluded = new Set<string>();
    
    // Add server exclusions first
    serverExclusions.excludedUsers.forEach((name) => {
      excluded.add(name.toLowerCase());
    });
    
    // Apply localStorage overrides (true = excluded, false = included)
    Object.entries(localOverrides).forEach(([name, isExcluded]) => {
      const lowerName = name.toLowerCase();
      if (isExcluded) {
        excluded.add(lowerName);
      } else {
        excluded.delete(lowerName);
      }
    });
    
    return Array.from(excluded);
  }, [serverExclusions.excludedUsers, localOverrides]);

  const isExcluded = useCallback(
    (name: string): boolean => {
      const lowerName = name.toLowerCase();
      
      // Check localStorage override first
      const overrideKey = Object.keys(localOverrides).find(
        (k) => k.toLowerCase() === lowerName
      );
      if (overrideKey !== undefined) {
        return localOverrides[overrideKey];
      }
      
      // Fall back to server exclusions
      return serverExclusions.excludedUsers.some(
        (excluded) => excluded.toLowerCase() === lowerName
      );
    },
    [localOverrides, serverExclusions.excludedUsers]
  );

  const toggleExcluded = useCallback((name: string): void => {
    setLocalOverrides((prev) => {
      const currentlyExcluded = (() => {
        const lowerName = name.toLowerCase();
        const overrideKey = Object.keys(prev).find(
          (k) => k.toLowerCase() === lowerName
        );
        if (overrideKey !== undefined) {
          return prev[overrideKey];
        }
        return serverExclusions.excludedUsers.some(
          (excluded) => excluded.toLowerCase() === lowerName
        );
      })();
      
      return {
        ...prev,
        [name]: !currentlyExcluded,
      };
    });
  }, [serverExclusions.excludedUsers]);

  const excludedCount = allExcludedNames.length;

  return {
    isExcluded,
    toggleExcluded,
    showExcluded,
    setShowExcluded,
    excludedCount,
    allExcludedNames,
    isLoaded,
  };
}

