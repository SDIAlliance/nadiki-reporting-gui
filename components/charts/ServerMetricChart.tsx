'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Legend } from 'recharts';
import { format } from 'date-fns';
import { InfluxDB } from '@influxdata/influxdb-client';

export interface ServerMetricChartProps {
  title: string;
  description?: string;
  serverId: string;
  influxConfig?: {
    url: string;
    token: string;
    org: string;
  };
  bucket: string;
  fields: string[];
  aggregation?: 'mean' | 'sum' | 'max' | 'min';
  timeRange?: {
    start: Date;
    end: Date;
  };
  yAxisLabel?: string;
  formatValue?: (value: number) => string;
  height?: number;
  convertToKilobytes?: boolean; // Special flag for byte to KB conversion
}

interface DataPoint {
  time: string;
  [key: string]: string | number;
}

const DEFAULT_COLORS = [
  '#2563eb', // blue
  '#16a34a', // green
  '#dc2626', // red
  '#ca8a04', // yellow
  '#9333ea', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

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

export function ServerMetricChart({
  title,
  description,
  serverId,
  influxConfig,
  bucket,
  fields,
  aggregation = 'mean',
  timeRange,
  yAxisLabel,
  formatValue = formatCompactNumber,
  height = 400,
  convertToKilobytes = false,
}: ServerMetricChartProps) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [series, setSeries] = useState<string[]>([]);
  const [hasNoData, setHasNoData] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        setHasNoData(false);

        // If no influx config provided, use mock data
        if (!influxConfig) {
          const mockData = generateMockData(fields);
          setData(mockData.data);
          setSeries(mockData.series);
          setHasNoData(mockData.data.length === 0);
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

        // Add measurement and server_id filter
        query += `\n  |> filter(fn: (r) => r._measurement == "server")`;
        query += `\n  |> filter(fn: (r) => r.server_id == "${serverId}")`;

        // Add field filters
        if (fields.length > 0) {
          const fieldFilter = fields.map(f => `r._field == "${f}"`).join(' or ');
          query += `\n  |> filter(fn: (r) => ${fieldFilter})`;
        }

        // Determine aggregation window based on time range
        let aggregationWindow = '1h';
        if (timeRange) {
          const rangeDays = Math.abs((timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24));
          if (rangeDays <= 1) {
            aggregationWindow = '15m';
          } else if (rangeDays <= 7) {
            aggregationWindow = '1h';
          } else if (rangeDays <= 31) {
            aggregationWindow = '6h';
          } else {
            aggregationWindow = '1d';
          }
        }

        // Choose aggregation function
        const aggFunction = aggregation === 'sum' ? 'sum' :
                           aggregation === 'max' ? 'max' :
                           aggregation === 'min' ? 'min' : 'mean';

        // For CPU utilization with multiple cores, we need special handling
        const hasCpuTag = fields.includes('cpu_busy_faction');

        if (hasCpuTag) {
          // For CPU metrics, average across all cpu tags first, then aggregate over time
          query += `\n  |> group(columns: ["_time", "_field"])`;
          query += `\n  |> mean()`;
          query += `\n  |> aggregateWindow(every: ${aggregationWindow}, fn: mean, createEmpty: false)`;
        } else {
          query += `\n  |> aggregateWindow(every: ${aggregationWindow}, fn: ${aggFunction}, createEmpty: false)`;
        }

        // Pivot to get fields as columns
        query += `\n  |> pivot(rowKey:["_time"], columnKey:["_field"], valueColumn:"_value")`;

        console.log('InfluxDB Query:', query);

        // Execute query and collect results
        const results: DataPoint[] = [];
        const seriesSet = new Set<string>();

        await new Promise<void>((resolve, reject) => {
          queryApi.queryRows(query, {
            next(row: string[], tableMeta: { columns: Array<{ label: string }> }) {
              const point: DataPoint = {};

              tableMeta.columns.forEach((col: { label: string }, index: number) => {
                if (col.label === '_time') {
                  point.time = row[index];
                } else if (fields.includes(col.label)) {
                  let value = parseFloat(row[index]);

                  // Convert bytes to kilobytes if needed
                  if (convertToKilobytes) {
                    value = value / 1024;
                  }

                  point[col.label] = value;
                  seriesSet.add(col.label);
                }
              });

              // Only add if we have time and at least one value
              if (point.time && Object.keys(point).length > 1) {
                results.push(point);
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
        setSeries(Array.from(seriesSet));
        setHasNoData(results.length === 0);

      } catch (err) {
        console.error('Error fetching InfluxDB data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');

        // Fall back to mock data on error
        const mockData = generateMockData(fields);
        setData(mockData.data);
        setSeries(mockData.series);
        setHasNoData(mockData.data.length === 0);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [influxConfig, bucket, serverId, fields, aggregation, timeRange, convertToKilobytes]);

  // Mock data generator
  function generateMockData(fields: string[]) {
    const data: DataPoint[] = [];
    const seriesSet = new Set<string>();

    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      const point: DataPoint = {
        time: date.toISOString(),
      };

      fields.forEach(field => {
        point[field] = Math.random() * 100;
        seriesSet.add(field);
      });

      data.push(point);
    }

    return { data, series: Array.from(seriesSet) };
  }

  // Generate chart configuration with friendly labels
  const chartConfig: ChartConfig = {};
  series.forEach((s, idx) => {
    const label = s
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

    chartConfig[s] = {
      label,
      color: DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
    };
  });

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
                tickFormatter={(value) => format(new Date(value), 'MMM dd HH:mm')}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
                tickFormatter={formatValue}
              />
              <ChartTooltip
                content={<ChartTooltipContent />}
              />
              <Legend />
              {series.map((s) => (
                <Line
                  key={s}
                  type="monotone"
                  dataKey={s}
                  stroke={`var(--color-${s})`}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 6,
                  }}
                  name={chartConfig[s]?.label || s}
                />
              ))}
            </LineChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
