"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserMinus, UserPlus } from "lucide-react";

interface UserTableProps {
  users: { name: string; state?: string; isExcluded: boolean }[];
  showStateColumn?: boolean;
  onToggleExcluded: (name: string) => void;
}

export function UserTable({
  users,
  showStateColumn = false,
  onToggleExcluded,
}: UserTableProps) {
  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border rounded-lg">
        No users found matching your criteria.
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">User</TableHead>
            {showStateColumn && <TableHead className="font-semibold">State</TableHead>}
            <TableHead className="font-semibold w-[100px]">Status</TableHead>
            <TableHead className="font-semibold w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user, index) => (
            <TableRow 
              key={`${user.name}-${user.state || ""}-${index}`}
              className={user.isExcluded ? "bg-amber-50 dark:bg-amber-950/20" : ""}
            >
              <TableCell className="font-medium">{user.name}</TableCell>
              {showStateColumn && (
                <TableCell>
                  <Badge variant="outline">{user.state}</Badge>
                </TableCell>
              )}
              <TableCell>
                {user.isExcluded ? (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                    Excluded
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                    Active
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleExcluded(user.name)}
                  className="h-8 px-2"
                >
                  {user.isExcluded ? (
                    <>
                      <UserPlus className="h-4 w-4 mr-1" />
                      Include
                    </>
                  ) : (
                    <>
                      <UserMinus className="h-4 w-4 mr-1" />
                      Exclude
                    </>
                  )}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

