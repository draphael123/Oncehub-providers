"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResourcePool, Program } from "@/lib/types";
import { getStateRoute } from "@/lib/route";
import { MapPin, Users } from "lucide-react";

interface StateGridProps {
  resourcePools: ResourcePool[];
  program: Program;
  searchQuery: string;
  isExcluded: (name: string) => boolean;
  showExcluded: boolean;
}

export function StateGrid({
  resourcePools,
  program,
  searchQuery,
  isExcluded,
  showExcluded,
}: StateGridProps) {
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
        const visibleUsers = showExcluded
          ? pool.users
          : pool.users.filter((u) => !isExcluded(u));
        const excludedInState = pool.users.filter((u) => isExcluded(u)).length;

        return (
          <Link
            key={pool.state}
            href={getStateRoute(program, pool.state)}
            className="block transition-transform hover:scale-[1.02]"
          >
            <Card className="h-full hover:shadow-lg transition-shadow border-l-4 border-l-transparent hover:border-l-primary">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {pool.state}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold">{visibleUsers.length}</span>
                  <span className="text-sm text-muted-foreground">users</span>
                </div>
                {excludedInState > 0 && !showExcluded && (
                  <Badge variant="secondary" className="mt-2 text-xs">
                    +{excludedInState} excluded
                  </Badge>
                )}
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

