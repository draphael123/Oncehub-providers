"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { SearchBar } from "@/components/SearchBar";
import { UserTable } from "@/components/UserTable";
import { ExportButton } from "@/components/ExportButton";
import { useExclusions } from "@/lib/useExclusions";
import { ResourcePool, Program, ExclusionsData } from "@/lib/types";
import { getAllUsers } from "@/lib/parseResourcePoolCsv";
import { ArrowLeft, Users, UserX, MapPin } from "lucide-react";

interface AllUsersClientProps {
  program: Program;
  resourcePools: ResourcePool[];
  serverExclusions: ExclusionsData;
}

type ExclusionFilter = "all" | "excluded" | "active";

export function AllUsersClient({
  program,
  resourcePools,
  serverExclusions,
}: AllUsersClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [exclusionFilter, setExclusionFilter] = useState<ExclusionFilter>("all");

  const {
    isExcluded,
    toggleExcluded,
    isLoaded,
  } = useExclusions(serverExclusions);

  // Get all states for dropdown
  const states = useMemo(() => {
    return resourcePools.map((p) => p.state).sort();
  }, [resourcePools]);

  // Get all users across all pools
  const allUsers = useMemo(() => {
    return getAllUsers(resourcePools);
  }, [resourcePools]);

  // Filter users with state-specific exclusion check
  const filteredUsers = useMemo(() => {
    const query = searchQuery.toLowerCase();

    return allUsers
      .map((user) => ({
        name: user.name,
        state: user.state,
        isExcluded: isExcluded(user.name, user.state, program),
      }))
      .filter((user) => {
        // Filter by search
        if (query) {
          const matchesName = user.name.toLowerCase().includes(query);
          const matchesState = user.state.toLowerCase().includes(query);
          if (!matchesName && !matchesState) return false;
        }
        // Filter by state
        if (stateFilter !== "all" && user.state !== stateFilter) {
          return false;
        }
        // Filter by exclusion status
        if (exclusionFilter === "excluded" && !user.isExcluded) return false;
        if (exclusionFilter === "active" && user.isExcluded) return false;
        
        return true;
      });
  }, [allUsers, searchQuery, stateFilter, exclusionFilter, isExcluded, program]);

  // Stats with state-specific exclusion check
  const stats = useMemo(() => {
    const total = allUsers.length;
    const excluded = allUsers.filter((u) => isExcluded(u.name, u.state, program)).length;
    const active = total - excluded;
    const stateCount = states.length;
    return { total, excluded, active, stateCount };
  }, [allUsers, states.length, isExcluded, program]);

  // Export data
  const exportData = useMemo(() => {
    return filteredUsers.map((u) => ({
      name: u.name,
      state: u.state,
      isExcluded: u.isExcluded,
    }));
  }, [filteredUsers]);

  // Handle toggle - need to know which state the user is in
  const handleToggleExcluded = (name: string) => {
    // Find the user's state from filtered list
    const user = filteredUsers.find((u) => u.name === name);
    if (user) {
      toggleExcluded(name, user.state, program);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Loading...</div>
      </div>
    );
  }

  const isHRT = program === "HRT";

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className={`border-b sticky top-0 z-10 ${isHRT ? 'bg-gradient-to-r from-emerald-600 to-teal-600' : 'bg-gradient-to-r from-blue-600 to-indigo-600'} text-white shadow-lg`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2 text-white hover:bg-white/20">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <Badge className={`${isHRT ? 'bg-emerald-700' : 'bg-blue-700'}`}>
                {program}
              </Badge>
              <h1 className="text-xl font-bold">All Users</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-violet-500 to-purple-600 text-white border-0 shadow-lg">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.stateCount}</p>
                  <p className="text-xs text-white/80">States</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white border-0 shadow-lg">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-white/80">Total Assignments</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white border-0 shadow-lg">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-xs text-white/80">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 shadow-lg">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20">
                  <UserX className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.excluded}</p>
                  <p className="text-xs text-white/80">Excluded</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-4">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end justify-between">
              <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                <div className="w-full sm:w-80">
                  <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search users or states..."
                  />
                </div>
                <div className="flex gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">State</Label>
                    <Select value={stateFilter} onValueChange={setStateFilter}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="All states" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All states</SelectItem>
                        {states.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <Select
                      value={exclusionFilter}
                      onValueChange={(v) => setExclusionFilter(v as ExclusionFilter)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="active">Active only</SelectItem>
                        <SelectItem value="excluded">Excluded only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <ExportButton
                users={exportData}
                filename={`${program}_all_users.csv`}
              />
            </div>
          </CardContent>
        </Card>

        {/* Results info */}
        <div className="text-sm text-muted-foreground">
          Showing {filteredUsers.length} of {stats.total} assignments
          {searchQuery && ` matching "${searchQuery}"`}
          {stateFilter !== "all" && ` in ${stateFilter}`}
          {exclusionFilter !== "all" && ` (${exclusionFilter})`}
        </div>

        {/* User Table */}
        <UserTable
          users={filteredUsers}
          showStateColumn
          onToggleExcluded={handleToggleExcluded}
        />
      </main>
    </div>
  );
}
