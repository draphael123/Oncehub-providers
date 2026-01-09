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
  isExcluded: (name: string, state?: string, program?: Program) => boolean;
  toggleExcluded: (name: string, state: string, program: Program) => void;
  showExcluded: boolean;
}

// Color palettes for variety
const stateColors = [
  { bg: "from-rose-50 to-pink-100", border: "border-l-rose-500", accent: "bg-rose-500" },
  { bg: "from-orange-50 to-amber-100", border: "border-l-orange-500", accent: "bg-orange-500" },
  { bg: "from-yellow-50 to-lime-100", border: "border-l-yellow-500", accent: "bg-yellow-500" },
  { bg: "from-emerald-50 to-green-100", border: "border-l-emerald-500", accent: "bg-emerald-500" },
  { bg: "from-teal-50 to-cyan-100", border: "border-l-teal-500", accent: "bg-teal-500" },
  { bg: "from-sky-50 to-blue-100", border: "border-l-sky-500", accent: "bg-sky-500" },
  { bg: "from-indigo-50 to-violet-100", border: "border-l-indigo-500", accent: "bg-indigo-500" },
  { bg: "from-purple-50 to-fuchsia-100", border: "border-l-purple-500", accent: "bg-purple-500" },
];

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
      <div className="text-center py-12 text-muted-foreground bg-white/50 rounded-xl">
        No states found matching your search.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {filteredPools.map((pool, index) => {
        const isExpanded = expandedStates.has(pool.state);
        
        // Check exclusion per state
        const visibleUsers = showExcluded
          ? pool.users
          : pool.users.filter((u) => !isExcluded(u, pool.state, program));
        const excludedInState = pool.users.filter((u) => isExcluded(u, pool.state, program)).length;
        const colorScheme = stateColors[index % stateColors.length];

        // Filter users by search query
        const query = searchQuery.toLowerCase();
        const filteredUsers = query
          ? visibleUsers.filter((u) => u.toLowerCase().includes(query))
          : visibleUsers;

        return (
          <Card 
            key={pool.state} 
            className={`h-fit transition-all duration-300 hover:shadow-xl border-l-4 ${colorScheme.border} bg-gradient-to-br ${colorScheme.bg} hover:scale-[1.02]`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Link href={getStateRoute(program, pool.state)} className="flex-1">
                  <CardTitle className="flex items-center gap-2 text-lg hover:text-primary transition-colors">
                    <div className={`p-1.5 rounded-md ${colorScheme.accent} text-white`}>
                      <MapPin className="h-3.5 w-3.5" />
                    </div>
                    {pool.state}
                  </CardTitle>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpanded(pool.state)}
                  className="h-8 w-8 p-0 hover:bg-white/50"
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
                  <Badge className="text-xs ml-auto bg-amber-500 hover:bg-amber-600 text-white">
                    +{excludedInState} excluded
                  </Badge>
                )}
              </div>

              {/* Expandable user list */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-white/50 space-y-1 max-h-64 overflow-y-auto">
                  {filteredUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No users match your search</p>
                  ) : (
                    filteredUsers.map((user, idx) => {
                      const excluded = isExcluded(user, pool.state, program);
                      return (
                        <div
                          key={`${user}-${idx}`}
                          className={`flex items-center justify-between gap-2 p-2 rounded-md text-sm transition-colors ${
                            excluded 
                              ? "bg-amber-100/80 border border-amber-300" 
                              : "bg-white/60 hover:bg-white/80"
                          }`}
                        >
                          <span className={excluded ? "text-amber-700 line-through" : "font-medium"}>
                            {user}
                          </span>
                          <Button
                            variant={excluded ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleExcluded(user, pool.state, program)}
                            className={`h-6 px-2 text-xs ${
                              excluded 
                                ? "bg-emerald-500 hover:bg-emerald-600 text-white" 
                                : "border-amber-400 text-amber-700 hover:bg-amber-100"
                            }`}
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
                  className="w-full mt-2 text-xs text-muted-foreground hover:bg-white/50"
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
