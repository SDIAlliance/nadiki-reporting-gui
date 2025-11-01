'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Legend } from 'recharts';
import { format } from 'date-fns';
import { InfluxDB } from '@influxdata/influxdb-client';

export interface InfluxLineChartProps {
  title: string;
  description?: string;
  influxConfig?: {
    url: string;
    token: string;
    org: string;
  };
  bucket: string;
  measurement: string;
  fields: string[];
  filters?: Record<string, string>;
  groupBy?: string[];
  timeRange?: {
    start: Date;
    end: Date;
  };
  yAxisLabel?: string;
  colors?: string[];
  height?: number;
  formatValue?: (value: number) => string;
}

interface DataPoint {
  time: string;
  [key: string]: any;
}

const DEFAULT_COLORS = [
  '#2563eb', // blue
  '#16a34a', // green
  '#dc2626', // red
  '#ca8a04', // yellow
  '#9333ea', // purple
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

export function InfluxLineChart({
  title,
  description,
  influxConfig,
  bucket,
  measurement,
  fields,
  filters,
  groupBy,
  timeRange,
  yAxisLabel,
  colors = DEFAULT_COLORS,
  height = 400,
  formatValue = (value) => value.toFixed(2),
}: InfluxLineChartProps) {
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
          const mockData = generateMockData(fields, groupBy);
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

        // Add measurement filter
        query += `\n  |> filter(fn: (r) => r._measurement == "${measurement}")`;

        // Add field filters
        if (fields.length > 0) {
          const fieldFilter = fields.map(f => `r._field == "${f}"`).join(' or ');
          query += `\n  |> filter(fn: (r) => ${fieldFilter})`;
        }

        // Add custom filters
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            query += `\n  |> filter(fn: (r) => r.${key} == "${value}")`;
          });
        }

        // Add aggregation window for better performance - adjust based on time range
        let aggregationWindow = '1h';
        if (timeRange) {
          const rangeDays = Math.abs((timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24));
          if (rangeDays <= 1) {
            aggregationWindow = '15m'; // For today, aggregate every 15 minutes
          } else if (rangeDays <= 7) {
            aggregationWindow = '1h'; // For week, aggregate every hour
          } else if (rangeDays <= 31) {
            aggregationWindow = '6h'; // For month, aggregate every 6 hours
          } else {
            aggregationWindow = '1d'; // For year, aggregate daily
          }
        }
        query += `\n  |> aggregateWindow(every: ${aggregationWindow}, fn: mean, createEmpty: false)`;

        // Add pivot to get fields as columns if not grouping
        if (!groupBy || groupBy.length === 0) {
          query += `\n  |> pivot(rowKey:["_time"], columnKey:["_field"], valueColumn:"_value")`;
        }

        // Execute query and collect results
        const results: DataPoint[] = [];
        const seriesSet = new Set<string>();

        await new Promise<void>((resolve, reject) => {
          queryApi.queryRows(query, {
            next(row: string[], tableMeta: any) {
              const point: DataPoint = {};

              tableMeta.columns.forEach((col: any, index: number) => {
                if (col.label === '_time') {
                  point.time = row[index];
                } else if (col.label === '_value') {
                  const fieldName = row[tableMeta.columns.findIndex((c: any) => c.label === '_field')] || 'value';

                  // If grouping, create a unique key for each series
                  if (groupBy && groupBy.length > 0) {
                    const groupValues = groupBy.map(g => {
                      const idx = tableMeta.columns.findIndex((c: any) => c.label === g);
                      return idx >= 0 ? row[idx] : '';
                    }).filter(v => v);

                    const seriesKey = groupValues.length > 0
                      ? `${groupValues.join('_')}_${fieldName}`
                      : fieldName;

                    point[seriesKey] = parseFloat(row[index]);
                    seriesSet.add(seriesKey);
                  } else {
                    point[fieldName] = parseFloat(row[index]);
                    seriesSet.add(fieldName);
                  }
                } else if (fields.includes(col.label)) {
                  // Handle pivoted data
                  point[col.label] = parseFloat(row[index]);
                  seriesSet.add(col.label);
                }
              });

              // Only add if we have time and at least one value
              if (point.time && Object.keys(point).length > 1) {
                // Check if we already have a point for this time
                const existingPoint = results.find(p => p.time === point.time);
                if (existingPoint) {
                  // Merge with existing point
                  Object.assign(existingPoint, point);
                } else {
                  results.push(point);
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

        // Sort by time
        results.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

        setData(results);
        setSeries(Array.from(seriesSet));
        setHasNoData(results.length === 0);

      } catch (err) {
        console.error('Error fetching InfluxDB data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');

        // Fall back to mock data on error
        const mockData = generateMockData(fields, groupBy);
        setData(mockData.data);
        setSeries(mockData.series);
        setHasNoData(mockData.data.length === 0);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [influxConfig, bucket, measurement, fields, filters, groupBy, timeRange]);

  // Mock data generator
  function generateMockData(fields: string[], groupByFields?: string[]) {
    const data: DataPoint[] = [];
    const seriesSet = new Set<string>();

    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      const point: DataPoint = {
        time: date.toISOString(),
      };

      if (groupByFields && groupByFields.length > 0) {
        // Generate grouped data
        const groups = ['Group A', 'Group B', 'Group C'];
        groups.forEach((group, idx) => {
          fields.forEach(field => {
            const key = `${group}_${field}`;
            point[key] = Math.random() * 100 * (idx + 1);
            seriesSet.add(key);
          });
        });
      } else {
        // Simple fields
        fields.forEach(field => {
          point[field] = Math.random() * 100;
          seriesSet.add(field);
        });
      }

      data.push(point);
    }

    return { data, series: Array.from(seriesSet) };
  }

  // Generate chart configuration
  const chartConfig: ChartConfig = {};
  series.forEach((s, idx) => {
    chartConfig[s] = {
      label: s.replace(/_/g, ' '),
      color: colors[idx % colors.length],
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
                tickFormatter={(value) => format(new Date(value), 'MMM dd')}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
                tickFormatter={formatCompactNumber}
              />
              <ChartTooltip
                content={<ChartTooltipContent />}
              />
              <Legend />
              {series.map((s) => {
                return (
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
                    name={s.replace(/_/g, ' ')}
                  />
                );
              })}
            </LineChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}