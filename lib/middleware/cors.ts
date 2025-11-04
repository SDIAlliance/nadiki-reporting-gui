/**
 * CORS (Cross-Origin Resource Sharing) Middleware
 *
 * Provides CORS configuration for API endpoints to allow external calling.
 */

import { NextRequest, NextResponse } from 'next/server';

export interface CorsConfig {
  /**
   * Allowed origins. Use '*' to allow all origins (not recommended for production)
   * Or provide specific origins: ['https://example.com', 'https://app.example.com']
   */
  allowedOrigins?: string[] | '*';

  /**
   * Allowed HTTP methods
   */
  allowedMethods?: string[];

  /**
   * Allowed headers
   */
  allowedHeaders?: string[];

  /**
   * Exposed headers
   */
  exposedHeaders?: string[];

  /**
   * Max age for preflight cache (in seconds)
   */
  maxAge?: number;

  /**
   * Allow credentials (cookies, authorization headers)
   */
  credentials?: boolean;
}

/**
 * Default CORS configuration
 */
const DEFAULT_CONFIG: CorsConfig = {
  allowedOrigins: '*', // In production, specify exact origins
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Api-Key',
    'X-Requested-With',
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],
  maxAge: 86400, // 24 hours
  credentials: false,
};

/**
 * Check if origin is allowed
 * @param origin - The origin to check
 * @param allowedOrigins - Configured allowed origins
 * @returns true if origin is allowed
 */
function isOriginAllowed(
  origin: string | null,
  allowedOrigins: string[] | '*'
): boolean {
  if (allowedOrigins === '*') {
    return true;
  }

  if (!origin) {
    return false;
  }

  return allowedOrigins.includes(origin);
}

/**
 * Get CORS headers for a response
 * @param request - The incoming request
 * @param config - CORS configuration
 * @returns Headers object with CORS headers
 */
export function getCorsHeaders(
  request: NextRequest,
  config: CorsConfig = {}
): Record<string, string> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const origin = request.headers.get('origin');
  const headers: Record<string, string> = {};

  // Access-Control-Allow-Origin
  if (mergedConfig.allowedOrigins === '*') {
    headers['Access-Control-Allow-Origin'] = '*';
  } else if (origin && isOriginAllowed(origin, mergedConfig.allowedOrigins || [])) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  // Access-Control-Allow-Methods
  if (mergedConfig.allowedMethods) {
    headers['Access-Control-Allow-Methods'] = mergedConfig.allowedMethods.join(', ');
  }

  // Access-Control-Allow-Headers
  if (mergedConfig.allowedHeaders) {
    headers['Access-Control-Allow-Headers'] = mergedConfig.allowedHeaders.join(', ');
  }

  // Access-Control-Expose-Headers
  if (mergedConfig.exposedHeaders) {
    headers['Access-Control-Expose-Headers'] = mergedConfig.exposedHeaders.join(', ');
  }

  // Access-Control-Max-Age
  if (mergedConfig.maxAge !== undefined) {
    headers['Access-Control-Max-Age'] = mergedConfig.maxAge.toString();
  }

  // Access-Control-Allow-Credentials
  if (mergedConfig.credentials) {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  return headers;
}

/**
 * Handle preflight (OPTIONS) requests
 * @param request - The incoming request
 * @param config - CORS configuration
 * @returns NextResponse for OPTIONS request
 */
export function handlePreflightRequest(
  request: NextRequest,
  config?: CorsConfig
): NextResponse {
  const headers = getCorsHeaders(request, config);

  return new NextResponse(null, {
    status: 204,
    headers,
  });
}

/**
 * Add CORS headers to an existing response
 * @param response - The response to modify
 * @param request - The incoming request
 * @param config - CORS configuration
 * @returns Modified response with CORS headers
 */
export function addCorsHeaders(
  response: NextResponse,
  request: NextRequest,
  config?: CorsConfig
): NextResponse {
  const headers = getCorsHeaders(request, config);

  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }

  return response;
}

/**
 * Higher-order function to wrap a route handler with CORS support
 * @param handler - The route handler function
 * @param config - CORS configuration
 * @returns Wrapped handler with CORS support
 */
export function withCors(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config?: CorsConfig
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return handlePreflightRequest(request, config);
    }

    // Execute the handler
    const response = await handler(request);

    // Add CORS headers to the response
    return addCorsHeaders(response, request, config);
  };
}
