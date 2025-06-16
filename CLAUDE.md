# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Nadiki Reporting GUI - a Next.js application for data center reporting that integrates with the Nadiki API.

## Development Commands

```bash
# Development
npm run dev          # Start development server with Turbopack

# Build & Deploy
npm run build        # Build for production
npm run lint         # Run ESLint
npm run deploy       # Build and deploy to Cloudflare Workers
npm run preview      # Build and preview Cloudflare deployment

# Type Generation
npm run api-typegen  # Re-generate TypeScript types from GitHub nadiki-api spec files
npm run cf-typegen   # Generate Cloudflare types
```

## Architecture & Key Patterns

### Tech Stack
- **Next.js 15.3.3** with App Router
- **React 19** with TypeScript
- **Cloudflare Workers** deployment via OpenNext.js adapter
- **shadcn/ui** components (Radix UI + Tailwind CSS)
- **React Hook Form + Zod** for forms
- **SWR** for handling data in frontend components (https://swr.vercel.app/docs/getting-started)

### Project Structure
- `/app` - Next.js App Router pages
- `/components/ui` - shadcn/ui components (Button, Card, Form, Input, Label)
- `/types/registrar-api` - Auto-generated API types (facility-api.ts, rack-api.ts, server-api.ts)
- `/lib/utils.ts` - Contains `cn()` utility for className merging

### API Integration
Types are auto-generated from OpenAPI specifications hosted on GitHub:
- Run `npm run api-typegen` to regenerate types
- Types are created in `/types/registrar-api/`
- Use with openapi-client-axios for type-safe API calls (see: https://www.npmjs.com/package/openapi-client-axios)

### Important Configuration
- **TypeScript:** Path aliases configured (@/, @/components, @/lib, @/types, @/app)
- **Note:** `ignoreBuildErrors: true` is set in next.config.ts - fix TypeScript errors before removing
- **Styling:** Tailwind CSS with custom theme, CSS variables for theming, shadcn/ui "new-york" style

### Deployment
The app deploys to Cloudflare Workers:
- Uses OpenNext.js Cloudflare adapter
- Configuration in `wrangler.toml`
- Node.js compatibility mode enabled