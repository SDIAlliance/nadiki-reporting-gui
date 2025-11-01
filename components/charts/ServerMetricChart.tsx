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
  convertToMegabytes?: boolean; // Special flag for byte to MB conversion
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
  convertToMegabytes = false,
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

        // Determine aggregation window based on time range (matching facility operational charts)
        let aggregationWindow = '1h';
        let rangeDays = 30; // Default to 30 days if no timeRange specified

        if (timeRange) {
          rangeDays = Math.abs((timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24));
        }

        if (rangeDays <= 1) {
          aggregationWindow = '30m'; // For 1 day or less, aggregate every 30 minutes
        } else if (rangeDays <= 7) {
          aggregationWindow = '1h'; // For week, aggregate every hour
        } else if (rangeDays < 30) {
          aggregationWindow = '6h'; // For less than 30 days, aggregate every 6 hours
        } else {
          aggregationWindow = '1d'; // For 30 days or more, aggregate daily
        }

        // Choose aggregation function
        const aggFunction = aggregation === 'sum' ? 'sum' :
                           aggregation === 'max' ? 'max' :
                           aggregation === 'min' ? 'min' : 'mean';

        // Query each field separately and merge by timestamp
        const allResults: Map<string, DataPoint[]> = new Map();

        for (const field of fields) {
          // Build InfluxDB query for this field
          let query = `from(bucket: "${bucket}")`;

          // Add time range filter
          if (timeRange) {
            query += `\n  |> range(start: ${timeRange.start.toISOString()}, stop: ${timeRange.end.toISOString()})`;
          } else {
            query += `\n  |> range(start: -30d)`;
          }

          // Add measurement and field filters
          query += `\n  |> filter(fn: (r) => r._measurement == "server")`;
          query += `\n  |> filter(fn: (r) => r._field == "${field}")`;
          query += `\n  |> filter(fn: (r) => r.server_id == "${serverId}")`;

          // For CPU utilization with multiple cores, we need special handling
          if (field === 'cpu_busy_faction') {
            // For CPU metrics, average across all cpu tags first, then aggregate over time
            query += `\n  |> group(columns: ["_time", "_field"])`;
            query += `\n  |> mean()`;
            query += `\n  |> aggregateWindow(every: ${aggregationWindow}, fn: mean, createEmpty: false)`;
          } else {
            query += `\n  |> aggregateWindow(every: ${aggregationWindow}, fn: ${aggFunction}, createEmpty: false)`;
          }

          // Keep only time and value
          query += `\n  |> keep(columns: ["_time", "_value"])`;
          query += `\n  |> yield(name: "result")`;

          console.log(`InfluxDB Query for ${field}:`, query);

          // Execute query and collect results
          const results: DataPoint[] = [];

          await new Promise<void>((resolve, reject) => {
            queryApi.queryRows(query, {
              next(row: string[], tableMeta: { columns: Array<{ label: string }> }) {
                const timeIndex = tableMeta.columns.findIndex((c: { label: string }) => c.label === '_time');
                const valueIndex = tableMeta.columns.findIndex((c: { label: string }) => c.label === '_value');

                if (timeIndex >= 0 && valueIndex >= 0) {
                  let rawValue = parseFloat(row[valueIndex]);

                  // Skip if value is NaN or null
                  if (isNaN(rawValue) || row[valueIndex] === null || row[valueIndex] === undefined || row[valueIndex] === '') {
                    return;
                  }

                  // Convert bytes to kilobytes or megabytes if needed
                  if (convertToMegabytes) {
                    rawValue = rawValue / (1024 * 1024); // Bytes to MB
                  } else if (convertToKilobytes) {
                    rawValue = rawValue / 1024; // Bytes to KB
                  }

                  results.push({
                    time: row[timeIndex],
                    [field]: rawValue,
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

          allResults.set(field, results);
        }

        // Merge all results by timestamp
        const mergedData: Map<string, DataPoint> = new Map();

        allResults.forEach((results, fieldName) => {
          results.forEach((point) => {
            const existing = mergedData.get(point.time);
            if (existing) {
              existing[fieldName] = point[fieldName];
            } else {
              mergedData.set(point.time, { time: point.time, [fieldName]: point[fieldName] });
            }
          });
        });

        // Convert to array and sort by time
        const finalData = Array.from(mergedData.values());
        finalData.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

        console.log('ServerMetricChart - Fetched data points:', finalData.length);
        console.log('ServerMetricChart - Series found:', fields);
        console.log('ServerMetricChart - Sample data:', finalData.slice(0, 3));

        setData(finalData);
        setSeries(fields);
        setHasNoData(finalData.length === 0);

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
  }, [influxConfig, bucket, serverId, fields, aggregation, timeRange, convertToKilobytes, convertToMegabytes]);

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

  // Calculate range in days for dynamic formatting
  const rangeDays = timeRange
    ? Math.abs((timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24))
    : 30;

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
              data={data}
              margin={{
                top: 5,
                right: 10,
                left: 10,
                bottom: 5,
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
                width={80}
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
              {series.map((s, idx) => (
                <Line
                  key={s}
                  type="monotone"
                  dataKey={s}
                  stroke={DEFAULT_COLORS[idx % DEFAULT_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  connectNulls={true}
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
