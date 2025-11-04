/**
 * Rate Limiting Middleware
 *
 * Simple in-memory rate limiting for API endpoints.
 * For production use with Cloudflare Workers, consider using Cloudflare Rate Limiting rules.
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
// Note: This will be per-worker instance in Cloudflare Workers
const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the time window
   */
  maxRequests: number;

  /**
   * Time window in seconds
   */
  windowSeconds: number;

  /**
   * Custom identifier function (defaults to IP address)
   */
  identifier?: (request: NextRequest) => string;
}

/**
 * Default rate limit configuration
 */
const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 100,
  windowSeconds: 60, // 1 minute
};

/**
 * Get client identifier from request
 * @param request - The incoming NextRequest
 * @returns A unique identifier for the client
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get API key first (if authenticated)
  const apiKey = request.headers.get('x-api-key');
  if (apiKey) {
    return `api_key:${apiKey}`;
  }

  // Fall back to IP address
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown';

  return `ip:${ip}`;
}

/**
 * Check if the request is within rate limits
 * @param identifier - The client identifier
 * @param config - Rate limit configuration
 * @returns Object with allowed status and rate limit info
 */
function checkRateLimit(identifier: string, config: RateLimitConfig): {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // No entry or expired window - create new entry
  if (!entry || entry.resetTime < now) {
    const resetTime = now + config.windowSeconds * 1000;
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime,
    });

    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetTime,
    };
  }

  // Within window - check if limit exceeded
  entry.count += 1;

  const allowed = entry.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - entry.count);

  return {
    allowed,
    limit: config.maxRequests,
    remaining,
    resetTime: entry.resetTime,
  };
}

/**
 * Clean up expired entries from the rate limit store
 * This should be called periodically to prevent memory leaks
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
}

/**
 * Rate limiting middleware
 * @param request - The incoming NextRequest
 * @param config - Rate limit configuration (optional)
 * @returns Object with allowed status and headers to add to response
 */
export function rateLimit(
  request: NextRequest,
  config: RateLimitConfig = DEFAULT_CONFIG
): {
  allowed: boolean;
  headers: Record<string, string>;
  response?: NextResponse;
} {
  const identifier = config.identifier
    ? config.identifier(request)
    : getClientIdentifier(request);

  const { allowed, limit, remaining, resetTime } = checkRateLimit(identifier, config);

  const headers = {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': Math.floor(resetTime / 1000).toString(),
  };

  if (!allowed) {
    const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

    return {
      allowed: false,
      headers,
      response: NextResponse.json(
        {
          error: 'Rate limit exceeded',
          details: `You have exceeded the rate limit of ${limit} requests per ${config.windowSeconds} seconds. Please try again later.`,
          retryAfter,
        },
        {
          status: 429,
          headers: {
            ...headers,
            'Retry-After': retryAfter.toString(),
          },
        }
      ),
    };
  }

  return {
    allowed: true,
    headers,
  };
}

/**
 * Higher-order function to wrap a route handler with rate limiting
 * @param handler - The route handler function
 * @param config - Rate limit configuration (optional)
 * @returns Wrapped handler with rate limiting
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config?: RateLimitConfig
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const result = rateLimit(request, config);

    if (!result.allowed && result.response) {
      return result.response;
    }

    // Execute the handler and add rate limit headers
    const response = await handler(request);

    // Add rate limit headers to the response
    for (const [key, value] of Object.entries(result.headers)) {
      response.headers.set(key, value);
    }

    return response;
  };
}
