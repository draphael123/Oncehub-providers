"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ResourcePool, Program, VisitType } from "@/lib/types";
import { getStateRoute } from "@/lib/route";
import { groupPoolsByState } from "@/lib/parseResourcePoolCsv";
import { MapPin, Users, ChevronDown, ChevronUp, UserMinus, UserPlus, UserPlus2, RefreshCw } from "lucide-react";

interface StateGridProps {
  resourcePools: ResourcePool[];
  program: Program;
  searchQuery: string;
  isExcluded: (name: string, state?: string, program?: Program, visitType?: VisitType) => boolean;
  toggleExcluded: (name: string, state: string, program: Program, visitType?: VisitType) => void;
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

  // Group pools by state
  const groupedPools = useMemo(() => groupPoolsByState(resourcePools), [resourcePools]);

  // Filter states based on search
  const filteredStates = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const states = Array.from(groupedPools.keys());
    
    if (!query) return states;
    
    return states.filter((state) => {
      if (state.toLowerCase().includes(query)) return true;
      
      const entry = groupedPools.get(state)!;
      const allUsers = [
        ...(entry.initial?.users || []),
        ...(entry.followUp?.users || []),
      ];
      return allUsers.some((user) => user.toLowerCase().includes(query));
    });
  }, [groupedPools, searchQuery]);

  if (filteredStates.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground bg-white/50 rounded-xl">
        No states found matching your search.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {filteredStates.map((state, index) => {
        const entry = groupedPools.get(state)!;
        const isExpanded = expandedStates.has(state);
        const colorScheme = stateColors[index % stateColors.length];

        // Get users for each visit type
        const initialUsers = entry.initial?.users || [];
        const followUpUsers = entry.followUp?.users || [];

        // Filter by exclusion and search
        const query = searchQuery.toLowerCase();
        const getFilteredUsers = (users: string[], visitType: VisitType) => {
          return users
            .filter((u) => !query || u.toLowerCase().includes(query))
            .filter((u) => showExcluded || !isExcluded(u, state, program, visitType));
        };

        const visibleInitial = getFilteredUsers(initialUsers, "Initial");
        const visibleFollowUp = getFilteredUsers(followUpUsers, "Follow Up");
        
        const excludedInitial = initialUsers.filter((u) => isExcluded(u, state, program, "Initial")).length;
        const excludedFollowUp = followUpUsers.filter((u) => isExcluded(u, state, program, "Follow Up")).length;

        return (
          <Card 
            key={state} 
            className={`h-fit transition-all duration-300 hover:shadow-xl border-l-4 ${colorScheme.border} bg-gradient-to-br ${colorScheme.bg} hover:scale-[1.02]`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Link href={getStateRoute(program, state)} className="flex-1">
                  <CardTitle className="flex items-center gap-2 text-lg hover:text-primary transition-colors">
                    <div className={`p-1.5 rounded-md ${colorScheme.accent} text-white`}>
                      <MapPin className="h-3.5 w-3.5" />
                    </div>
                    {state}
                  </CardTitle>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpanded(state)}
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
              {/* Initial and Follow Up counts */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="bg-white/60 rounded-lg p-2 border border-emerald-200">
                  <div className="flex items-center gap-1 text-xs text-emerald-700 font-medium mb-1">
                    <UserPlus2 className="h-3 w-3" />
                    Initial
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xl font-bold text-emerald-800">{visibleInitial.length}</span>
                    {excludedInitial > 0 && !showExcluded && (
                      <Badge className="text-[10px] bg-amber-500 text-white px-1">+{excludedInitial}</Badge>
                    )}
                  </div>
                </div>
                <div className="bg-white/60 rounded-lg p-2 border border-blue-200">
                  <div className="flex items-center gap-1 text-xs text-blue-700 font-medium mb-1">
                    <RefreshCw className="h-3 w-3" />
                    Follow Up
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xl font-bold text-blue-800">{visibleFollowUp.length}</span>
                    {excludedFollowUp > 0 && !showExcluded && (
                      <Badge className="text-[10px] bg-amber-500 text-white px-1">+{excludedFollowUp}</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Expandable user list */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-white/50 space-y-3 max-h-80 overflow-y-auto">
                  {/* Initial Users */}
                  <div>
                    <h4 className="text-xs font-semibold text-emerald-700 flex items-center gap-1 mb-2">
                      <UserPlus2 className="h-3 w-3" />
                      Initial (New Patient)
                    </h4>
                    {visibleInitial.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No users</p>
                    ) : (
                      <div className="space-y-1">
                        {visibleInitial.map((user, idx) => {
                          const excluded = isExcluded(user, state, program, "Initial");
                          return (
                            <UserRow
                              key={`initial-${user}-${idx}`}
                              user={user}
                              excluded={excluded}
                              onToggle={() => toggleExcluded(user, state, program, "Initial")}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Follow Up Users */}
                  <div>
                    <h4 className="text-xs font-semibold text-blue-700 flex items-center gap-1 mb-2">
                      <RefreshCw className="h-3 w-3" />
                      Follow Up
                    </h4>
                    {visibleFollowUp.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No users</p>
                    ) : (
                      <div className="space-y-1">
                        {visibleFollowUp.map((user, idx) => {
                          const excluded = isExcluded(user, state, program, "Follow Up");
                          return (
                            <UserRow
                              key={`followup-${user}-${idx}`}
                              user={user}
                              excluded={excluded}
                              onToggle={() => toggleExcluded(user, state, program, "Follow Up")}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!isExpanded && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpanded(state)}
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

function UserRow({ 
  user, 
  excluded, 
  onToggle 
}: { 
  user: string; 
  excluded: boolean; 
  onToggle: () => void;
}) {
  return (
    <div
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
        onClick={onToggle}
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
}
