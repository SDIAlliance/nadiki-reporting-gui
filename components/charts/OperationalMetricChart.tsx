'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { format } from 'date-fns';
import { InfluxDB } from '@influxdata/influxdb-client';

export type AggregationFunction = 'mean' | 'sum' | 'max' | 'min' | 'last' | 'first';

export interface OperationalMetricChartProps {
  title: string;
  description?: string;
  influxConfig?: {
    url: string;
    token: string;
    org: string;
  };
  bucket: string;
  field: string;
  facilityId: string;
  timeRange?: {
    start: Date;
    end: Date;
  };
  yAxisLabel?: string;
  aggregationFunction?: AggregationFunction;
  formatValue?: (value: number) => string;
  valueTransform?: (value: number) => number;
  height?: number;
  color?: string;
}

interface DataPoint {
  time: string;
  value: number;
}

const DEFAULT_COLOR = '#2563eb';

// Format numbers with K/M/B suffixes for compact display
function formatCompactNumber(value: number): string {
  const absValue = Math.abs(value);
  if (absValue >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  } else if (absValue >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  } else if (absValue >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toFixed(0);
}

// Determine aggregation window based on time range
function getAggregationWindow(timeRange?: { start: Date; end: Date }): string {
  if (!timeRange) {
    return '1h';
  }

  const rangeDays = Math.abs((timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24));

  if (rangeDays <= 1) {
    return '30m'; // For 1 day or less, aggregate every 30 minutes
  } else if (rangeDays <= 7) {
    return '1h'; // For week, aggregate every hour
  } else if (rangeDays < 30) {
    return '6h'; // For less than 30 days, aggregate every 6 hours
  } else {
    return '1d'; // For 30 days or more, aggregate daily
  }
}

export function OperationalMetricChart({
  title,
  description,
  influxConfig,
  bucket,
  field,
  facilityId,
  timeRange,
  yAxisLabel,
  aggregationFunction = 'mean',
  formatValue = (value) => value.toFixed(2),
  valueTransform = (value) => value,
  height = 400,
  color = DEFAULT_COLOR,
}: OperationalMetricChartProps) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasNoData, setHasNoData] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        setHasNoData(false);

        // If no influx config provided, show no data
        if (!influxConfig) {
          setData([]);
          setHasNoData(true);
          setLoading(false);
          return;
        }

        // Create InfluxDB client
        const influx = new InfluxDB({
          url: influxConfig.url,
          token: influxConfig.token,
        });

        const queryApi = influx.getQueryApi(influxConfig.org);

        // Build InfluxDB query
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

        // Add aggregation window based on time range
        const aggregationWindow = getAggregationWindow(timeRange);
        query += `\n  |> aggregateWindow(every: ${aggregationWindow}, fn: ${aggregationFunction}, createEmpty: false)`;

        // Keep only time and value
        query += `\n  |> keep(columns: ["_time", "_value"])`;
        query += `\n  |> yield(name: "result")`;

        console.log('InfluxDB Query:', query);
        console.log('Time Range:', timeRange);

        // Execute query and collect results
        const results: DataPoint[] = [];

        await new Promise<void>((resolve, reject) => {
          queryApi.queryRows(query, {
            next(row: string[], tableMeta: { columns: Array<{ label: string }> }) {
              const timeIndex = tableMeta.columns.findIndex((c: { label: string }) => c.label === '_time');
              const valueIndex = tableMeta.columns.findIndex((c: { label: string }) => c.label === '_value');

              if (timeIndex >= 0 && valueIndex >= 0) {
                const rawValue = parseFloat(row[valueIndex]);
                results.push({
                  time: row[timeIndex],
                  value: valueTransform(rawValue),
                });
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

        // Sort by time
        results.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

        setData(results);
        setHasNoData(results.length === 0);

      } catch (err) {
        console.error('Error fetching InfluxDB data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        setData([]);
        setHasNoData(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [influxConfig, bucket, field, facilityId, timeRange, aggregationFunction]);

  // Generate chart configuration
  const chartConfig: ChartConfig = {
    value: {
      label: field.replace(/_/g, ' '),
      color: color,
    },
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
            <div className="text-destructive">Error: {error}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hasNoData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
            <div className="text-muted-foreground">No data available for the selected time range</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: `${height}px` }}>
          <ChartContainer
            config={chartConfig}
            className="w-full h-full"
          >
            <LineChart
              width={1200}
              height={height}
              data={data}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="time"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  const rangeDays = timeRange
                    ? Math.abs((timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24))
                    : 30;

                  if (rangeDays <= 1) {
                    return format(date, 'HH:mm');
                  } else if (rangeDays <= 7) {
                    return format(date, 'MMM dd HH:mm');
                  } else {
                    return format(date, 'MMM dd');
                  }
                }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
                tickFormatter={formatCompactNumber}
              />
              <ChartTooltip
                content={<ChartTooltipContent
                  labelFormatter={(value) => format(new Date(value), 'PPpp')}
                  formatter={(value) => formatValue(value as number)}
                />}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 6,
                }}
                name={field.replace(/_/g, ' ')}
              />
            </LineChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
