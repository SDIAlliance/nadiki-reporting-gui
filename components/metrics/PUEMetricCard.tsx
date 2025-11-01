'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfluxDB } from '@influxdata/influxdb-client';

interface PUEMetricCardProps {
  title: string;
  field: 'pue_1_ratio' | 'pue_2_ratio';
  facilityId: string;
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

export function PUEMetricCard({
  title,
  field,
  facilityId,
  influxConfig,
  bucket,
  timeRange,
}: PUEMetricCardProps) {
  const [average, setAverage] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAverage = async () => {
      try {
        setLoading(true);
        setError(null);

        // If no influx config provided, show no data
        if (!influxConfig) {
          setAverage(null);
          setLoading(false);
          return;
        }

        // Create InfluxDB client
        const influx = new InfluxDB({
          url: influxConfig.url,
          token: influxConfig.token,
        });

        const queryApi = influx.getQueryApi(influxConfig.org);

        // Build InfluxDB query to get the average over the time range
        let query = `from(bucket: "${bucket}")`;

        // Add time range filter
        if (timeRange) {
          query += `\n  |> range(start: ${timeRange.start.toISOString()}, stop: ${timeRange.end.toISOString()})`;
        } else {
          query += `\n  |> range(start: -30d)`;
        }

        // Add measurement and field filters
        query += `\n  |> filter(fn: (r) => r._measurement == "facility")`;
        query += `\n  |> filter(fn: (r) => r._field == "${field}")`;
        query += `\n  |> filter(fn: (r) => r.facility_id == "${facilityId}")`;

        // Calculate mean over the entire period
        query += `\n  |> mean()`;
        query += `\n  |> yield(name: "mean")`;

        console.log(`PUE Average Query for ${field}:`, query);

        // Execute query and get the result
        let avgValue: number | null = null;

        await new Promise<void>((resolve, reject) => {
          queryApi.queryRows(query, {
            next(row: string[], tableMeta: { columns: Array<{ label: string }> }) {
              const valueIndex = tableMeta.columns.findIndex((c: { label: string }) => c.label === '_value');
              if (valueIndex >= 0) {
                avgValue = parseFloat(row[valueIndex]);
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

        setAverage(avgValue);

      } catch (err) {
        console.error('Error fetching PUE average:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        setAverage(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAverage();
  }, [influxConfig, bucket, field, facilityId, timeRange]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-muted-foreground">Loading...</div>
        ) : error ? (
          <div className="text-destructive text-sm">Error loading data</div>
        ) : average !== null ? (
          <>
            <div className="text-2xl font-bold">{average.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Average over selected period</p>
          </>
        ) : (
          <div className="text-muted-foreground">No data</div>
        )}
      </CardContent>
    </Card>
  );
}
