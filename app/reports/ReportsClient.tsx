"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProgramTabs } from "@/components/ProgramTabs";
import { useExclusions } from "@/lib/useExclusions";
import { ResourcePool, Program, ExclusionsData } from "@/lib/types";
import { 
  ArrowLeft, 
  Users, 
  MapPin, 
  TrendingUp, 
  TrendingDown,
  Award,
  BarChart3,
  Crown,
  Target
} from "lucide-react";

interface ReportsClientProps {
  hrtPools: ResourcePool[];
  trtPools: ResourcePool[];
  serverExclusions: ExclusionsData;
}

export function ReportsClient({
  hrtPools,
  trtPools,
  serverExclusions,
}: ReportsClientProps) {
  const [activeProgram, setActiveProgram] = useState<Program>("HRT");
  
  const { isExcluded, isLoaded } = useExclusions(serverExclusions);

  const activePools = activeProgram === "HRT" ? hrtPools : trtPools;

  // Compute reports data
  const reports = useMemo(() => {
    // User state count map
    const userStateCount: Map<string, Set<string>> = new Map();
    
    activePools.forEach((pool) => {
      pool.users.forEach((user) => {
        if (!isExcluded(user)) {
          if (!userStateCount.has(user)) {
            userStateCount.set(user, new Set());
          }
          userStateCount.get(user)!.add(pool.state);
        }
      });
    });

    // Convert to array and sort
    const userStates = Array.from(userStateCount.entries()).map(([name, states]) => ({
      name,
      stateCount: states.size,
      states: Array.from(states).sort(),
    }));

    // Users in most states (top 10)
    const usersInMostStates = [...userStates]
      .sort((a, b) => b.stateCount - a.stateCount)
      .slice(0, 15);

    // Users in fewest states (bottom 10, excluding single state)
    const usersInFewestStates = [...userStates]
      .filter((u) => u.stateCount >= 1)
      .sort((a, b) => a.stateCount - b.stateCount)
      .slice(0, 15);

    // States by user count
    const stateUserCounts = activePools
      .map((pool) => ({
        state: pool.state,
        userCount: pool.users.filter((u) => !isExcluded(u)).length,
        totalCount: pool.users.length,
      }))
      .sort((a, b) => b.userCount - a.userCount);

    // States with most users (top 10)
    const statesWithMostUsers = stateUserCounts.slice(0, 10);

    // States with fewest users (bottom 10)
    const statesWithFewestUsers = [...stateUserCounts]
      .sort((a, b) => a.userCount - b.userCount)
      .slice(0, 10);

    // Summary stats
    const totalUniqueUsers = userStateCount.size;
    const avgStatesPerUser = userStates.length > 0 
      ? (userStates.reduce((sum, u) => sum + u.stateCount, 0) / userStates.length).toFixed(1)
      : "0";
    const avgUsersPerState = activePools.length > 0
      ? (stateUserCounts.reduce((sum, s) => sum + s.userCount, 0) / activePools.length).toFixed(1)
      : "0";

    return {
      usersInMostStates,
      usersInFewestStates,
      statesWithMostUsers,
      statesWithFewestUsers,
      totalUniqueUsers,
      avgStatesPerUser,
      avgUsersPerState,
      totalStates: activePools.length,
    };
  }, [activePools, isExcluded]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Loading...</div>
      </div>
    );
  }

  const isHRT = activeProgram === "HRT";

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className={`border-b sticky top-0 z-10 ${isHRT ? 'bg-gradient-to-r from-emerald-600 to-teal-600' : 'bg-gradient-to-r from-blue-600 to-indigo-600'} text-white shadow-lg`}>
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
                    <BarChart3 className="h-6 w-6" />
                  </div>
                  Reports & Analytics
                </h1>
                <p className="text-sm text-white/80 mt-1">
                  Insights into resource pool distribution
                </p>
              </div>
            </div>
            <ProgramTabs
              activeProgram={activeProgram}
              onProgramChange={setActiveProgram}
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-violet-500 to-purple-600 text-white border-0 shadow-lg">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{reports.totalUniqueUsers}</p>
                  <p className="text-xs text-white/80">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white border-0 shadow-lg">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{reports.totalStates}</p>
                  <p className="text-xs text-white/80">States</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white border-0 shadow-lg">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{reports.avgStatesPerUser}</p>
                  <p className="text-xs text-white/80">Avg States/User</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white border-0 shadow-lg">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{reports.avgUsersPerState}</p>
                  <p className="text-xs text-white/80">Avg Users/State</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Users in Most States */}
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Crown className="h-5 w-5" />
                Users in Most States
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead className="text-right">States</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.usersInMostStates.map((user, idx) => (
                      <TableRow key={user.name} className={idx < 3 ? "bg-amber-50" : ""}>
                        <TableCell>
                          {idx < 3 ? (
                            <Badge className={`${idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : 'bg-amber-600'}`}>
                              {idx + 1}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">{idx + 1}</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                            {user.stateCount}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Users in Fewest States */}
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingDown className="h-5 w-5" />
                Users in Fewest States
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead className="text-right">States</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.usersInFewestStates.map((user, idx) => (
                      <TableRow key={user.name}>
                        <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                            {user.stateCount}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* States with Most Users */}
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5" />
                States with Most Users
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead className="text-right">Users</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.statesWithMostUsers.map((state, idx) => (
                      <TableRow key={state.state} className={idx < 3 ? "bg-emerald-50" : ""}>
                        <TableCell>
                          {idx < 3 ? (
                            <Badge className={`${idx === 0 ? 'bg-emerald-600' : idx === 1 ? 'bg-emerald-500' : 'bg-emerald-400'}`}>
                              {idx + 1}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">{idx + 1}</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{state.state}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                            {state.userCount}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* States with Fewest Users */}
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingDown className="h-5 w-5" />
                States with Fewest Users
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead className="text-right">Users</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.statesWithFewestUsers.map((state, idx) => (
                      <TableRow key={state.state}>
                        <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="font-medium">{state.state}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary" className={`${state.userCount === 0 ? 'bg-red-100 text-red-700' : 'bg-rose-100 text-rose-700'}`}>
                            {state.userCount}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <p className="text-xs text-center text-muted-foreground">
            Resource Pool Viewer • Reports exclude users marked as excluded
          </p>
        </div>
      </footer>
    </div>
  );
}

