"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchBar } from "@/components/SearchBar";
import { ExportButton } from "@/components/ExportButton";
import { useExclusions } from "@/lib/useExclusions";
import { ResourcePool, ExclusionsData } from "@/lib/types";
import { 
  ArrowLeft, 
  Users, 
  MapPin, 
  Leaf,
  Pill,
  LayoutGrid,
  CheckCircle2,
  XCircle
} from "lucide-react";

interface CombinedClientProps {
  hrtPools: ResourcePool[];
  trtPools: ResourcePool[];
  serverExclusions: ExclusionsData;
}

type ViewMode = "by-user" | "by-state";
type ProgramFilter = "all" | "both" | "hrt-only" | "trt-only";

export function CombinedClient({
  hrtPools,
  trtPools,
  serverExclusions,
}: CombinedClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("by-user");
  const [programFilter, setProgramFilter] = useState<ProgramFilter>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");

  const { isExcluded, showExcluded, setShowExcluded, isLoaded } = useExclusions(serverExclusions);

  // Get all unique states from both programs
  const allStates = useMemo(() => {
    const states = new Set<string>();
    hrtPools.forEach((p) => states.add(p.state));
    trtPools.forEach((p) => states.add(p.state));
    return Array.from(states).sort();
  }, [hrtPools, trtPools]);

  // Combined user data
  const combinedUsers = useMemo(() => {
    const userMap = new Map<string, {
      name: string;
      hrtStates: string[];
      trtStates: string[];
      hrtActiveStates: string[];
      trtActiveStates: string[];
    }>();

    // Process HRT
    hrtPools.forEach((pool) => {
      pool.users.forEach((user) => {
        const existing = userMap.get(user) || {
          name: user,
          hrtStates: [],
          trtStates: [],
          hrtActiveStates: [],
          trtActiveStates: [],
        };
        existing.hrtStates.push(pool.state);
        if (!isExcluded(user, pool.state, "HRT")) {
          existing.hrtActiveStates.push(pool.state);
        }
        userMap.set(user, existing);
      });
    });

    // Process TRT
    trtPools.forEach((pool) => {
      pool.users.forEach((user) => {
        const existing = userMap.get(user) || {
          name: user,
          hrtStates: [],
          trtStates: [],
          hrtActiveStates: [],
          trtActiveStates: [],
        };
        existing.trtStates.push(pool.state);
        if (!isExcluded(user, pool.state, "TRT")) {
          existing.trtActiveStates.push(pool.state);
        }
        userMap.set(user, existing);
      });
    });

    return Array.from(userMap.values());
  }, [hrtPools, trtPools, isExcluded]);

  // Combined state data
  const combinedStates = useMemo(() => {
    return allStates.map((state) => {
      const hrtPool = hrtPools.find((p) => p.state === state);
      const trtPool = trtPools.find((p) => p.state === state);

      const hrtUsers = hrtPool?.users || [];
      const trtUsers = trtPool?.users || [];
      const hrtActiveUsers = hrtUsers.filter((u) => !isExcluded(u, state, "HRT"));
      const trtActiveUsers = trtUsers.filter((u) => !isExcluded(u, state, "TRT"));

      // Users in both programs for this state
      const bothUsers = hrtActiveUsers.filter((u) => trtActiveUsers.includes(u));

      return {
        state,
        hrtUsers: hrtActiveUsers,
        trtUsers: trtActiveUsers,
        bothUsers,
        hrtOnly: hrtActiveUsers.filter((u) => !trtActiveUsers.includes(u)),
        trtOnly: trtActiveUsers.filter((u) => !hrtActiveUsers.includes(u)),
      };
    });
  }, [allStates, hrtPools, trtPools, isExcluded]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    const query = searchQuery.toLowerCase();

    return combinedUsers
      .filter((user) => {
        // Search filter
        if (query && !user.name.toLowerCase().includes(query)) {
          return false;
        }

        // Show excluded filter
        const hasActiveHrt = user.hrtActiveStates.length > 0;
        const hasActiveTrt = user.trtActiveStates.length > 0;
        if (!showExcluded && !hasActiveHrt && !hasActiveTrt) {
          return false;
        }

        // Program filter
        const inHrt = showExcluded ? user.hrtStates.length > 0 : hasActiveHrt;
        const inTrt = showExcluded ? user.trtStates.length > 0 : hasActiveTrt;

        if (programFilter === "both" && !(inHrt && inTrt)) return false;
        if (programFilter === "hrt-only" && !(inHrt && !inTrt)) return false;
        if (programFilter === "trt-only" && !(!inHrt && inTrt)) return false;

        // State filter
        if (stateFilter !== "all") {
          const inHrtState = user.hrtActiveStates.includes(stateFilter) || (showExcluded && user.hrtStates.includes(stateFilter));
          const inTrtState = user.trtActiveStates.includes(stateFilter) || (showExcluded && user.trtStates.includes(stateFilter));
          if (!inHrtState && !inTrtState) return false;
        }

        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [combinedUsers, searchQuery, programFilter, stateFilter, showExcluded]);

  // Filtered states
  const filteredStates = useMemo(() => {
    const query = searchQuery.toLowerCase();

    return combinedStates.filter((state) => {
      if (query && !state.state.toLowerCase().includes(query)) {
        return false;
      }
      return true;
    });
  }, [combinedStates, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const inBoth = combinedUsers.filter(
      (u) => u.hrtActiveStates.length > 0 && u.trtActiveStates.length > 0
    ).length;
    const hrtOnly = combinedUsers.filter(
      (u) => u.hrtActiveStates.length > 0 && u.trtActiveStates.length === 0
    ).length;
    const trtOnly = combinedUsers.filter(
      (u) => u.hrtActiveStates.length === 0 && u.trtActiveStates.length > 0
    ).length;
    const totalUsers = combinedUsers.filter(
      (u) => u.hrtActiveStates.length > 0 || u.trtActiveStates.length > 0
    ).length;

    return { inBoth, hrtOnly, trtOnly, totalUsers, totalStates: allStates.length };
  }, [combinedUsers, allStates]);

  // Export data
  const exportData = useMemo(() => {
    return filteredUsers.map((u) => ({
      Name: u.name,
      "HRT States": u.hrtActiveStates.length,
      "TRT States": u.trtActiveStates.length,
      "In Both": u.hrtActiveStates.length > 0 && u.trtActiveStates.length > 0 ? "Yes" : "No",
    }));
  }, [filteredUsers]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b sticky top-0 z-10 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2 text-white hover:bg-white/20">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <LayoutGrid className="h-6 w-6" />
                  </div>
                  Combined HRT + TRT View
                </h1>
                <p className="text-sm text-white/80 mt-1">
                  See providers across both programs
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-violet-500 to-purple-600 text-white border-0 shadow-lg">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  <p className="text-xs text-white/80">Total Providers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 shadow-lg">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.inBoth}</p>
                  <p className="text-xs text-white/80">In Both Programs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-lg">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20">
                  <Leaf className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.hrtOnly}</p>
                  <p className="text-xs text-white/80">HRT Only</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-lg">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20">
                  <Pill className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.trtOnly}</p>
                  <p className="text-xs text-white/80">TRT Only</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-rose-500 to-pink-600 text-white border-0 shadow-lg">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalStates}</p>
                  <p className="text-xs text-white/80">Total States</p>
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
                <div className="w-full sm:w-64">
                  <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search providers or states..."
                  />
                </div>
                <div className="flex gap-3 flex-wrap">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">View</Label>
                    <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                      <SelectTrigger className="w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="by-user">By Provider</SelectItem>
                        <SelectItem value="by-state">By State</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {viewMode === "by-user" && (
                    <>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Program</Label>
                        <Select value={programFilter} onValueChange={(v) => setProgramFilter(v as ProgramFilter)}>
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="both">In Both</SelectItem>
                            <SelectItem value="hrt-only">HRT Only</SelectItem>
                            <SelectItem value="trt-only">TRT Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">State</Label>
                        <Select value={stateFilter} onValueChange={setStateFilter}>
                          <SelectTrigger className="w-[150px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All States</SelectItem>
                            {allStates.map((state) => (
                              <SelectItem key={state} value={state}>{state}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </div>
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
                  </Label>
                </div>
                {viewMode === "by-user" && (
                  <ExportButton
                    users={exportData.map(e => ({ name: e.Name }))}
                    filename="combined_providers.csv"
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* By User View */}
        {viewMode === "by-user" && (
          <>
            <div className="text-sm text-muted-foreground">
              Showing {filteredUsers.length} providers
            </div>
            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Provider</TableHead>
                      <TableHead className="font-semibold text-center">
                        <span className="flex items-center justify-center gap-1">
                          <Leaf className="h-4 w-4 text-emerald-600" />
                          HRT States
                        </span>
                      </TableHead>
                      <TableHead className="font-semibold text-center">
                        <span className="flex items-center justify-center gap-1">
                          <Pill className="h-4 w-4 text-blue-600" />
                          TRT States
                        </span>
                      </TableHead>
                      <TableHead className="font-semibold text-center">Programs</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.slice(0, 100).map((user) => {
                      const inHrt = user.hrtActiveStates.length > 0;
                      const inTrt = user.trtActiveStates.length > 0;
                      const inBoth = inHrt && inTrt;

                      return (
                        <TableRow key={user.name} className={inBoth ? "bg-amber-50/50" : ""}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell className="text-center">
                            {user.hrtActiveStates.length > 0 ? (
                              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200">
                                {user.hrtActiveStates.length}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {user.trtActiveStates.length > 0 ? (
                              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                                {user.trtActiveStates.length}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {inBoth ? (
                              <Badge className="bg-amber-500 text-white">Both</Badge>
                            ) : inHrt ? (
                              <Badge className="bg-emerald-500 text-white">HRT</Badge>
                            ) : inTrt ? (
                              <Badge className="bg-blue-500 text-white">TRT</Badge>
                            ) : (
                              <Badge variant="secondary">None</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {filteredUsers.length > 100 && (
                <div className="p-4 text-center text-sm text-muted-foreground border-t">
                  Showing first 100 of {filteredUsers.length} providers
                </div>
              )}
            </Card>
          </>
        )}

        {/* By State View */}
        {viewMode === "by-state" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStates.map((state) => (
              <Card key={state.state} className="border-0 shadow-lg bg-white/90 backdrop-blur-sm overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-violet-500 to-purple-500 text-white py-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="h-4 w-4" />
                    {state.state}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Leaf className="h-4 w-4 text-emerald-600" />
                        <span className="font-medium text-emerald-800">HRT</span>
                      </div>
                      <p className="text-2xl font-bold text-emerald-700">{state.hrtUsers.length}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Pill className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-800">TRT</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-700">{state.trtUsers.length}</p>
                    </div>
                  </div>
                  {state.bothUsers.length > 0 && (
                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-4 w-4 text-amber-600" />
                        <span className="font-medium text-amber-800">In Both ({state.bothUsers.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {state.bothUsers.slice(0, 5).map((user) => (
                          <Badge key={user} variant="secondary" className="text-xs bg-amber-100 text-amber-700">
                            {user}
                          </Badge>
                        ))}
                        {state.bothUsers.length > 5 && (
                          <Badge variant="secondary" className="text-xs">+{state.bothUsers.length - 5} more</Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <p className="text-xs text-center text-muted-foreground">
            Resource Pool Viewer • Combined HRT + TRT View
          </p>
        </div>
      </footer>
    </div>
  );
}

