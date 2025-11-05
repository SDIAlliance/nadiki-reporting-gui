/**
 * API Key Authentication Utilities
 *
 * Provides authentication for external API access using API keys.
 */

import { NextRequest, NextResponse } from 'next/server';

const API_KEY_HEADER = 'x-api-key';

/**
 * Validates the API key from the request headers
 * @param request - The incoming NextRequest
 * @returns true if the API key is valid, false otherwise
 */
export function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get(API_KEY_HEADER);

  if (!apiKey) {
    return false;
  }

  // Get valid API keys from environment
  const validApiKeys = process.env.NADIKI_API_KEYS?.split(',').map(key => key.trim()) || [];

  if (validApiKeys.length === 0) {
    console.warn('No API keys configured in NADIKI_API_KEYS environment variable');
    return false;
  }

  return validApiKeys.includes(apiKey);
}

/**
 * Creates an unauthorized response
 * @returns NextResponse with 401 status
 */
export function createUnauthorizedResponse(): NextResponse {
  return NextResponse.json(
    {
      error: 'Unauthorized',
      details: 'Invalid or missing API key. Please provide a valid API key in the x-api-key header.',
    },
    {
      status: 401,
      headers: {
        'WWW-Authenticate': 'ApiKey',
      }
    }
  );
}

/**
 * Higher-order function to wrap a route handler with API key authentication
 * @param handler - The route handler function to execute if authenticated
 * @returns Wrapped handler with API key authentication
 */
export function withApiKeyAuth(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    if (!validateApiKey(request)) {
      return createUnauthorizedResponse();
    }

    return handler(request);
  };
}
