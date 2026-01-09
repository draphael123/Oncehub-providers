"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StateGrid } from "@/components/StateGrid";
import { SearchBar } from "@/components/SearchBar";
import { useExclusions } from "@/lib/useExclusions";
import { ResourcePool, Program, ExclusionsData } from "@/lib/types";
import { getAllUsersRoute } from "@/lib/route";
import { Users, MapPin, UserX, LayoutGrid, BarChart3, Leaf, Pill, Layers, UserPlus2, RefreshCw } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<string>("both");
  const [searchQuery, setSearchQuery] = useState("");
  
  const {
    isExcluded,
    toggleExcluded,
    showExcluded,
    setShowExcluded,
    getTotalExcludedCount,
    isLoaded,
  } = useExclusions(serverExclusions);

  // Compute stats for HRT
  const hrtStats = useMemo(() => {
    let initialCount = 0;
    let followUpCount = 0;
    let excludedCount = 0;
    const uniqueUsers = new Set<string>();
    
    hrtPools.forEach((pool) => {
      pool.users.forEach((user) => {
        if (isExcluded(user, pool.state, "HRT", pool.visitType)) {
          excludedCount++;
        } else {
          uniqueUsers.add(user);
          if (pool.visitType === "Initial") {
            initialCount++;
          } else {
            followUpCount++;
          }
        }
      });
    });

    const states = new Set(hrtPools.map(p => p.state));

    return {
      totalStates: states.size,
      totalUsers: uniqueUsers.size,
      initialCount,
      followUpCount,
      excludedCount,
    };
  }, [hrtPools, isExcluded]);

  // Compute stats for TRT
  const trtStats = useMemo(() => {
    let initialCount = 0;
    let followUpCount = 0;
    let excludedCount = 0;
    const uniqueUsers = new Set<string>();
    
    trtPools.forEach((pool) => {
      pool.users.forEach((user) => {
        if (isExcluded(user, pool.state, "TRT", pool.visitType)) {
          excludedCount++;
        } else {
          uniqueUsers.add(user);
          if (pool.visitType === "Initial") {
            initialCount++;
          } else {
            followUpCount++;
          }
        }
      });
    });

    const states = new Set(trtPools.map(p => p.state));

    return {
      totalStates: states.size,
      totalUsers: uniqueUsers.size,
      initialCount,
      followUpCount,
      excludedCount,
    };
  }, [trtPools, isExcluded]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Loading...</div>
      </div>
    );
  }

  const hrtExcludedCount = getTotalExcludedCount("HRT");
  const trtExcludedCount = getTotalExcludedCount("TRT");

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b sticky top-0 z-10 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white shadow-lg">
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
              <Link href="/combined">
                <Button variant="secondary" size="sm" className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30">
                  <Layers className="h-4 w-4" />
                  Combined View
                </Button>
              </Link>
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
        {/* Quick Links to Both Programs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/all/hrt">
            <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer">
              <CardContent className="pt-6 pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-xl">
                      <Leaf className="h-8 w-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">HRT Program</h2>
                      <p className="text-white/80 text-sm">Hormone Replacement Therapy</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-bold">{hrtStats.totalStates}</p>
                    <p className="text-white/80 text-sm">States</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-4 gap-2">
                  <div className="text-center">
                    <span className="text-xl font-bold">{hrtStats.totalUsers}</span>
                    <p className="text-white/70 text-xs">Users</p>
                  </div>
                  <div className="text-center">
                    <span className="text-xl font-bold flex items-center justify-center gap-1">
                      <UserPlus2 className="h-4 w-4" />{hrtStats.initialCount}
                    </span>
                    <p className="text-white/70 text-xs">Initial</p>
                  </div>
                  <div className="text-center">
                    <span className="text-xl font-bold flex items-center justify-center gap-1">
                      <RefreshCw className="h-4 w-4" />{hrtStats.followUpCount}
                    </span>
                    <p className="text-white/70 text-xs">Follow Up</p>
                  </div>
                  <div className="text-center">
                    <span className="text-xl font-bold">{hrtStats.excludedCount}</span>
                    <p className="text-white/70 text-xs">Excluded</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/all/trt">
            <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer">
              <CardContent className="pt-6 pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-xl">
                      <Pill className="h-8 w-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">TRT Program</h2>
                      <p className="text-white/80 text-sm">Testosterone Replacement Therapy</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-bold">{trtStats.totalStates}</p>
                    <p className="text-white/80 text-sm">States</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-4 gap-2">
                  <div className="text-center">
                    <span className="text-xl font-bold">{trtStats.totalUsers}</span>
                    <p className="text-white/70 text-xs">Users</p>
                  </div>
                  <div className="text-center">
                    <span className="text-xl font-bold flex items-center justify-center gap-1">
                      <UserPlus2 className="h-4 w-4" />{trtStats.initialCount}
                    </span>
                    <p className="text-white/70 text-xs">Initial</p>
                  </div>
                  <div className="text-center">
                    <span className="text-xl font-bold flex items-center justify-center gap-1">
                      <RefreshCw className="h-4 w-4" />{trtStats.followUpCount}
                    </span>
                    <p className="text-white/70 text-xs">Follow Up</p>
                  </div>
                  <div className="text-center">
                    <span className="text-xl font-bold">{trtStats.excludedCount}</span>
                    <p className="text-white/70 text-xs">Excluded</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Controls */}
        <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="w-full sm:w-80">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search users or states..."
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
                    {(hrtExcludedCount + trtExcludedCount) > 0 && (
                      <Badge className="ml-2 bg-amber-500 hover:bg-amber-600">
                        {hrtExcludedCount + trtExcludedCount}
                      </Badge>
                    )}
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabbed Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-3 mx-auto">
            <TabsTrigger value="both" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              Both Programs
            </TabsTrigger>
            <TabsTrigger value="hrt" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              HRT Only
            </TabsTrigger>
            <TabsTrigger value="trt" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              TRT Only
            </TabsTrigger>
          </TabsList>

          <TabsContent value="both" className="space-y-8">
            {/* HRT Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm px-3 py-1">
                    <Leaf className="h-4 w-4 mr-1" />
                    HRT
                  </Badge>
                  <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Resource Pools
                  </span>
                </h2>
                <Link href={getAllUsersRoute("HRT")}>
                  <Button variant="outline" size="sm" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                    View All HRT Users
                  </Button>
                </Link>
              </div>
              <StateGrid
                resourcePools={hrtPools}
                program="HRT"
                searchQuery={searchQuery}
                isExcluded={isExcluded}
                toggleExcluded={toggleExcluded}
                showExcluded={showExcluded}
              />
            </div>

            {/* TRT Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Badge className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1">
                    <Pill className="h-4 w-4 mr-1" />
                    TRT
                  </Badge>
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Resource Pools
                  </span>
                </h2>
                <Link href={getAllUsersRoute("TRT")}>
                  <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                    View All TRT Users
                  </Button>
                </Link>
              </div>
              <StateGrid
                resourcePools={trtPools}
                program="TRT"
                searchQuery={searchQuery}
                isExcluded={isExcluded}
                toggleExcluded={toggleExcluded}
                showExcluded={showExcluded}
              />
            </div>
          </TabsContent>

          <TabsContent value="hrt">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm px-3 py-1">
                  <Leaf className="h-4 w-4 mr-1" />
                  HRT
                </Badge>
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Resource Pools
                </span>
              </h2>
              <Link href={getAllUsersRoute("HRT")}>
                <Button variant="outline" size="sm" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                  View All HRT Users
                </Button>
              </Link>
            </div>
            <StateGrid
              resourcePools={hrtPools}
              program="HRT"
              searchQuery={searchQuery}
              isExcluded={isExcluded}
              toggleExcluded={toggleExcluded}
              showExcluded={showExcluded}
            />
          </TabsContent>

          <TabsContent value="trt">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Badge className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1">
                  <Pill className="h-4 w-4 mr-1" />
                  TRT
                </Badge>
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Resource Pools
                </span>
              </h2>
              <Link href={getAllUsersRoute("TRT")}>
                <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                  View All TRT Users
                </Button>
              </Link>
            </div>
            <StateGrid
              resourcePools={trtPools}
              program="TRT"
              searchQuery={searchQuery}
              isExcluded={isExcluded}
              toggleExcluded={toggleExcluded}
              showExcluded={showExcluded}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <p className="text-xs text-center text-muted-foreground">
            Resource Pool Viewer • Exclusions are per-state per-visit-type • Overrides stored in browser localStorage
          </p>
        </div>
      </footer>
    </div>
  );
}
