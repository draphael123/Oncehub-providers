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

  // Filter and map users
  const filteredUsers = useMemo(() => {
    const query = searchQuery.toLowerCase();
    
    return baseUsers
      .map((name) => ({
        name,
        isExcluded: isExcluded(name),
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
  }, [baseUsers, searchQuery, isExcluded, showExcluded]);

  // Stats
  const stats = useMemo(() => {
    const total = baseUsers.length;
    const excluded = baseUsers.filter((u) => isExcluded(u)).length;
    const active = total - excluded;
    return { total, excluded, active };
  }, [baseUsers, isExcluded]);

  // Export data
  const exportData = useMemo(() => {
    return filteredUsers.map((u) => ({
      name: u.name,
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
                  pool.program === "HRT"
                    ? "border-emerald-500 text-emerald-600"
                    : "border-sky-500 text-sky-600"
                }
              >
                {pool.program}
              </Badge>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                {pool.state}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
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
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="w-full sm:w-80">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search users..."
            />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="show-excluded"
                checked={showExcluded}
                onCheckedChange={setShowExcluded}
              />
              <Label htmlFor="show-excluded" className="text-sm cursor-pointer">
                Show excluded
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="show-duplicates"
                checked={showDuplicates}
                onCheckedChange={setShowDuplicates}
              />
              <Label htmlFor="show-duplicates" className="text-sm cursor-pointer">
                Show duplicates
              </Label>
            </div>
            <ExportButton
              users={exportData}
              filename={`${pool.program}_${pool.state.replace(/\s+/g, "_")}_users.csv`}
            />
          </div>
        </div>

        {/* Results info */}
        <div className="text-sm text-muted-foreground">
          Showing {filteredUsers.length} of {stats.total} users
          {searchQuery && ` matching "${searchQuery}"`}
        </div>

        {/* User Table */}
        <UserTable
          users={filteredUsers}
          onToggleExcluded={toggleExcluded}
        />
      </main>
    </div>
  );
}

