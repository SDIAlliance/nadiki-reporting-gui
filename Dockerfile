# syntax=docker/dockerfile:1

# Base stage with pnpm
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# Dependencies stage
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Build stage
FROM base AS builder

# Accept all build arguments
ARG REGISTRAR_API_BASE_URL
ARG REGISTRAR_API_USERNAME
ARG REGISTRAR_API_PASSWORD
ARG FACILITY_API_SPEC_URL
ARG RACK_API_SPEC_URL
ARG SERVER_API_SPEC_URL
ARG SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG ELECTRICITY_MAP_API_KEY
ARG NADIKI_API_KEYS
ARG ALLOWED_ORIGINS
ARG API_RATE_LIMIT_MAX_REQUESTS
ARG API_RATE_LIMIT_WINDOW_SECONDS

# Convert build arguments to environment variables for Next.js build
ENV REGISTRAR_API_BASE_URL=$REGISTRAR_API_BASE_URL
ENV REGISTRAR_API_USERNAME=$REGISTRAR_API_USERNAME
ENV REGISTRAR_API_PASSWORD=$REGISTRAR_API_PASSWORD
ENV FACILITY_API_SPEC_URL=$FACILITY_API_SPEC_URL
ENV RACK_API_SPEC_URL=$RACK_API_SPEC_URL
ENV SERVER_API_SPEC_URL=$SERVER_API_SPEC_URL
ENV SUPABASE_URL=$SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV ELECTRICITY_MAP_API_KEY=$ELECTRICITY_MAP_API_KEY
ENV NADIKI_API_KEYS=$NADIKI_API_KEYS
ENV ALLOWED_ORIGINS=$ALLOWED_ORIGINS
ENV API_RATE_LIMIT_MAX_REQUESTS=$API_RATE_LIMIT_MAX_REQUESTS
ENV API_RATE_LIMIT_WINDOW_SECONDS=$API_RATE_LIMIT_WINDOW_SECONDS

# Set standard build environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY . .

# Build the Next.js application
RUN pnpm run build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
