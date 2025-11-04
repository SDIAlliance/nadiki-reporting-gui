# Nadiki Reporting GUI - External API Documentation

## Overview

The Nadiki Reporting GUI provides external API access to workload metrics and environmental impact data. This documentation covers the authentication, rate limiting, and usage of the external API endpoints.

## Base URL

```
Production: https://your-domain.com
Development: http://localhost:3000
```

## Authentication

All external API endpoints require authentication using an API key.

### API Key Header

Include your API key in the request header:

```
X-Api-Key: your-secret-api-key
```

### Obtaining an API Key

Contact your system administrator to obtain an API key. API keys are configured in the `NADIKI_API_KEYS` environment variable.

### Example Request with Authentication

```bash
curl -X GET \
  'https://your-domain.com/api/workloads/{workload-id}/query?from=1704067200&to=1704153600' \
  -H 'X-Api-Key: your-secret-api-key'
```

## Rate Limiting

To ensure fair usage and system stability, all API endpoints are rate-limited.

### Rate Limit Headers

Every API response includes the following headers:

- `X-RateLimit-Limit`: Maximum number of requests allowed in the time window
- `X-RateLimit-Remaining`: Number of requests remaining in the current window
- `X-RateLimit-Reset`: Unix timestamp when the rate limit resets

### Default Limits

- **100 requests per 60 seconds** (configurable via environment variables)

### Rate Limit Response

When you exceed the rate limit, you'll receive a `429 Too Many Requests` response:

```json
{
  "error": "Rate limit exceeded",
  "details": "You have exceeded the rate limit of 100 requests per 60 seconds. Please try again later.",
  "retryAfter": 42
}
```

The response includes a `Retry-After` header indicating how many seconds to wait before making another request.

## CORS (Cross-Origin Resource Sharing)

The API supports CORS for cross-origin requests. The allowed origins can be configured via the `ALLOWED_ORIGINS` environment variable.

### CORS Headers

- `Access-Control-Allow-Origin`: Allowed origins
- `Access-Control-Allow-Methods`: GET, OPTIONS
- `Access-Control-Allow-Headers`: Content-Type, X-Api-Key
- `Access-Control-Expose-Headers`: X-RateLimit-*, Cache-Control
- `Access-Control-Max-Age`: 86400 (24 hours)

### Preflight Requests

The API supports OPTIONS preflight requests for CORS compliance.

## Endpoints

### Query Workload Metrics

Retrieve comprehensive environmental and operational metrics for a specific workload over a time period.

**Endpoint:** `GET /api/workloads/{id}/query`

**Parameters:**

| Parameter | Type   | Required | Description                           |
|-----------|--------|----------|---------------------------------------|
| id        | string | Yes      | UUID of the workload (path parameter) |
| from      | number | Yes      | Start time (Unix timestamp in seconds)|
| to        | number | Yes      | End time (Unix timestamp in seconds)  |

**Headers:**

| Header    | Type   | Required | Description         |
|-----------|--------|----------|---------------------|
| X-Api-Key | string | Yes      | Your API key        |

**Example Request:**

```bash
curl -X GET \
  'https://your-domain.com/api/workloads/550e8400-e29b-41d4-a716-446655440000/query?from=1704067200&to=1704153600' \
  -H 'X-Api-Key: your-secret-api-key'
```

**Example Response:**

```json
{
  "averageCpuUtilization": 45.67,
  "averageServerPowerForPod": 123.45,
  "totalEnergyConsumptionForPod": 2963.04,
  "gridRenewablePercentageAverage": 35.2,
  "totalRenewableEnergyConsumption": 1042.99,
  "totalNonRenewableEnergyConsumption": 1920.05,
  "totalOperationalCo2Emissions": 862.42,
  "facilityEmbodiedImpactsAttributable": {
    "climate_change": 12.34,
    "ozone_depletion": 0.0001,
    "human_toxicity": 5.67,
    "photochemical_oxidant_formation": 0.89,
    "particulate_matter_formation": 1.23,
    "ionizing_radiation": 0.45,
    "terrestrial_acidification": 0.67,
    "freshwater_eutrophication": 0.12,
    "marine_eutrophication": 0.08,
    "terrestrial_ecotoxicity": 0.03,
    "freshwater_ecotoxicity": 0.02,
    "marine_ecotoxicity": 0.01,
    "agricultural_land_occupation": 10.5,
    "urban_land_occupation": 2.1,
    "natural_land_transformation": 0.5,
    "water_depletion": 15.6,
    "metal_depletion": 8.9,
    "fossil_depletion": 25.3
  },
  "serverEmbodiedImpactsAttributable": {
    "climate_change": 23.45,
    "primary_energy_use": 156.78,
    "ozone_depletion": 0.0002,
    "human_toxicity": 8.91,
    "photochemical_oxidant_formation": 1.23,
    "particulate_matter_formation": 2.34,
    "ionizing_radiation": 0.78,
    "terrestrial_acidification": 1.12,
    "freshwater_eutrophication": 0.23,
    "marine_eutrophication": 0.15,
    "terrestrial_ecotoxicity": 0.05,
    "freshwater_ecotoxicity": 0.03,
    "marine_ecotoxicity": 0.02,
    "agricultural_land_occupation": 18.7,
    "urban_land_occupation": 3.4,
    "natural_land_transformation": 0.9,
    "abiotic_depletion_potential": 12.6
  }
}
```

**Response Fields:**

| Field                                  | Type   | Description                                                    |
|----------------------------------------|--------|----------------------------------------------------------------|
| averageCpuUtilization                  | number | Average CPU utilization percentage for the workload            |
| averageServerPowerForPod               | number | Average power consumption in watts attributed to the workload  |
| totalEnergyConsumptionForPod           | number | Total energy consumption in watt-hours for the time period     |
| gridRenewablePercentageAverage         | number | Average percentage of renewable energy in the grid             |
| totalRenewableEnergyConsumption        | number | Total renewable energy consumption in watt-hours               |
| totalNonRenewableEnergyConsumption     | number | Total non-renewable energy consumption in watt-hours           |
| totalOperationalCo2Emissions           | number | Total operational CO2 emissions in grams                       |
| facilityEmbodiedImpactsAttributable    | object | Facility embodied impacts attributed to the workload           |
| serverEmbodiedImpactsAttributable      | object | Server embodied impacts attributed to the workload             |

**Facility Embodied Impact Categories:**

- `climate_change`: kg CO2 eq
- `ozone_depletion`: kg CFC-11 eq
- `human_toxicity`: kg 1,4-DB eq
- `photochemical_oxidant_formation`: kg NMVOC
- `particulate_matter_formation`: kg PM10 eq
- `ionizing_radiation`: kBq U235 eq
- `terrestrial_acidification`: kg SO2 eq
- `freshwater_eutrophication`: kg P eq
- `marine_eutrophication`: kg N eq
- `terrestrial_ecotoxicity`: kg 1,4-DB eq
- `freshwater_ecotoxicity`: kg 1,4-DB eq
- `marine_ecotoxicity`: kg 1,4-DB eq
- `agricultural_land_occupation`: m2a
- `urban_land_occupation`: m2a
- `natural_land_transformation`: m2
- `water_depletion`: m3
- `metal_depletion`: kg Fe eq
- `fossil_depletion`: kg oil eq

**Server Embodied Impact Categories:**

All facility categories plus:
- `primary_energy_use`: MJ
- `abiotic_depletion_potential`: kg Sb eq

**Error Responses:**

| Status Code | Description                                  |
|-------------|----------------------------------------------|
| 400         | Bad Request - Invalid parameters             |
| 401         | Unauthorized - Missing or invalid API key    |
| 404         | Not Found - Workload does not exist          |
| 429         | Too Many Requests - Rate limit exceeded      |
| 500         | Internal Server Error                        |

**400 Bad Request Example:**

```json
{
  "error": "Missing required parameters",
  "details": "Both \"from\" and \"to\" query parameters (unix timestamps) are required"
}
```

**401 Unauthorized Example:**

```json
{
  "error": "Unauthorized",
  "details": "Invalid or missing API key. Please provide a valid API key in the x-api-key header."
}
```

**404 Not Found Example:**

```json
{
  "error": "Workload not found",
  "details": "No workload found with ID: 550e8400-e29b-41d4-a716-446655440000"
}
```

## Caching

Successful responses include cache control headers:

```
Cache-Control: private, max-age=300
```

This indicates that the response can be cached privately (by the client) for 5 minutes (300 seconds).

## Best Practices

### 1. Handle Rate Limits

Always check the `X-RateLimit-Remaining` header and implement exponential backoff when approaching the limit:

```javascript
async function fetchWithRateLimit(url, apiKey) {
  const response = await fetch(url, {
    headers: { 'X-Api-Key': apiKey }
  });

  const remaining = parseInt(response.headers.get('X-RateLimit-Remaining'));

  if (remaining < 10) {
    console.warn('Approaching rate limit, consider slowing down requests');
  }

  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get('Retry-After'));
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
    return fetchWithRateLimit(url, apiKey); // Retry
  }

  return response;
}
```

### 2. Use Appropriate Time Ranges

- Keep time ranges reasonable (avoid querying years of data in a single request)
- For large time ranges, consider breaking them into smaller chunks
- Respect the cache headers to avoid unnecessary requests

### 3. Secure Your API Key

- Never commit API keys to version control
- Store API keys in environment variables or secure secret management systems
- Rotate API keys regularly
- Use different API keys for different environments (development, staging, production)

### 4. Monitor Your Usage

Track your API usage to:
- Avoid hitting rate limits
- Optimize query patterns
- Identify potential issues early

### 5. Error Handling

Always implement proper error handling:

```javascript
async function queryWorkload(workloadId, from, to, apiKey) {
  try {
    const url = `https://your-domain.com/api/workloads/${workloadId}/query?from=${from}&to=${to}`;
    const response = await fetch(url, {
      headers: { 'X-Api-Key': apiKey }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API Error: ${error.details}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to query workload:', error);
    throw error;
  }
}
```

## Support

For API access issues or questions:

1. Check the error message in the API response
2. Verify your API key is valid and properly formatted
3. Ensure your requests include all required parameters
4. Check that you haven't exceeded the rate limit
5. Contact your system administrator for assistance

## Changelog

### Version 1.0.0 (2025-01-04)

- Initial release
- API key authentication
- Rate limiting (100 requests per 60 seconds)
- CORS support
- Workload query endpoint with comprehensive environmental impact metrics
