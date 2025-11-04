# External API Setup Guide

This guide explains how to configure and deploy the Nadiki Reporting GUI with external API access enabled.

## Overview

The workloads query API endpoint (`/api/workloads/[id]/query`) has been enhanced with:

- **API Key Authentication**: Secure access using API keys
- **Rate Limiting**: Protection against abuse (100 requests per 60 seconds by default)
- **CORS Support**: Cross-origin resource sharing for web applications
- **Proper HTTP Headers**: Including cache control and security headers

## Quick Setup

### 1. Configure Environment Variables

Copy `.env.example` to `.env.local` and configure the following variables:

```bash
# Required: Add your API keys (comma-separated for multiple keys)
NADIKI_API_KEYS="your-secret-api-key-1,your-secret-api-key-2"

# Optional: Configure allowed origins for CORS
# Use * for development, specify exact origins for production
ALLOWED_ORIGINS="https://example.com,https://app.example.com"

# Optional: Customize rate limiting
API_RATE_LIMIT_MAX_REQUESTS="100"
API_RATE_LIMIT_WINDOW_SECONDS="60"
```

### 2. Generate Secure API Keys

Generate strong API keys using:

```bash
# Generate a random API key (32 characters)
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Add the generated keys to your `.env.local` file:

```bash
NADIKI_API_KEYS="AbCdEf123456789012345678901234567890AbCd"
```

### 3. Configure CORS (Production)

For production, replace the wildcard (`*`) with specific allowed origins:

```bash
# Development (allow all origins)
ALLOWED_ORIGINS="*"

# Production (specific origins only)
ALLOWED_ORIGINS="https://example.com,https://app.example.com"
```

### 4. Test the API Locally

Start the development server:

```bash
pnpm run dev
```

Run the test script:

```bash
# Set environment variables for testing
export API_KEY="your-secret-api-key-1"
export WORKLOAD_ID="your-workload-uuid"

# Run the test script
./test-api.sh
```

Or test manually with curl:

```bash
curl -X GET \
  'http://localhost:3000/api/workloads/YOUR_WORKLOAD_ID/query?from=1704067200&to=1704153600' \
  -H 'X-Api-Key: your-secret-api-key-1'
```

### 5. Deploy to Production

#### Cloudflare Workers

Add the environment variables to your `wrangler.toml` or set them in the Cloudflare dashboard:

```toml
[env.production.vars]
NADIKI_API_KEYS = "production-api-key-1,production-api-key-2"
ALLOWED_ORIGINS = "https://example.com,https://app.example.com"
API_RATE_LIMIT_MAX_REQUESTS = "100"
API_RATE_LIMIT_WINDOW_SECONDS = "60"
```

Or use Cloudflare secrets for sensitive values:

```bash
echo "your-api-key" | wrangler secret put NADIKI_API_KEYS
```

Deploy:

```bash
pnpm run deploy
```

## Security Best Practices

### 1. API Key Management

- **Never commit API keys to version control**
- Store keys in environment variables or secret management systems
- Use different keys for different environments (dev, staging, production)
- Rotate keys regularly (recommended: every 90 days)
- Revoke compromised keys immediately

### 2. CORS Configuration

- Never use `ALLOWED_ORIGINS="*"` in production
- Specify exact origins that need access
- Include protocol (https://) and domain
- Don't include trailing slashes

Example:
```bash
# Good
ALLOWED_ORIGINS="https://example.com,https://app.example.com"

# Bad
ALLOWED_ORIGINS="*"  # Too permissive for production
ALLOWED_ORIGINS="example.com"  # Missing protocol
ALLOWED_ORIGINS="https://example.com/"  # Unnecessary trailing slash
```

### 3. Rate Limiting

- Monitor API usage to detect abuse
- Adjust limits based on legitimate usage patterns
- Consider implementing per-user limits using the API key
- Use Cloudflare Rate Limiting rules for additional protection

### 4. Network Security

- Use HTTPS only in production
- Consider implementing IP allowlisting if applicable
- Monitor logs for suspicious activity
- Implement request signing for enhanced security (future enhancement)

## Monitoring and Troubleshooting

### Rate Limit Headers

Every response includes rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704153600
```

### Common Issues

#### 401 Unauthorized

**Cause**: Missing or invalid API key

**Solution**: Verify the API key is:
- Included in the `X-Api-Key` header
- Correct and not expired
- Configured in the `NADIKI_API_KEYS` environment variable

#### 429 Too Many Requests

**Cause**: Rate limit exceeded

**Solution**:
- Wait for the time specified in `Retry-After` header
- Implement exponential backoff
- Consider caching responses
- Request a higher rate limit if needed

#### 403 Forbidden (CORS)

**Cause**: Origin not allowed

**Solution**:
- Add your domain to `ALLOWED_ORIGINS`
- Ensure the origin includes protocol (https://)
- Clear browser cache and retry

### Logging

Monitor your application logs for:

```
# Authentication failures
"Invalid or missing API key"

# Rate limit warnings
"Approaching rate limit"

# CORS issues
"Origin not allowed"
```

## API Documentation

For complete API documentation, including:
- Request/response formats
- Error codes
- Example code
- Best practices

See: [API.md](./API.md)

## Architecture

### Middleware Stack

The API endpoint uses a middleware stack:

```
Request
  ↓
CORS Handler (OPTIONS check)
  ↓
Rate Limiter
  ↓
API Key Authenticator
  ↓
Route Handler
  ↓
Response (with CORS + Rate Limit headers)
```

### File Structure

```
lib/
├── auth/
│   └── api-key.ts          # API key authentication
├── middleware/
│   ├── cors.ts             # CORS handling
│   └── rate-limit.ts       # Rate limiting
app/api/workloads/[id]/query/
└── route.ts                # Protected route handler
```

## Advanced Configuration

### Custom Rate Limiting by API Key

Implement different rate limits for different API keys:

```typescript
const rateLimitConfig = {
  maxRequests: apiKey.startsWith('premium-') ? 1000 : 100,
  windowSeconds: 60,
  identifier: (request) => request.headers.get('x-api-key') || 'unknown',
};
```

### Multiple CORS Configurations

For different API endpoints, you can use different CORS configurations:

```typescript
// Public endpoints
const publicCorsConfig = {
  allowedOrigins: '*',
  credentials: false,
};

// Authenticated endpoints
const authenticatedCorsConfig = {
  allowedOrigins: ['https://example.com'],
  credentials: true,
};
```

### Request Logging

Add request logging for audit purposes:

```typescript
function logApiRequest(request: NextRequest) {
  console.log({
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url,
    apiKey: request.headers.get('x-api-key')?.substring(0, 8) + '...',
    origin: request.headers.get('origin'),
  });
}
```

## Future Enhancements

Potential improvements for the external API:

1. **OAuth 2.0 Support**: Replace or supplement API keys with OAuth
2. **Request Signing**: Add HMAC signature verification
3. **Webhooks**: Push notifications for workload events
4. **GraphQL Endpoint**: Alternative query interface
5. **OpenAPI Spec**: Auto-generated API documentation
6. **SDK Libraries**: Client libraries for popular languages
7. **Per-User Rate Limits**: More granular rate limiting
8. **Analytics Dashboard**: API usage statistics

## Support

For issues or questions:

1. Review the [API Documentation](./API.md)
2. Check application logs for error messages
3. Verify environment variables are set correctly
4. Test with the provided `test-api.sh` script
5. Contact your system administrator

## Version History

### v1.0.0 (2025-01-04)

- Initial implementation
- API key authentication
- Rate limiting (100/60s default)
- CORS support
- Comprehensive documentation
