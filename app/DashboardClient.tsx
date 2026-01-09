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
import { Users, MapPin, UserX, LayoutGrid, BarChart3 } from "lucide-react";

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
    getTotalExcludedCount,
    isLoaded,
  } = useExclusions(serverExclusions);

  const activePools = activeProgram === "HRT" ? hrtPools : trtPools;

  // Compute stats
  const stats = useMemo(() => {
    const totalStates = activePools.length;
    
    // Count users per state (excluding those excluded in that state)
    let activeUserCount = 0;
    let excludedCount = 0;
    const uniqueActiveUsers = new Set<string>();
    
    activePools.forEach((pool) => {
      pool.users.forEach((user) => {
        if (isExcluded(user, pool.state, activeProgram)) {
          excludedCount++;
        } else {
          activeUserCount++;
          uniqueActiveUsers.add(user);
        }
      });
    });

    return {
      totalStates,
      totalUsers: uniqueActiveUsers.size,
      activeUsers: activeUserCount,
      excludedInProgram: excludedCount,
    };
  }, [activePools, activeProgram, isExcluded]);

  // Show loading state until localStorage is loaded
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Loading...</div>
      </div>
    );
  }

  const isHRT = activeProgram === "HRT";
  const excludedCount = getTotalExcludedCount(activeProgram);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className={`border-b sticky top-0 z-10 ${isHRT ? 'bg-gradient-to-r from-emerald-600 to-teal-600' : 'bg-gradient-to-r from-blue-600 to-indigo-600'} text-white shadow-lg`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <div className="p-2 bg-white/20 rounded-lg">
                  <LayoutGrid className="h-6 w-6" />
                </div>
                Resource Pool Viewer
              </h1>
              <p className="text-sm text-white/80 mt-1">
                Manage HRT and TRT resource assignments
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ProgramTabs
                activeProgram={activeProgram}
                onProgramChange={setActiveProgram}
              />
              <Link href="/reports">
                <Button variant="secondary" size="sm" className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30">
                  <BarChart3 className="h-4 w-4" />
                  Reports
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-violet-500 to-purple-600 text-white border-0 shadow-lg shadow-purple-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{stats.totalStates}</p>
                  <p className="text-xs text-white/80">States</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white border-0 shadow-lg shadow-emerald-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{stats.totalUsers}</p>
                  <p className="text-xs text-white/80">Unique Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 shadow-lg shadow-amber-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20">
                  <UserX className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{stats.excludedInProgram}</p>
                  <p className="text-xs text-white/80">Excluded Assignments</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white border-0 shadow-lg shadow-blue-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20">
                  <LayoutGrid className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{stats.activeUsers}</p>
                  <p className="text-xs text-white/80">Active Assignments</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="w-full sm:w-80">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder={`Search ${activeProgram} users or states...`}
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                  <Switch
                    id="show-excluded"
                    checked={showExcluded}
                    onCheckedChange={setShowExcluded}
                  />
                  <Label htmlFor="show-excluded" className="text-sm cursor-pointer text-amber-800">
                    Show excluded
                    {excludedCount > 0 && (
                      <Badge className="ml-2 bg-amber-500 hover:bg-amber-600">
                        {excludedCount}
                      </Badge>
                    )}
                  </Label>
                </div>
                <Link href={getAllUsersRoute(activeProgram)}>
                  <Button variant="outline" size="sm" className={`${isHRT ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50' : 'border-blue-300 text-blue-700 hover:bg-blue-50'}`}>
                    View All Users
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* State Grid */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Badge 
              className={`${isHRT ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
            >
              {activeProgram}
            </Badge>
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Resource Pools
            </span>
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
      <footer className="border-t mt-12 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <p className="text-xs text-center text-muted-foreground">
            Resource Pool Viewer • Exclusions are per-state • Overrides stored in browser localStorage
          </p>
        </div>
      </footer>
    </div>
  );
}
