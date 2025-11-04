'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfluxDB } from '@influxdata/influxdb-client';

type EmbodiedImpactMetric =
  | 'climate_change'
  | 'ozone_depletion'
  | 'human_toxicity'
  | 'photochemical_oxidant_formation'
  | 'particulate_matter_formation'
  | 'ionizing_radiation'
  | 'terrestrial_acidification'
  | 'freshwater_eutrophication'
  | 'marine_eutrophication'
  | 'terrestrial_ecotoxicity'
  | 'freshwater_ecotoxicity'
  | 'marine_ecotoxicity'
  | 'agricultural_land_occupation'
  | 'urban_land_occupation'
  | 'natural_land_transformation'
  | 'water_depletion'
  | 'metal_depletion'
  | 'fossil_depletion';

// Mapping of metrics to friendly titles and units
const METRIC_INFO: Record<EmbodiedImpactMetric, { title: string; unit: string }> = {
  climate_change: {
    title: 'Climate Change',
    unit: 'kg CO2 eq',
  },
  ozone_depletion: {
    title: 'Ozone Depletion',
    unit: 'kg CFC-11 eq',
  },
  human_toxicity: {
    title: 'Human Toxicity',
    unit: 'kg 1,4-DB eq',
  },
  photochemical_oxidant_formation: {
    title: 'Photochemical Oxidant Formation',
    unit: 'kg NMVOC',
  },
  particulate_matter_formation: {
    title: 'Particulate Matter Formation',
    unit: 'kg PM10 eq',
  },
  ionizing_radiation: {
    title: 'Ionizing Radiation',
    unit: 'kg U235 eq',
  },
  terrestrial_acidification: {
    title: 'Terrestrial Acidification',
    unit: 'kg SO2 eq',
  },
  freshwater_eutrophication: {
    title: 'Freshwater Eutrophication',
    unit: 'kg P eq',
  },
  marine_eutrophication: {
    title: 'Marine Eutrophication',
    unit: 'kg N eq',
  },
  terrestrial_ecotoxicity: {
    title: 'Terrestrial Ecotoxicity',
    unit: 'kg 1,4-DB eq',
  },
  freshwater_ecotoxicity: {
    title: 'Freshwater Ecotoxicity',
    unit: 'kg 1,4-DB eq',
  },
  marine_ecotoxicity: {
    title: 'Marine Ecotoxicity',
    unit: 'kg 1,4-DB eq',
  },
  agricultural_land_occupation: {
    title: 'Agricultural Land Occupation',
    unit: 'm²a',
  },
  urban_land_occupation: {
    title: 'Urban Land Occupation',
    unit: 'm²a',
  },
  natural_land_transformation: {
    title: 'Natural Land Transformation',
    unit: 'm²',
  },
  water_depletion: {
    title: 'Water Depletion',
    unit: 'm³',
  },
  metal_depletion: {
    title: 'Metal Depletion',
    unit: 'kg Fe eq',
  },
  fossil_depletion: {
    title: 'Fossil Depletion',
    unit: 'kg oil eq',
  },
};

interface FacilityEmbodiedAttributableCardProps {
  metric: EmbodiedImpactMetric;
  facilityId: string;
  totalNumberOfServers: number;
  influxConfig?: {
    url: string;
    token: string;
    org: string;
  };
  bucket: string;
  timeRange?: {
    start: Date;
    end: Date;
  };
}

export function FacilityEmbodiedAttributableCard({
  metric,
  facilityId,
  totalNumberOfServers,
  influxConfig,
  bucket,
  timeRange,
}: FacilityEmbodiedAttributableCardProps) {
  const [sum, setSum] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const metricInfo = METRIC_INFO[metric];

  // Use 1 as divisor if totalNumberOfServers is 0 or undefined
  const divisor = totalNumberOfServers || 1;

  useEffect(() => {
    const fetchSum = async () => {
      try {
        setLoading(true);
        setError(null);

        // If no influx config provided, show no data
        if (!influxConfig) {
          setSum(null);
          setLoading(false);
          return;
        }

        // Create InfluxDB client
        const influx = new InfluxDB({
          url: influxConfig.url,
          token: influxConfig.token,
        });

        const queryApi = influx.getQueryApi(influxConfig.org);

        // Build InfluxDB query to get the sum over the time range
        let query = `from(bucket: "${bucket}")`;

        // Add time range filter
        if (timeRange) {
          query += `\n  |> range(start: ${timeRange.start.toISOString()}, stop: ${timeRange.end.toISOString()})`;
        } else {
          query += `\n  |> range(start: -30d)`;
        }

        // Add measurement and field filters for facility_embodied
        query += `\n  |> filter(fn: (r) => r._measurement == "facility_embodied")`;
        query += `\n  |> filter(fn: (r) => r._field == "${metric}")`;
        query += `\n  |> filter(fn: (r) => r.id == "${facilityId}")`;

        // Calculate sum over the entire period
        query += `\n  |> sum()`;
        query += `\n  |> yield(name: "sum")`;

        console.log(`Facility Embodied Sum Query for ${metric}:`, query);

        // Execute query and get the result
        let sumValue: number | null = null;

        await new Promise<void>((resolve, reject) => {
          queryApi.queryRows(query, {
            next(row: string[], tableMeta: { columns: Array<{ label: string }> }) {
              const valueIndex = tableMeta.columns.findIndex((c: { label: string }) => c.label === '_value');
              if (valueIndex >= 0) {
                const rawValue = parseFloat(row[valueIndex]);
                // Divide by totalNumberOfServers to get per-server attributable impact
                sumValue = rawValue / divisor;
              }
            },
            error(error: Error) {
              console.error('InfluxDB query error:', error);
              reject(error);
            },
            complete() {
              resolve();
            },
          });
        });

        setSum(sumValue);

      } catch (err) {
        console.error('Error fetching embodied impact sum:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        setSum(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSum();
  }, [influxConfig, bucket, metric, facilityId, timeRange, divisor]);

  // Format the value using scientific notation for very small numbers
  const formatValue = (value: number): string => {
    if (Math.abs(value) < 0.01) {
      return value.toExponential(2);
    }
    return value.toFixed(2);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">{metricInfo.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-muted-foreground">Loading...</div>
        ) : error ? (
          <div className="text-destructive text-sm">Error loading data</div>
        ) : sum !== null ? (
          <>
            <div className="text-2xl font-bold">{formatValue(sum)}</div>
            <p className="text-xs text-muted-foreground">
              {metricInfo.unit} per server - Total over selected period
            </p>
            {divisor === 1 && totalNumberOfServers === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                No server count available, showing full facility value
              </p>
            )}
          </>
        ) : (
          <div className="text-muted-foreground">No data</div>
        )}
      </CardContent>
    </Card>
  );
}
