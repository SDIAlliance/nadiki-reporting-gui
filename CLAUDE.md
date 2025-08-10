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