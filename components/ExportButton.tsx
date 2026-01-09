"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportUsersCsv } from "@/lib/csvExport";

interface ExportButtonProps {
  users: { name: string; state?: string; isExcluded?: boolean }[];
  filename: string;
  label?: string;
}

export function ExportButton({ users, filename, label = "Export CSV" }: ExportButtonProps) {
  const handleExport = () => {
    exportUsersCsv(users, filename);
  };

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={users.length === 0}
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      {label}
    </Button>
  );
}

