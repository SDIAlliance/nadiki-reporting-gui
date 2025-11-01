'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfluxDB } from '@influxdata/influxdb-client';
import {
  type ServerEmbodiedImpactMetric,
  SERVER_EMBODIED_METRIC_INFO,
} from '@/types/server-embodied-impact';

interface ServerEmbodiedMetricCardProps {
  metric: ServerEmbodiedImpactMetric;
  serverId: string;
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

export function ServerEmbodiedMetricCard({
  metric,
  serverId,
  influxConfig,
  bucket,
  timeRange,
}: ServerEmbodiedMetricCardProps) {
  const [sum, setSum] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const metricInfo = SERVER_EMBODIED_METRIC_INFO[metric];

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

        // Add measurement and field filters
        query += `\n  |> filter(fn: (r) => r._measurement == "server_embodied")`;
        query += `\n  |> filter(fn: (r) => r._field == "${metric}")`;
        query += `\n  |> filter(fn: (r) => r.id == "${serverId}")`;

        // Calculate sum over the entire period
        query += `\n  |> sum()`;
        query += `\n  |> yield(name: "sum")`;

        console.log(`Server Embodied Sum Query for ${metric}:`, query);

        // Execute query and get the result
        let sumValue: number | null = null;

        await new Promise<void>((resolve, reject) => {
          queryApi.queryRows(query, {
            next(row: string[], tableMeta: { columns: Array<{ label: string }> }) {
              const valueIndex = tableMeta.columns.findIndex((c: { label: string }) => c.label === '_value');
              if (valueIndex >= 0) {
                sumValue = parseFloat(row[valueIndex]);
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
  }, [influxConfig, bucket, metric, serverId, timeRange]);

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
              {metricInfo.unit} - Total over selected period
            </p>
          </>
        ) : (
          <div className="text-muted-foreground">No data</div>
        )}
      </CardContent>
    </Card>
  );
}
