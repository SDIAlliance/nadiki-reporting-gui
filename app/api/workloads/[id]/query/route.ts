import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/utils/supabase/server-client';
import { InfluxDB } from '@influxdata/influxdb-client';
import { withApiKeyAuth } from '@/lib/auth/api-key';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withCors } from '@/lib/middleware/cors';

export const runtime = 'nodejs';

// Types for embodied impacts
const FACILITY_EMBODIED_METRICS = [
  'climate_change',
  'ozone_depletion',
  'human_toxicity',
  'photochemical_oxidant_formation',
  'particulate_matter_formation',
  'ionizing_radiation',
  'terrestrial_acidification',
  'freshwater_eutrophication',
  'marine_eutrophication',
  'terrestrial_ecotoxicity',
  'freshwater_ecotoxicity',
  'marine_ecotoxicity',
  'agricultural_land_occupation',
  'urban_land_occupation',
  'natural_land_transformation',
  'water_depletion',
  'metal_depletion',
  'fossil_depletion',
] as const;

const SERVER_EMBODIED_METRICS = [
  'climate_change',
  'primary_energy_use',
  'ozone_depletion',
  'human_toxicity',
  'photochemical_oxidant_formation',
  'particulate_matter_formation',
  'ionizing_radiation',
  'terrestrial_acidification',
  'freshwater_eutrophication',
  'marine_eutrophication',
  'terrestrial_ecotoxicity',
  'freshwater_ecotoxicity',
  'marine_ecotoxicity',
  'agricultural_land_occupation',
  'urban_land_occupation',
  'natural_land_transformation',
  'abiotic_depletion_potential',
] as const;

interface WorkloadQueryResponse {
  averageCpuUtilization: number;
  averageServerPowerForPod: number;
  totalEnergyConsumptionForPod: number;
  gridRenewablePercentageAverage: number;
  totalRenewableEnergyConsumption: number;
  totalNonRenewableEnergyConsumption: number;
  totalOperationalCo2Emissions: number;
  facilityEmbodiedImpactsAttributable: Record<string, number>;
  serverEmbodiedImpactsAttributable: Record<string, number>;
}

// Helper function to query InfluxDB and get a single value
async function queryInfluxSum(
  influx: InfluxDB,
  org: string,
  bucket: string,
  measurement: string,
  field: string,
  filters: Record<string, string>,
  start: Date,
  end: Date
): Promise<number | null> {
  const queryApi = influx.getQueryApi(org);

  let query = `from(bucket: "${bucket}")
  |> range(start: ${start.toISOString()}, stop: ${end.toISOString()})
  |> filter(fn: (r) => r._measurement == "${measurement}")
  |> filter(fn: (r) => r._field == "${field}")`;

  // Add additional filters
  for (const [key, value] of Object.entries(filters)) {
    query += `\n  |> filter(fn: (r) => r["${key}"] == "${value}")`;
  }

  query += `\n  |> sum()
  |> yield(name: "sum")`;

  let result: number | null = null;

  await new Promise<void>((resolve, reject) => {
    queryApi.queryRows(query, {
      next(row: string[], tableMeta: { columns: Array<{ label: string }> }) {
        const valueIndex = tableMeta.columns.findIndex((c: { label: string }) => c.label === '_value');
        if (valueIndex >= 0) {
          result = parseFloat(row[valueIndex]);
        }
      },
      error(error: Error) {
        reject(error);
      },
      complete() {
        resolve();
      },
    });
  });

  return result;
}

// Helper function to query InfluxDB for time series data and calculate average
async function queryInfluxAverage(
  influx: InfluxDB,
  org: string,
  bucket: string,
  measurement: string,
  field: string,
  filters: Record<string, string>,
  start: Date,
  end: Date,
  aggregation: 'mean' | 'sum' = 'mean'
): Promise<number | null> {
  const queryApi = influx.getQueryApi(org);

  // Calculate aggregation window based on time range
  const rangeDays = Math.abs((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  let aggregationWindow = '1h';
  if (rangeDays <= 1) {
    aggregationWindow = '1h';
  } else if (rangeDays <= 7) {
    aggregationWindow = '2h';
  } else if (rangeDays <= 31) {
    aggregationWindow = '6h';
  } else if (rangeDays <= 93) {
    aggregationWindow = '1d';
  } else {
    aggregationWindow = '1mo';
  }

  let query = `from(bucket: "${bucket}")
  |> range(start: ${start.toISOString()}, stop: ${end.toISOString()})
  |> filter(fn: (r) => r._measurement == "${measurement}")
  |> filter(fn: (r) => r._field == "${field}")`;

  // Add additional filters
  for (const [key, value] of Object.entries(filters)) {
    query += `\n  |> filter(fn: (r) => r["${key}"] == "${value}")`;
  }

  // For CPU utilization, we need to aggregate across cores first, then average
  if (field === 'cpu_busy_fraction') {
    query += `\n  |> aggregateWindow(every: ${aggregationWindow}, fn: mean, createEmpty: false)
  |> group(columns: ["_time"])
  |> sum()`;
  } else {
    query += `\n  |> aggregateWindow(every: ${aggregationWindow}, fn: ${aggregation}, createEmpty: false)`;
  }

  query += `\n  |> mean()
  |> yield(name: "mean")`;

  let result: number | null = null;

  await new Promise<void>((resolve, reject) => {
    queryApi.queryRows(query, {
      next(row: string[], tableMeta: { columns: Array<{ label: string }> }) {
        const valueIndex = tableMeta.columns.findIndex((c: { label: string }) => c.label === '_value');
        if (valueIndex >= 0) {
          result = parseFloat(row[valueIndex]);
        }
      },
      error(error: Error) {
        reject(error);
      },
      complete() {
        resolve();
      },
    });
  });

  return result;
}

// Main handler function (not exported directly)
async function handleWorkloadQuery(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    // Validate workload ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          error: 'Invalid workload ID',
          details: 'The provided ID is not a valid UUID format',
        },
        { status: 400 }
      );
    }

    // Parse and validate query parameters
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    if (!fromParam || !toParam) {
      return NextResponse.json(
        {
          error: 'Missing required parameters',
          details: 'Both "from" and "to" query parameters (unix timestamps) are required',
        },
        { status: 400 }
      );
    }

    const fromTimestamp = parseInt(fromParam, 10);
    const toTimestamp = parseInt(toParam, 10);

    if (isNaN(fromTimestamp) || isNaN(toTimestamp)) {
      return NextResponse.json(
        {
          error: 'Invalid timestamp',
          details: 'Both "from" and "to" must be valid unix timestamps',
        },
        { status: 400 }
      );
    }

    const startDate = new Date(fromTimestamp * 1000);
    const endDate = new Date(toTimestamp * 1000);

    if (startDate >= endDate) {
      return NextResponse.json(
        {
          error: 'Invalid time range',
          details: '"from" timestamp must be before "to" timestamp',
        },
        { status: 400 }
      );
    }

    // Get workload from database
    const supabase = await createSupabaseServerClient();
    const { data: workload, error: workloadError } = await supabase
      .from('workloads')
      .select('*')
      .eq('id', id)
      .single();

    if (workloadError) {
      if (workloadError.code === 'PGRST116') {
        return NextResponse.json(
          {
            error: 'Workload not found',
            details: `No workload found with ID: ${id}`,
          },
          { status: 404 }
        );
      }

      console.error('Error fetching workload:', workloadError);
      return NextResponse.json(
        {
          error: 'Failed to fetch workload',
          details: workloadError.message,
        },
        { status: 500 }
      );
    }

    // Fetch server details to get InfluxDB configuration
    const serverResponse = await fetch(
      `${process.env.NADIKI_API_URL || 'http://localhost:3000'}/api/servers/${workload.server_id}`
    );

    if (!serverResponse.ok) {
      return NextResponse.json(
        {
          error: 'Failed to fetch server configuration',
          details: `Server ${workload.server_id} not found or API error`,
        },
        { status: 500 }
      );
    }

    const serverDetail = await serverResponse.json();

    if (!serverDetail.timeSeriesConfig) {
      return NextResponse.json(
        {
          error: 'No time-series configuration',
          details: 'Server does not have InfluxDB configuration',
        },
        { status: 500 }
      );
    }

    // Fetch facility details
    const facilityResponse = await fetch(
      `${process.env.NADIKI_API_URL || 'http://localhost:3000'}/api/facilities/${workload.facility_id}`
    );

    if (!facilityResponse.ok) {
      return NextResponse.json(
        {
          error: 'Failed to fetch facility configuration',
          details: `Facility ${workload.facility_id} not found or API error`,
        },
        { status: 500 }
      );
    }

    const facility = await facilityResponse.json();
    const totalNumberOfServers = facility.totalNumberOfServers || 1;

    // Initialize InfluxDB client
    const influx = new InfluxDB({
      url: serverDetail.timeSeriesConfig.endpoint,
      token: serverDetail.timeSeriesConfig.token,
    });

    const org = serverDetail.timeSeriesConfig.org;
    const bucket = serverDetail.timeSeriesConfig.bucket;
    const impactBucket = process.env.NEXT_PUBLIC_INFLUX_IMPACT_BUCKET || 'facility-impact';

    // 1. Calculate Average CPU Utilization
    const avgCpuFraction = await queryInfluxAverage(
      influx,
      org,
      bucket,
      'server',
      'cpu_busy_fraction',
      {
        server_id: workload.server_id,
        container_label_io_kubernetes_container_name: workload.pod_name,
      },
      startDate,
      endDate,
      'mean'
    );

    const averageCpuUtilization = avgCpuFraction !== null ? avgCpuFraction * 100 : 0;

    // 2. Calculate Average Server Power
    const avgServerPower = await queryInfluxAverage(
      influx,
      org,
      bucket,
      'server',
      'server_energy_consumption_watts',
      {
        server_id: workload.server_id,
      },
      startDate,
      endDate,
      'mean'
    );

    const averageServerPowerForPod =
      avgServerPower !== null && avgCpuFraction !== null
        ? avgServerPower * avgCpuFraction
        : 0;

    // 3. Calculate Total Energy Consumption for Pod
    const durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    const totalEnergyConsumptionForPod = averageServerPowerForPod * durationHours;

    // 4. Calculate Grid Renewable Percentage Average
    const avgRenewablePercentage = await queryInfluxAverage(
      influx,
      org,
      bucket,
      'facility',
      'grid_renewable_percentage',
      {
        facility_id: workload.facility_id,
      },
      startDate,
      endDate,
      'mean'
    );

    const gridRenewablePercentageAverage = avgRenewablePercentage || 0;

    // 5 & 6. Calculate Total Renewable and Non-Renewable Energy Consumption
    const totalRenewableEnergyConsumption =
      (totalEnergyConsumptionForPod * gridRenewablePercentageAverage) / 100;
    const totalNonRenewableEnergyConsumption =
      totalEnergyConsumptionForPod - totalRenewableEnergyConsumption;

    // 7. Calculate Total Operational CO2 Emissions
    const avgEmissionFactor = await queryInfluxAverage(
      influx,
      org,
      bucket,
      'facility',
      'grid_emission_factor_grams',
      {
        facility_id: workload.facility_id,
      },
      startDate,
      endDate,
      'mean'
    );

    const totalOperationalCo2Emissions =
      avgEmissionFactor !== null
        ? (totalNonRenewableEnergyConsumption / 1000) * avgEmissionFactor
        : 0;

    // 8. Calculate Facility Embodied Impacts Attributable
    const facilityEmbodiedImpactsAttributable: Record<string, number> = {};

    for (const metric of FACILITY_EMBODIED_METRICS) {
      try {
        const sum = await queryInfluxSum(
          influx,
          org,
          impactBucket,
          'facility_embodied',
          metric,
          {
            id: workload.facility_id,
          },
          startDate,
          endDate
        );

        facilityEmbodiedImpactsAttributable[metric] =
          sum !== null ? sum / totalNumberOfServers : 0;
      } catch (error) {
        console.error(`Error fetching facility embodied metric ${metric}:`, error);
        facilityEmbodiedImpactsAttributable[metric] = 0;
      }
    }

    // 9. Calculate Server Embodied Impacts Attributable
    const serverEmbodiedImpactsAttributable: Record<string, number> = {};

    for (const metric of SERVER_EMBODIED_METRICS) {
      try {
        const sum = await queryInfluxSum(
          influx,
          org,
          impactBucket,
          'server_embodied',
          metric,
          {
            id: workload.server_id,
          },
          startDate,
          endDate
        );

        serverEmbodiedImpactsAttributable[metric] =
          sum !== null && avgCpuFraction !== null ? sum * avgCpuFraction : 0;
      } catch (error) {
        console.error(`Error fetching server embodied metric ${metric}:`, error);
        serverEmbodiedImpactsAttributable[metric] = 0;
      }
    }

    // Build response
    const responseData: WorkloadQueryResponse = {
      averageCpuUtilization,
      averageServerPowerForPod,
      totalEnergyConsumptionForPod,
      gridRenewablePercentageAverage,
      totalRenewableEnergyConsumption,
      totalNonRenewableEnergyConsumption,
      totalOperationalCo2Emissions,
      facilityEmbodiedImpactsAttributable,
      serverEmbodiedImpactsAttributable,
    };

    // Add cache control headers for successful responses
    const response = NextResponse.json(responseData);
    response.headers.set('Cache-Control', 'private, max-age=300'); // Cache for 5 minutes
    return response;
  } catch (error) {
    console.error('Unexpected error querying workload metrics:', error);
    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// CORS configuration for this endpoint
const corsConfig = {
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  allowedMethods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Api-Key'],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],
  maxAge: 86400, // 24 hours
  credentials: false,
};

// Rate limit configuration for this endpoint
const rateLimitConfig = {
  maxRequests: parseInt(process.env.API_RATE_LIMIT_MAX_REQUESTS || '100', 10),
  windowSeconds: parseInt(process.env.API_RATE_LIMIT_WINDOW_SECONDS || '60', 10),
};

// GET /api/workloads/[id]/query?from=<unix_timestamp>&to=<unix_timestamp>
// This endpoint is protected with API key authentication, rate limiting, and CORS
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withCors(
    withRateLimit(
      withApiKeyAuth(
        (req) => handleWorkloadQuery(req, context),
      ),
      rateLimitConfig
    ),
    corsConfig
  )(request);
}

// OPTIONS handler for CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return withCors(
    async () => new NextResponse(null, { status: 204 }),
    corsConfig
  )(request);
}
