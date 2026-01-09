# Resource Pool Viewer

A Next.js application for viewing and managing HRT and TRT resource pool assignments. Built with TypeScript, Tailwind CSS, and shadcn/ui components.

## Features

- **Dashboard**: View resource pools organized by state for HRT and TRT programs
- **State Detail View**: See all users in a specific state with search and filtering
- **All Users View**: Browse all users across all states with advanced filtering
- **Exclusion Management**: Mark users as excluded with persistent localStorage storage
- **CSV Export**: Export filtered user lists to CSV files
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Data Setup

### Adding Your CSV Data

Replace the placeholder CSV files in the `/data` directory with your actual data:

1. **HRT Data**: Edit `/data/hrt.csv`
2. **TRT Data**: Edit `/data/trt.csv`

#### CSV Format

The CSV files should have:
- **First row**: Column headers (state/resource pool names)
- **Subsequent rows**: User names under each state column

Example:
```csv
Florida,Unnamed: 1,Texas,Unnamed: 3,California
John Smith,,Maria Garcia,,David Lee
Sarah Johnson,,Carlos Rodriguez,,Jennifer Wong
```

**Important Notes:**
- Columns with headers starting with "Unnamed" or blank headers are automatically ignored
- User names are automatically normalized (trimmed, multiple spaces collapsed)
- Duplicate users within a state are de-duplicated by default
- Empty cells are ignored

### Managing Exclusions

#### exclusions.json

Edit `/data/exclusions.json` to set up initial exclusions:

```json
{
  "excludedUsers": [
    "John Smith",
    "Jane Doe"
  ]
}
```

These users will be excluded by default when the app loads.

#### How Exclusions Work

1. **Server Exclusions**: Users listed in `/data/exclusions.json` are excluded by default
2. **Client Overrides**: Users can toggle exclusions in the UI, which are stored in browser localStorage
3. **Priority**: localStorage overrides take precedence over server exclusions

#### Exclusion Behavior

- **Show Excluded OFF** (default): Excluded users are hidden from counts and lists
- **Show Excluded ON**: Excluded users are visible but marked with an "Excluded" badge
- **Toggle Exclusion**: Click "Exclude" or "Include" button next to any user to change their status

#### Clearing LocalStorage Overrides

To reset all client-side exclusion overrides:

1. Open browser Developer Tools (F12)
2. Go to Application → Local Storage
3. Delete the key `resourcePoolViewer_exclusions`
4. Refresh the page

## Deployment to Vercel

### Method 1: Vercel CLI

```bash
npm install -g vercel
vercel
```

### Method 2: Git Integration

1. Push your code to GitHub/GitLab/Bitbucket
2. Import the project in [Vercel Dashboard](https://vercel.com/new)
3. Vercel will auto-detect Next.js and configure the build

### Environment Variables

No environment variables are required for basic deployment.

## Project Structure

```
/app
  page.tsx                          # Dashboard (server component)
  DashboardClient.tsx               # Dashboard (client component)
  /state/[program]/[state]
    page.tsx                        # State detail (server component)
    StateDetailClient.tsx           # State detail (client component)
  /all/[program]
    page.tsx                        # All users (server component)
    AllUsersClient.tsx              # All users (client component)

/components
  /ui                               # shadcn/ui components
  ProgramTabs.tsx                   # HRT/TRT tab switcher
  StateGrid.tsx                     # Grid of state cards
  UserTable.tsx                     # User list table
  SearchBar.tsx                     # Search input
  ExportButton.tsx                  # CSV export button

/lib
  types.ts                          # TypeScript types
  data.ts                           # Server-side data loading
  parseResourcePoolCsv.ts           # CSV parsing logic
  normalize.ts                      # String normalization utilities
  csvExport.ts                      # Client-side CSV export
  route.ts                          # URL encoding/decoding helpers
  useExclusions.ts                  # Exclusions state hook

/data
  hrt.csv                           # HRT resource pool data
  trt.csv                           # TRT resource pool data
  exclusions.json                   # Initial exclusion list
```

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **CSV Parsing**: papaparse
- **Icons**: lucide-react

## License

MIT
