/**
 * Export data as CSV file download.
 */
export function downloadCsv(
  data: Record<string, string>[],
  filename: string
): void {
  if (data.length === 0) {
    alert("No data to export");
    return;
  }

  // Get headers from first row
  const headers = Object.keys(data[0]);
  
  // Build CSV content
  const csvRows: string[] = [];
  
  // Header row
  csvRows.push(headers.map(escapeCSVField).join(","));
  
  // Data rows
  data.forEach((row) => {
    const values = headers.map((header) => escapeCSVField(row[header] || ""));
    csvRows.push(values.join(","));
  });

  const csvContent = csvRows.join("\n");
  
  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Escape a field for CSV format.
 */
function escapeCSVField(field: string): string {
  if (typeof field !== "string") {
    field = String(field);
  }
  
  // If field contains comma, newline, or quote, wrap in quotes
  if (field.includes(",") || field.includes("\n") || field.includes('"')) {
    // Escape existing quotes by doubling them
    return `"${field.replace(/"/g, '""')}"`;
  }
  
  return field;
}

/**
 * Export users list as CSV.
 */
export function exportUsersCsv(
  users: { name: string; state?: string; isExcluded?: boolean }[],
  filename: string
): void {
  const data = users.map((user) => ({
    Name: user.name,
    ...(user.state !== undefined && { State: user.state }),
    ...(user.isExcluded !== undefined && { Excluded: user.isExcluded ? "Yes" : "No" }),
  }));
  
  downloadCsv(data, filename);
}

