"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ProgramTabs } from "@/components/ProgramTabs";
import { StateGrid } from "@/components/StateGrid";
import { SearchBar } from "@/components/SearchBar";
import { useExclusions } from "@/lib/useExclusions";
import { ResourcePool, Program, ExclusionsData } from "@/lib/types";
import { getAllUsersRoute } from "@/lib/route";
import { Users, MapPin, UserX, LayoutGrid } from "lucide-react";

interface DashboardClientProps {
  hrtPools: ResourcePool[];
  trtPools: ResourcePool[];
  serverExclusions: ExclusionsData;
}

export function DashboardClient({
  hrtPools,
  trtPools,
  serverExclusions,
}: DashboardClientProps) {
  const [activeProgram, setActiveProgram] = useState<Program>("HRT");
  const [searchQuery, setSearchQuery] = useState("");
  
  const {
    isExcluded,
    toggleExcluded,
    showExcluded,
    setShowExcluded,
    excludedCount,
    isLoaded,
  } = useExclusions(serverExclusions);

  const activePools = activeProgram === "HRT" ? hrtPools : trtPools;

  // Compute stats
  const stats = useMemo(() => {
    const totalStates = activePools.length;
    const allUsers = activePools.flatMap((p) => p.users);
    const uniqueUsers = new Set(allUsers);
    const totalUsers = uniqueUsers.size;
    const excludedInProgram = Array.from(uniqueUsers).filter((u) => isExcluded(u)).length;
    const activeUsers = totalUsers - excludedInProgram;

    return {
      totalStates,
      totalUsers,
      activeUsers,
      excludedInProgram,
    };
  }, [activePools, isExcluded]);

  // Show loading state until localStorage is loaded
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
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Resource Pool Viewer
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage HRT and TRT resource assignments
              </p>
            </div>
            <ProgramTabs
              activeProgram={activeProgram}
              onProgramChange={setActiveProgram}
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalStates}</p>
                  <p className="text-xs text-muted-foreground">States</p>
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
                  <p className="text-2xl font-bold">{stats.activeUsers}</p>
                  <p className="text-xs text-muted-foreground">Active Users</p>
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
                  <p className="text-2xl font-bold">{stats.excludedInProgram}</p>
                  <p className="text-xs text-muted-foreground">Excluded</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-sky-500/10">
                  <LayoutGrid className="h-5 w-5 text-sky-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  <p className="text-xs text-muted-foreground">Total Unique</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="w-full sm:w-80">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={`Search ${activeProgram} users or states...`}
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="show-excluded"
                checked={showExcluded}
                onCheckedChange={setShowExcluded}
              />
              <Label htmlFor="show-excluded" className="text-sm cursor-pointer">
                Show excluded
                {excludedCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {excludedCount}
                  </Badge>
                )}
              </Label>
            </div>
            <Link href={getAllUsersRoute(activeProgram)}>
              <Button variant="outline" size="sm">
                View All Users
              </Button>
            </Link>
          </div>
        </div>

        {/* State Grid */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={activeProgram === "HRT" ? "border-emerald-500 text-emerald-600" : "border-sky-500 text-sky-600"}
            >
              {activeProgram}
            </Badge>
            Resource Pools
          </h2>
          <StateGrid
            resourcePools={activePools}
            program={activeProgram}
            searchQuery={searchQuery}
            isExcluded={isExcluded}
            toggleExcluded={toggleExcluded}
            showExcluded={showExcluded}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-4">
          <p className="text-xs text-center text-muted-foreground">
            Resource Pool Viewer • Exclusion overrides stored in browser localStorage
          </p>
        </div>
      </footer>
    </div>
  );
}

