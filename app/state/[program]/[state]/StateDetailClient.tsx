"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { SearchBar } from "@/components/SearchBar";
import { UserTable } from "@/components/UserTable";
import { ExportButton } from "@/components/ExportButton";
import { useExclusions } from "@/lib/useExclusions";
import { ResourcePool, ExclusionsData } from "@/lib/types";
import { ArrowLeft, Users, UserX, MapPin } from "lucide-react";

interface StateDetailClientProps {
  pool: ResourcePool;
  serverExclusions: ExclusionsData;
}

export function StateDetailClient({
  pool,
  serverExclusions,
}: StateDetailClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDuplicates, setShowDuplicates] = useState(false);

  const {
    isExcluded,
    toggleExcluded,
    showExcluded,
    setShowExcluded,
    isLoaded,
  } = useExclusions(serverExclusions);

  // Get users list with deduplication based on toggle
  const baseUsers = useMemo(() => {
    if (showDuplicates) {
      return pool.users;
    }
    return [...new Set(pool.users)];
  }, [pool.users, showDuplicates]);

  // Filter and map users - using state-specific exclusion check
  const filteredUsers = useMemo(() => {
    const query = searchQuery.toLowerCase();
    
    return baseUsers
      .map((name) => ({
        name,
        isExcluded: isExcluded(name, pool.state, pool.program),
      }))
      .filter((user) => {
        // Filter by search
        if (query && !user.name.toLowerCase().includes(query)) {
          return false;
        }
        // Filter by exclusion status
        if (!showExcluded && user.isExcluded) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [baseUsers, searchQuery, isExcluded, showExcluded, pool.state, pool.program]);

  // Stats
  const stats = useMemo(() => {
    const total = baseUsers.length;
    const excluded = baseUsers.filter((u) => isExcluded(u, pool.state, pool.program)).length;
    const active = total - excluded;
    return { total, excluded, active };
  }, [baseUsers, isExcluded, pool.state, pool.program]);

  // Export data
  const exportData = useMemo(() => {
    return filteredUsers.map((u) => ({
      name: u.name,
      isExcluded: u.isExcluded,
    }));
  }, [filteredUsers]);

  // Handle toggle with state context
  const handleToggleExcluded = (name: string) => {
    toggleExcluded(name, pool.state, pool.program);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Loading...</div>
      </div>
    );
  }

  const isHRT = pool.program === "HRT";

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
                {pool.program}
              </Badge>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {pool.state}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-violet-500 to-purple-600 text-white border-0 shadow-lg">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-white/80">Total Users</p>
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
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="w-full sm:w-80">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search users..."
                />
              </div>
              <div className="flex flex-wrap items-center gap-4">
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
                <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                  <Switch
                    id="show-duplicates"
                    checked={showDuplicates}
                    onCheckedChange={setShowDuplicates}
                  />
                  <Label htmlFor="show-duplicates" className="text-sm cursor-pointer text-blue-800">
                    Show duplicates
                  </Label>
                </div>
                <ExportButton
                  users={exportData}
                  filename={`${pool.program}_${pool.state.replace(/\s+/g, "_")}_users.csv`}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results info */}
        <div className="text-sm text-muted-foreground">
          Showing {filteredUsers.length} of {stats.total} users
          {searchQuery && ` matching "${searchQuery}"`}
        </div>

        {/* User Table */}
        <UserTable
          users={filteredUsers}
          onToggleExcluded={handleToggleExcluded}
        />
      </main>
    </div>
  );
}
