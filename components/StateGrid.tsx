"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ResourcePool, Program } from "@/lib/types";
import { getStateRoute } from "@/lib/route";
import { MapPin, Users, ChevronDown, ChevronUp, UserMinus, UserPlus } from "lucide-react";

interface StateGridProps {
  resourcePools: ResourcePool[];
  program: Program;
  searchQuery: string;
  isExcluded: (name: string) => boolean;
  toggleExcluded: (name: string) => void;
  showExcluded: boolean;
}

export function StateGrid({
  resourcePools,
  program,
  searchQuery,
  isExcluded,
  toggleExcluded,
  showExcluded,
}: StateGridProps) {
  const [expandedStates, setExpandedStates] = useState<Set<string>>(new Set());

  const toggleExpanded = (state: string) => {
    setExpandedStates((prev) => {
      const next = new Set(prev);
      if (next.has(state)) {
        next.delete(state);
      } else {
        next.add(state);
      }
      return next;
    });
  };

  // Filter states based on search (search in state name or user names)
  const filteredPools = resourcePools.filter((pool) => {
    const query = searchQuery.toLowerCase();
    if (!query) return true;
    
    // Check if state name matches
    if (pool.state.toLowerCase().includes(query)) return true;
    
    // Check if any user in the state matches
    return pool.users.some((user) => user.toLowerCase().includes(query));
  });

  if (filteredPools.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No states found matching your search.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {filteredPools.map((pool) => {
        const isExpanded = expandedStates.has(pool.state);
        const visibleUsers = showExcluded
          ? pool.users
          : pool.users.filter((u) => !isExcluded(u));
        const excludedInState = pool.users.filter((u) => isExcluded(u)).length;

        // Filter users by search query
        const query = searchQuery.toLowerCase();
        const filteredUsers = query
          ? visibleUsers.filter((u) => u.toLowerCase().includes(query))
          : visibleUsers;

        return (
          <Card 
            key={pool.state} 
            className={`h-fit transition-shadow hover:shadow-lg border-l-4 ${
              program === "HRT" ? "border-l-emerald-500" : "border-l-sky-500"
            }`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Link href={getStateRoute(program, pool.state)} className="flex-1">
                  <CardTitle className="flex items-center gap-2 text-lg hover:text-primary transition-colors">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {pool.state}
                  </CardTitle>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpanded(pool.state)}
                  className="h-8 w-8 p-0"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{visibleUsers.length}</span>
                <span className="text-sm text-muted-foreground">users</span>
                {excludedInState > 0 && !showExcluded && (
                  <Badge variant="secondary" className="text-xs ml-auto">
                    +{excludedInState} excluded
                  </Badge>
                )}
              </div>

              {/* Expandable user list */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t space-y-1 max-h-64 overflow-y-auto">
                  {filteredUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No users match your search</p>
                  ) : (
                    filteredUsers.map((user, idx) => {
                      const excluded = isExcluded(user);
                      return (
                        <div
                          key={`${user}-${idx}`}
                          className={`flex items-center justify-between gap-2 p-2 rounded-md text-sm ${
                            excluded ? "bg-amber-50 dark:bg-amber-950/20" : "hover:bg-muted/50"
                          }`}
                        >
                          <span className={excluded ? "text-muted-foreground" : ""}>
                            {user}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExcluded(user)}
                            className="h-6 px-2 text-xs"
                          >
                            {excluded ? (
                              <>
                                <UserPlus className="h-3 w-3 mr-1" />
                                Include
                              </>
                            ) : (
                              <>
                                <UserMinus className="h-3 w-3 mr-1" />
                                Exclude
                              </>
                            )}
                          </Button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {!isExpanded && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpanded(pool.state)}
                  className="w-full mt-2 text-xs text-muted-foreground"
                >
                  Click to show users
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
