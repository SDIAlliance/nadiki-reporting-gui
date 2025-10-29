# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Nadiki Reporting GUI - a Next.js application for data center reporting that integrates with the Nadiki API.

## Workflow

- Create a branch at the beginning of a new feature
- Create a commit after each set of meaningful changes
- Lint your changes using `pnpx next lint --dir pages --dir utils --file bar.js`

## Development Commands

- Package Manager is pnpm

```bash
# Development
pnpm run dev          # Start development server with Turbopack

# Build & Deploy
pnpm run build        # Build for production
pnpm run lint         # Run ESLint
pnpm run deploy       # Build and deploy to Cloudflare Workers
pnpm run preview      # Build and preview Cloudflare deployment

# Type Generation
pnpm run api-typegen  # Re-generate TypeScript types from GitHub nadiki-api spec files
pnpm run cf-typegen   # Generate Cloudflare types
```

## Architecture & Key Patterns

### Tech Stack
- **Next.js 15.3.3** with App Router
- **React 19** with TypeScript
- **Cloudflare Workers** deployment via OpenNext.js adapter
- **shadcn/ui** components (Radix UI + Tailwind CSS)
- **React Hook Form + Zod** for forms
- **SWR** for handling data in frontend components (https://swr.vercel.app/docs/getting-started)
- **Supabase** as a permanent database for the GUI's specific configuration

### Project Structure
- `/app` - Next.js App Router pages
- `/components/ui` - shadcn/ui components (Button, Card, Form, Input, Label)
- `/types/registrar-api` - Auto-generated API types (facility-api.ts, rack-api.ts, server-api.ts)
- `/lib/utils.ts` - Contains `cn()` utility for className merging
- `/lib/utils/supabase/server-client.ts` - Contains the async createSupabaseServerClient for creating a supabase client in server components
- `/lib/utils/supabase/browser-client.ts` - Contains the createSupabaseBrowserClient for creating a supabase client in frontend components

### API Integration
Types are auto-generated from OpenAPI specifications hosted on GitHub:
- Run `npm run api-typegen` to regenerate types
- Types are created in `/types/registrar-api/`
- Use with openapi-client-axios for type-safe API calls (see: https://www.npmjs.com/package/openapi-client-axios)

### Important Configuration
- **TypeScript:** Path aliases configured (@/, @/components, @/lib, @/types, @/app)
- **Note:** `ignoreBuildErrors: true` is set in next.config.ts - fix TypeScript errors before removing
- **Styling:** Tailwind CSS with custom theme, CSS variables for theming, shadcn/ui "new-york" style

### Supabase
- Use Supabase directly in the frontend, no need to create API wrappers to interact with the database
- Create migrations using Supabase as described here: https://supabase.com/docs/guides/deployment/database-migrations
  - `supabase migration new create_employees_table`
- Apply the migrations locally using `pnpx supabase migration up`

Example code for loading the client in frontend components:

`
import { createSupabaseBrowserClient } from 'lib/utils/supabase/browser-client';
...
const supabase = createSupabaseBrowserClient();
const { data: instruments } = await supabase.from("instruments").select();
`

### Deployment
The app deploys to Cloudflare Workers:
- Uses OpenNext.js Cloudflare adapter
- Configuration in `wrangler.toml`
- Node.js compatibility mode enabled

## Charts and Data Visualization

### Generic InfluxDB Line Chart Component

The application includes a reusable `InfluxLineChart` component for visualizing time-series data from InfluxDB.

**Location:** `/components/charts/InfluxLineChart.tsx`

**Basic Usage:**
```tsx
import { InfluxLineChart } from '@/components/charts/InfluxLineChart';

<InfluxLineChart
  title="Chart Title"
  description="Optional description"
  bucket="influx-bucket-name"
  measurement="measurement_name"
  fields={['field1', 'field2']}
  filters={{
    tag1: 'value1',
    tag2: 'value2'
  }}
  timeRange={{
    start: new Date('2024-01-01'),
    end: new Date()
  }}
/>
```

**Props:**
- `title` (required): Chart title
- `description`: Optional chart description
- `bucket` (required): InfluxDB bucket name
- `measurement` (required): InfluxDB measurement name
- `fields` (required): Array of field names to plot
- `filters`: Object of tag filters to apply
- `groupBy`: Array of tags to group by (creates multiple lines)
- `timeRange`: Start and end dates for the query
- `yAxisLabel`: Label for Y-axis
- `colors`: Array of color values (defaults to chart-1 through chart-5)
- `height`: Chart height in pixels (default: 350)
- `formatValue`: Function to format Y-axis values

### Facility Impact Charts

**Types and Constants:** `/types/facility-impact.ts`
- Energy source constants and labels
- Impact category constants and units
- TypeScript types for type safety

**Example: Primary Energy Use Chart**

Location: `/components/charts/PrimaryEnergyUseChart.tsx`

This specialized chart shows energy consumption by source over time:
```tsx
<PrimaryEnergyUseChart
  facilityId="facility-123"
  bucket="facility-metrics"
  timeRange={{ start: startDate, end: endDate }}
  cumulative={true}  // true for running total, false for period values
/>
```

### Creating New Chart Components

To create a new chart based on the generic component:

1. Import the generic chart and relevant types:
```tsx
import { InfluxLineChart } from '@/components/charts/InfluxLineChart';
import { IMPACT_CATEGORIES, IMPACT_CATEGORY_UNITS } from '@/types/facility-impact';
```

2. Create a wrapper component with specific configuration:
```tsx
export function YourCustomChart({ facilityId, bucket, timeRange }) {
  return (
    <InfluxLineChart
      title="Your Chart Title"
      bucket={bucket}
      measurement="your_measurement"
      fields={['your_field']}
      filters={{
        facility_id: facilityId,
        // your specific filters
      }}
      groupBy={['tag_to_group_by']}
      timeRange={timeRange}
      yAxisLabel="Units"
      formatValue={(value) => `${value.toFixed(2)} units`}
    />
  );
}
```

### InfluxDB Data Structure

The facility operational impact measurement structure:
```
measurement: facility_operational_impact
tags:
  - facility_id (string)
  - country_code (string)
  - impact_category (string)
  - energy_source (string)
fields:
  - cumulative_impact (float) - Running total since January 1st
  - period_impact (float) - Impact for the 15-minute period
  - emission_factor (float) - CO2 intensity (optional)
timestamp: Every 15 minutes
```

### InfluxDB Integration

The application uses the `@influxdata/influxdb-client` library to fetch real-time data from InfluxDB. The integration is configured through facility data fetched from the API.

**Key Components:**
1. **Facility Data Fetching**: Uses SWR to fetch facility configuration including InfluxDB credentials
2. **InfluxDB Client**: Direct browser connection to InfluxDB for real-time data queries
3. **Automatic Fallback**: Charts display mock data when InfluxDB config is not available

**Data Flow:**
```tsx
// 1. Fetch facility data with SWR
const { data: facility } = useSWR<FacilityResponse>('/api/facilities/${facilityId}', fetcher);

// 2. Extract InfluxDB config
const influxConfig = {
  url: facility.timeSeriesConfig.endpoint,
  token: facility.timeSeriesConfig.token,
  org: facility.timeSeriesConfig.org,
};

// 3. Pass config to chart component
<PrimaryEnergyUseChart
  facilityId={facilityId}
  influxConfig={influxConfig}
  bucket={facility.timeSeriesConfig.bucket}
/>
```

**Query Building:**
The `InfluxLineChart` component builds Flux queries dynamically based on props:
- Time range filtering
- Measurement and field selection
- Tag-based filtering (facility_id, impact_category, etc.)
- Grouping for multiple series (e.g., by energy_source)
- Aggregation windows for performance

**Error Handling:**
- Falls back to mock data if InfluxDB is unavailable
- Displays loading states during data fetching
- Shows error messages for connection issues