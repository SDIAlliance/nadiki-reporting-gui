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
  incomplete?: boolean; // True if critical data is missing and client should refetch
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

// Helper function to get the last available value from InfluxDB (fallback when no data in time range)
async function queryInfluxLast(
  influx: InfluxDB,
  org: string,
  bucket: string,
  measurement: string,
  field: string,
  filters: Record<string, string>,
  beforeTime: Date
): Promise<{ value: number; timestamp: Date } | null> {
  const queryApi = influx.getQueryApi(org);

  // Query for the last value before the specified time
  let query = `from(bucket: "${bucket}")
  |> range(start: -30d, stop: ${beforeTime.toISOString()})
  |> filter(fn: (r) => r._measurement == "${measurement}")
  |> filter(fn: (r) => r._field == "${field}")`;

  // Add additional filters
  for (const [key, value] of Object.entries(filters)) {
    query += `\n  |> filter(fn: (r) => r["${key}"] == "${value}")`;
  }

  // For CPU utilization, we need to aggregate across cores
  if (field === 'cpu_busy_fraction') {
    query += `\n  |> group(columns: ["_time"])
  |> sum()`;
  }

  query += `\n  |> last()
  |> yield(name: "last")`;

  let result: { value: number; timestamp: Date } | null = null;

  await new Promise<void>((resolve, reject) => {
    queryApi.queryRows(query, {
      next(row: string[], tableMeta: { columns: Array<{ label: string }> }) {
        const valueIndex = tableMeta.columns.findIndex((c: { label: string }) => c.label === '_value');
        const timeIndex = tableMeta.columns.findIndex((c: { label: string }) => c.label === '_time');
        if (valueIndex >= 0 && timeIndex >= 0) {
          result = {
            value: parseFloat(row[valueIndex]),
            timestamp: new Date(row[timeIndex]),
          };
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

    // Initialize InfluxDB client for server metrics
    const influx = new InfluxDB({
      url: serverDetail.timeSeriesConfig.endpoint,
      token: serverDetail.timeSeriesConfig.token,
    });

    const org = serverDetail.timeSeriesConfig.org;
    const bucket = serverDetail.timeSeriesConfig.bucket;

    // Initialize separate InfluxDB client for impact/aggregation bucket
    // This uses the credentials from environment variables, not facility credentials
    const impactInflux = new InfluxDB({
      url: process.env.NEXT_PUBLIC_INFLUX_URL || '',
      token: process.env.NEXT_PUBLIC_INFLUX_TOKEN || '',
    });

    const impactOrg = process.env.NEXT_PUBLIC_INFLUX_ORG || '';
    const impactBucket = process.env.NEXT_PUBLIC_INFLUX_IMPACT_BUCKET || 'facility-impact';

    // 1. Calculate Average CPU Utilization
    console.log('Querying CPU utilization for time range:', startDate.toISOString(), 'to', endDate.toISOString());
    let avgCpuFraction = await queryInfluxAverage(
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

    // Fallback: try to get the last available value if no data in the time range
    if (avgCpuFraction === null) {
      console.log('No CPU data in time range, attempting to get last available value...');
      const lastCpuData = await queryInfluxLast(
        influx,
        org,
        bucket,
        'server',
        'cpu_busy_fraction',
        {
          server_id: workload.server_id,
          container_label_io_kubernetes_container_name: workload.pod_name,
        },
        startDate
      );

      if (lastCpuData !== null) {
        const timeDiffSeconds = (startDate.getTime() - lastCpuData.timestamp.getTime()) / 1000;
        console.log(`Found last available CPU fraction: ${lastCpuData.value} at ${lastCpuData.timestamp.toISOString()}`);
        console.log(`Time difference from query start: ${timeDiffSeconds} seconds`);

        // Only accept if timestamp is within 15 seconds of the start time
        if (timeDiffSeconds <= 15) {
          avgCpuFraction = lastCpuData.value;
          console.log('Accepting last CPU value (within 15 seconds)');
        } else {
          console.log('Rejecting last CPU value (more than 15 seconds old)');
        }
      } else {
        console.log('No CPU data available at all (even with fallback)');
      }
    } else {
      console.log('CPU fraction from time range:', avgCpuFraction);
    }

    // If CPU fraction is 0, default to 10% as it cannot realistically be zero
    if (avgCpuFraction !== null && avgCpuFraction === 0) {
      console.log('CPU fraction is 0, defaulting to 10% (0.1) as zero is unrealistic');
      avgCpuFraction = 0.1;
    }

    // 2. Calculate Average Server Power
    console.log('Querying server power for time range...');
    let avgServerPower = await queryInfluxAverage(
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

    // Fallback: try to get the last available value if no data in the time range
    if (avgServerPower === null) {
      console.log('No server power data in time range, attempting to get last available value...');
      const lastPowerData = await queryInfluxLast(
        influx,
        org,
        bucket,
        'server',
        'server_energy_consumption_watts',
        {
          server_id: workload.server_id,
        },
        startDate
      );

      if (lastPowerData !== null) {
        const timeDiffSeconds = (startDate.getTime() - lastPowerData.timestamp.getTime()) / 1000;
        console.log(`Found last available server power: ${lastPowerData.value}W at ${lastPowerData.timestamp.toISOString()}`);
        console.log(`Time difference from query start: ${timeDiffSeconds} seconds`);

        // Only accept if timestamp is within 15 seconds of the start time
        if (timeDiffSeconds <= 15) {
          avgServerPower = lastPowerData.value;
          console.log('Accepting last server power value (within 15 seconds)');
        } else {
          console.log('Rejecting last server power value (more than 15 seconds old)');
        }
      } else {
        console.log('No server power data available at all (even with fallback)');
      }
    } else {
      console.log('Server power from time range:', avgServerPower);
    }

    // 3. Calculate Grid Renewable Percentage Average
    console.log('Querying grid renewable percentage for time range...');
    let avgRenewablePercentage = await queryInfluxAverage(
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

    // Fallback: try to get the last available value if no data in the time range
    if (avgRenewablePercentage === null) {
      console.log('No renewable percentage data in time range, attempting to get last available value...');
      const lastRenewableData = await queryInfluxLast(
        influx,
        org,
        bucket,
        'facility',
        'grid_renewable_percentage',
        {
          facility_id: workload.facility_id,
        },
        startDate
      );

      if (lastRenewableData !== null) {
        const timeDiffMinutes = (startDate.getTime() - lastRenewableData.timestamp.getTime()) / (1000 * 60);
        console.log(`Found last available renewable percentage: ${lastRenewableData.value}% at ${lastRenewableData.timestamp.toISOString()}`);
        console.log(`Time difference from query start: ${timeDiffMinutes.toFixed(2)} minutes`);

        // Only accept if timestamp is within 30 minutes of the start time
        if (timeDiffMinutes <= 30) {
          avgRenewablePercentage = lastRenewableData.value;
          console.log('Accepting last renewable percentage value (within 30 minutes)');
        } else {
          console.log('Rejecting last renewable percentage value (more than 30 minutes old)');
        }
      } else {
        console.log('No renewable percentage data available at all (even with fallback)');
      }
    } else {
      console.log('Renewable percentage from time range:', avgRenewablePercentage);
    }

    // 4. Calculate Total Operational CO2 Emissions - Get Emission Factor
    console.log('Querying emission factor for time range...');
    let avgEmissionFactor = await queryInfluxAverage(
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

    // Fallback: try to get the last available value if no data in the time range
    if (avgEmissionFactor === null) {
      console.log('No emission factor data in time range, attempting to get last available value...');
      const lastEmissionData = await queryInfluxLast(
        influx,
        org,
        bucket,
        'facility',
        'grid_emission_factor_grams',
        {
          facility_id: workload.facility_id,
        },
        startDate
      );

      if (lastEmissionData !== null) {
        const timeDiffMinutes = (startDate.getTime() - lastEmissionData.timestamp.getTime()) / (1000 * 60);
        console.log(`Found last available emission factor: ${lastEmissionData.value} g/kWh at ${lastEmissionData.timestamp.toISOString()}`);
        console.log(`Time difference from query start: ${timeDiffMinutes.toFixed(2)} minutes`);

        // Only accept if timestamp is within 30 minutes of the start time
        if (timeDiffMinutes <= 30) {
          avgEmissionFactor = lastEmissionData.value;
          console.log('Accepting last emission factor value (within 30 minutes)');
        } else {
          console.log('Rejecting last emission factor value (more than 30 minutes old)');
        }
      } else {
        console.log('No emission factor data available at all (even with fallback)');
      }
    } else {
      console.log('Emission factor from time range:', avgEmissionFactor);
    }

    // Check if critical data is available
    // If any critical metric is missing, return incomplete response for client to refetch
    const isCriticalDataMissing =
      avgCpuFraction === null ||
      avgServerPower === null ||
      avgRenewablePercentage === null ||
      avgEmissionFactor === null;

    if (isCriticalDataMissing) {
      console.log('=== INCOMPLETE DATA - Client should refetch ===');
      console.log('Missing critical data:', {
        avgCpuFraction: avgCpuFraction === null ? 'MISSING' : 'present',
        avgServerPower: avgServerPower === null ? 'MISSING' : 'present',
        avgRenewablePercentage: avgRenewablePercentage === null ? 'MISSING' : 'present',
        avgEmissionFactor: avgEmissionFactor === null ? 'MISSING' : 'present',
      });
      console.log('=====================================\n');

      // Return incomplete response with zeros
      const incompleteResponse: WorkloadQueryResponse = {
        incomplete: true,
        averageCpuUtilization: 0,
        averageServerPowerForPod: 0,
        totalEnergyConsumptionForPod: 0,
        gridRenewablePercentageAverage: 0,
        totalRenewableEnergyConsumption: 0,
        totalNonRenewableEnergyConsumption: 0,
        totalOperationalCo2Emissions: 0,
        facilityEmbodiedImpactsAttributable: {},
        serverEmbodiedImpactsAttributable: {},
      };

      return NextResponse.json(incompleteResponse);
    }

    // All critical data is available, proceed with calculations
    const averageCpuUtilization = avgCpuFraction * 100;
    const averageServerPowerForPod = avgServerPower * avgCpuFraction;
    const durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    const totalEnergyConsumptionForPod = averageServerPowerForPod * durationHours;
    const gridRenewablePercentageAverage = avgRenewablePercentage;
    const totalRenewableEnergyConsumptionCalc =
      (totalEnergyConsumptionForPod * gridRenewablePercentageAverage) / 100;
    const totalNonRenewableEnergyConsumptionCalc =
      totalEnergyConsumptionForPod - totalRenewableEnergyConsumptionCalc;
    const totalOperationalCo2Emissions =
      (totalNonRenewableEnergyConsumptionCalc / 1000) * avgEmissionFactor;

    // 8. Calculate Facility Embodied Impacts Attributable
    const facilityEmbodiedImpactsAttributable: Record<string, number> = {};

    for (const metric of FACILITY_EMBODIED_METRICS) {
      try {
        const sum = await queryInfluxSum(
          impactInflux,
          impactOrg,
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
          impactInflux,
          impactOrg,
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
          sum !== null ? sum * avgCpuFraction : 0;
      } catch (error) {
        console.error(`Error fetching server embodied metric ${metric}:`, error);
        serverEmbodiedImpactsAttributable[metric] = 0;
      }
    }

    // Helper function to format numbers to 6 decimal places
    const formatNumber = (num: number): number => {
      return Number(num.toFixed(6));
    };

    // Format all impact values to 6 decimal places
    const formattedFacilityImpacts: Record<string, number> = {};
    for (const [key, value] of Object.entries(facilityEmbodiedImpactsAttributable)) {
      formattedFacilityImpacts[key] = formatNumber(value);
    }

    const formattedServerImpacts: Record<string, number> = {};
    for (const [key, value] of Object.entries(serverEmbodiedImpactsAttributable)) {
      formattedServerImpacts[key] = formatNumber(value);
    }

    // Log all calculations and assumptions for debugging
    const durationSeconds = (endDate.getTime() - startDate.getTime()) / 1000;
    console.log('=== Workload Query Calculation Debug ===');
    console.log('Workload ID:', id);
    console.log('Time Range:', { from: startDate.toISOString(), to: endDate.toISOString() });
    console.log('Timespan (seconds):', durationSeconds);
    console.log('Duration (hours):', durationHours);
    console.log('\n--- CPU Utilization ---');
    console.log('avgCpuFraction (from query):', avgCpuFraction);
    console.log('averageCpuUtilization (%):', averageCpuUtilization);
    console.log('\n--- Power & Energy ---');
    console.log('avgServerPower (W):', avgServerPower);
    console.log('CPU utilization factor used:', avgCpuFraction);
    console.log('averageServerPowerForPod (W) = avgServerPower * avgCpuFraction:', averageServerPowerForPod);
    console.log('totalEnergyConsumptionForPod (Wh) = averageServerPowerForPod * durationHours:', totalEnergyConsumptionForPod);
    console.log('\n--- Grid & Emissions ---');
    console.log('gridRenewablePercentageAverage (%):', gridRenewablePercentageAverage);
    console.log('avgEmissionFactor (g CO2/kWh):', avgEmissionFactor);
    console.log('totalRenewableEnergyConsumption (Wh):', totalRenewableEnergyConsumptionCalc);
    console.log('totalNonRenewableEnergyConsumption (Wh):', totalNonRenewableEnergyConsumptionCalc);
    console.log('totalOperationalCo2Emissions (g):', totalOperationalCo2Emissions);
    console.log('\n--- Embodied Impacts ---');
    console.log('Facility total servers:', totalNumberOfServers);
    console.log('facilityEmbodiedImpactsAttributable (per server):', formattedFacilityImpacts);
    console.log('serverEmbodiedImpactsAttributable (CPU fraction applied):', formattedServerImpacts);
    console.log('=====================================\n');

    // Build response with formatted values
    const responseData: WorkloadQueryResponse = {
      incomplete: false,
      averageCpuUtilization: formatNumber(averageCpuUtilization),
      averageServerPowerForPod: formatNumber(averageServerPowerForPod),
      totalEnergyConsumptionForPod: formatNumber(totalEnergyConsumptionForPod),
      gridRenewablePercentageAverage: formatNumber(gridRenewablePercentageAverage),
      totalRenewableEnergyConsumption: formatNumber(totalRenewableEnergyConsumptionCalc),
      totalNonRenewableEnergyConsumption: formatNumber(totalNonRenewableEnergyConsumptionCalc),
      totalOperationalCo2Emissions: formatNumber(totalOperationalCo2Emissions),
      facilityEmbodiedImpactsAttributable: formattedFacilityImpacts,
      serverEmbodiedImpactsAttributable: formattedServerImpacts,
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
  allowedOrigins: '*', // Allow all origins
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
        (req: NextRequest) => handleWorkloadQuery(req, context)
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
