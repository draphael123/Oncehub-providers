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

  // Filter users
  const filteredUsers = useMemo(() => {
    const query = searchQuery.toLowerCase();

    return allUsers
      .map((user) => ({
        name: user.name,
        state: user.state,
        isExcluded: isExcluded(user.name),
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
  }, [allUsers, searchQuery, stateFilter, exclusionFilter, isExcluded]);

  // Stats
  const stats = useMemo(() => {
    const total = allUsers.length;
    const excluded = allUsers.filter((u) => isExcluded(u.name)).length;
    const active = total - excluded;
    const stateCount = states.length;
    return { total, excluded, active, stateCount };
  }, [allUsers, states.length, isExcluded]);

  // Export data
  const exportData = useMemo(() => {
    return filteredUsers.map((u) => ({
      name: u.name,
      state: u.state,
      isExcluded: u.isExcluded,
    }));
  }, [filteredUsers]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className={
                  program === "HRT"
                    ? "border-emerald-500 text-emerald-600"
                    : "border-sky-500 text-sky-600"
                }
              >
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
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.stateCount}</p>
                  <p className="text-xs text-muted-foreground">States</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-sky-500/10">
                  <Users className="h-5 w-5 text-sky-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <Users className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <UserX className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.excluded}</p>
                  <p className="text-xs text-muted-foreground">Excluded</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
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

        {/* Results info */}
        <div className="text-sm text-muted-foreground">
          Showing {filteredUsers.length} of {stats.total} users
          {searchQuery && ` matching "${searchQuery}"`}
          {stateFilter !== "all" && ` in ${stateFilter}`}
          {exclusionFilter !== "all" && ` (${exclusionFilter})`}
        </div>

        {/* User Table */}
        <UserTable
          users={filteredUsers}
          showStateColumn
          onToggleExcluded={toggleExcluded}
        />
      </main>
    </div>
  );
}

