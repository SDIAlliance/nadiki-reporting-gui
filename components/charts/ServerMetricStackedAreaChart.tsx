'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Legend } from 'recharts';
import { format } from 'date-fns';
import { InfluxDB } from '@influxdata/influxdb-client';

export interface ServerMetricStackedAreaChartProps {
  title: string;
  description?: string;
  serverId: string;
  influxConfig?: {
    url: string;
    token: string;
    org: string;
  };
  bucket: string;
  fields: Array<{
    field: string;
    label: string;
    color: string;
  }>;
  aggregation?: 'mean' | 'sum' | 'max' | 'min';
  timeRange?: {
    start: Date;
    end: Date;
  };
  yAxisLabel?: string;
  formatValue?: (value: number) => string;
  height?: number;
}

interface DataPoint {
  time: string;
  [key: string]: string | number;
}

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

export function ServerMetricStackedAreaChart({
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
}: ServerMetricStackedAreaChartProps) {
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

        // If no influx config provided, use mock data
        if (!influxConfig) {
          const mockData = generateMockData(fields);
          setData(mockData);
          setHasNoData(mockData.length === 0);
          setLoading(false);
          return;
        }

        // Create InfluxDB client
        const influx = new InfluxDB({
          url: influxConfig.url,
          token: influxConfig.token,
        });

        const queryApi = influx.getQueryApi(influxConfig.org);

        // Determine aggregation window based on time range
        let aggregationWindow = '1h';
        let rangeDays = 30;

        if (timeRange) {
          rangeDays = Math.abs((timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24));
        }

        if (rangeDays <= 1) {
          aggregationWindow = '30m';
        } else if (rangeDays <= 7) {
          aggregationWindow = '1h';
        } else if (rangeDays < 30) {
          aggregationWindow = '6h';
        } else {
          aggregationWindow = '1d';
        }

        // Choose aggregation function
        const aggFunction = aggregation === 'sum' ? 'sum' :
                           aggregation === 'max' ? 'max' :
                           aggregation === 'min' ? 'min' : 'mean';

        // Query each field separately and merge by timestamp
        const allResults: Map<string, DataPoint[]> = new Map();

        for (const fieldConfig of fields) {
          // Build InfluxDB query for this field
          let query = `from(bucket: "${bucket}")`;

          if (timeRange) {
            query += `\n  |> range(start: ${timeRange.start.toISOString()}, stop: ${timeRange.end.toISOString()})`;
          } else {
            query += `\n  |> range(start: -30d)`;
          }

          query += `\n  |> filter(fn: (r) => r._measurement == "server")`;
          query += `\n  |> filter(fn: (r) => r._field == "${fieldConfig.field}")`;
          query += `\n  |> filter(fn: (r) => r.server_id == "${serverId}")`;
          query += `\n  |> aggregateWindow(every: ${aggregationWindow}, fn: ${aggFunction}, createEmpty: false)`;
          query += `\n  |> keep(columns: ["_time", "_value"])`;
          query += `\n  |> yield(name: "result")`;

          console.log(`InfluxDB Query for ${fieldConfig.field}:`, query);

          // Execute query and collect results
          const results: DataPoint[] = [];

          await new Promise<void>((resolve, reject) => {
            queryApi.queryRows(query, {
              next(row: string[], tableMeta: { columns: Array<{ label: string }> }) {
                const timeIndex = tableMeta.columns.findIndex((c: { label: string }) => c.label === '_time');
                const valueIndex = tableMeta.columns.findIndex((c: { label: string }) => c.label === '_value');

                if (timeIndex >= 0 && valueIndex >= 0) {
                  const rawValue = parseFloat(row[valueIndex]);

                  if (!isNaN(rawValue) && row[valueIndex] !== null && row[valueIndex] !== undefined && row[valueIndex] !== '') {
                    results.push({
                      time: row[timeIndex],
                      [fieldConfig.field]: rawValue,
                    });
                  }
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

          allResults.set(fieldConfig.field, results);
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

        setData(finalData);
        setHasNoData(finalData.length === 0);

      } catch (err) {
        console.error('Error fetching InfluxDB data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');

        // Fall back to mock data on error
        const mockData = generateMockData(fields);
        setData(mockData);
        setHasNoData(mockData.length === 0);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [influxConfig, bucket, serverId, fields, aggregation, timeRange]);

  // Mock data generator
  function generateMockData(fieldConfigs: Array<{ field: string }>) {
    const data: DataPoint[] = [];

    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      const point: DataPoint = {
        time: date.toISOString(),
      };

      fieldConfigs.forEach(fieldConfig => {
        point[fieldConfig.field] = Math.random() * 100;
      });

      data.push(point);
    }

    return data;
  }

  // Calculate range in days for dynamic formatting
  const rangeDays = timeRange
    ? Math.abs((timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24))
    : 30;

  // Generate chart configuration
  const chartConfig: ChartConfig = {};
  fields.forEach((fieldConfig) => {
    chartConfig[fieldConfig.field] = {
      label: fieldConfig.label,
      color: fieldConfig.color,
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
            <AreaChart
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
              {fields.map((fieldConfig) => (
                <Area
                  key={fieldConfig.field}
                  type="monotone"
                  dataKey={fieldConfig.field}
                  stackId="1"
                  stroke={fieldConfig.color}
                  fill={fieldConfig.color}
                  fillOpacity={0.6}
                  strokeWidth={2}
                  name={fieldConfig.label}
                />
              ))}
            </AreaChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
