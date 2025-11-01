'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Legend } from 'recharts';
import { format } from 'date-fns';
import { InfluxDB } from '@influxdata/influxdb-client';

export type AggregationFunction = 'mean' | 'sum' | 'max' | 'min' | 'last' | 'first';

export interface FieldConfig {
  field: string;
  label: string;
  color: string;
  aggregationFunction?: AggregationFunction;
}

export interface MultiFieldImpactChartProps {
  title: string;
  description?: string;
  influxConfig?: {
    url: string;
    token: string;
    org: string;
  };
  bucket: string;
  measurement?: string; // Default to 'impact' if not specified
  fields: FieldConfig[];
  facilityId: string;
  timeRange?: {
    start: Date;
    end: Date;
  };
  yAxisLabel?: string;
  defaultAggregation?: AggregationFunction;
  formatValue?: (value: number) => string;
  valueTransform?: (value: number) => number;
  height?: number;
  cumulative?: boolean; // For cumulative charts
  disableAutoScaling?: boolean; // Disable automatic unit scaling (kg->t, kWh->MWh)
  facilityIdTag?: string; // Tag name to use for facility filtering (default: 'facility_id')
  useFieldAsMetric?: boolean; // If true, use field name as _field filter instead of "_value"
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

export function MultiFieldImpactChart({
  title,
  description,
  influxConfig,
  bucket,
  measurement = 'impact',
  fields,
  facilityId,
  timeRange,
  yAxisLabel,
  defaultAggregation = 'sum',
  formatValue = (value) => value.toFixed(2),
  valueTransform = (value) => value,
  height = 400,
  cumulative = false,
  disableAutoScaling = false,
  facilityIdTag = 'facility_id',
  useFieldAsMetric = false,
}: MultiFieldImpactChartProps) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasNoData, setHasNoData] = useState(false);
  const [displayUnit, setDisplayUnit] = useState<'kg' | 'tonnes'>('kg');

  // Create a stable reference for fields to avoid unnecessary re-renders
  const fieldsKey = useMemo(() => JSON.stringify(fields.map(f => f.field)), [fields]);

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

        // Fetch data for each field
        const allResults: Map<string, DataPoint[]> = new Map();

        for (const fieldConfig of fields) {
          const aggFunc = fieldConfig.aggregationFunction || defaultAggregation;

          // Build InfluxDB query for this field
          let query = `from(bucket: "${bucket}")`;

          // Add time range filter
          if (timeRange) {
            query += `\n  |> range(start: ${timeRange.start.toISOString()}, stop: ${timeRange.end.toISOString()})`;
          } else {
            query += `\n  |> range(start: -30d)`;
          }

          // Add measurement and field filters
          query += `\n  |> filter(fn: (r) => r._measurement == "${measurement}")`;
          // For embodied impacts, _field is the metric name; for others, it's "_value"
          const fieldFilter = useFieldAsMetric ? fieldConfig.field : '_value';
          query += `\n  |> filter(fn: (r) => r._field == "${fieldFilter}")`;
          query += `\n  |> filter(fn: (r) => r.${facilityIdTag} == "${facilityId}")`;

          // Add aggregation window based on time range
          const aggregationWindow = getAggregationWindow(timeRange);

          if (cumulative) {
            // For cumulative, use cumulativeSum instead of aggregateWindow
            query += `\n  |> aggregateWindow(every: ${aggregationWindow}, fn: ${aggFunc}, createEmpty: false)`;
            query += `\n  |> cumulativeSum(columns: ["_value"])`;
          } else {
            // For period data, just aggregate normally
            query += `\n  |> aggregateWindow(every: ${aggregationWindow}, fn: ${aggFunc}, createEmpty: false)`;
          }

          // Keep only time and value
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
                  results.push({
                    time: row[timeIndex],
                    [fieldConfig.field]: valueTransform(rawValue),
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

        // Calculate average value to determine display unit (kg vs tonnes)
        if (disableAutoScaling) {
          // Auto-scaling disabled, always use base unit
          setDisplayUnit('kg');
        } else if (finalData.length > 0) {
          let totalValue = 0;
          let count = 0;

          finalData.forEach((point) => {
            fields.forEach((fieldConfig) => {
              const value = point[fieldConfig.field];
              if (typeof value === 'number' && !isNaN(value)) {
                totalValue += value;
                count++;
              }
            });
          });

          const averageValue = count > 0 ? totalValue / count : 0;

          // If average value > 1000 kg, use tonnes
          setDisplayUnit(averageValue > 1000 ? 'tonnes' : 'kg');
        } else {
          setDisplayUnit('kg');
        }

        setData(finalData);
        setHasNoData(finalData.length === 0);

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
  }, [influxConfig, bucket, measurement, fieldsKey, facilityId, timeRange, defaultAggregation, cumulative]);

  // Generate chart configuration
  const chartConfig: ChartConfig = {};
  fields.forEach((fieldConfig) => {
    chartConfig[fieldConfig.field] = {
      label: fieldConfig.label,
      color: fieldConfig.color,
    };
  });

  // Create dynamic Y-axis label and unit based on display unit
  let dynamicYAxisLabel = yAxisLabel;
  let displayUnitText = yAxisLabel || '';

  if (yAxisLabel && displayUnit === 'tonnes') {
    if (yAxisLabel.includes('kg')) {
      // For CO2: kgCO2-eq → tCO2-eq
      dynamicYAxisLabel = yAxisLabel.replace('kg', 't');
      displayUnitText = dynamicYAxisLabel;
    } else if (yAxisLabel.includes('kWh')) {
      // For Energy: kWh → MWh
      dynamicYAxisLabel = yAxisLabel.replace('kWh', 'MWh');
      displayUnitText = dynamicYAxisLabel;
    }
  }

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
                label={dynamicYAxisLabel ? { value: dynamicYAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
                tickFormatter={(value) => {
                  // Apply additional scaling if using tonnes
                  const displayValue = displayUnit === 'tonnes' ? value / 1000 : value;
                  return formatCompactNumber(displayValue);
                }}
              />
              <ChartTooltip
                content={<ChartTooltipContent
                  labelFormatter={(value) => format(new Date(value), 'PPpp')}
                  formatter={(value) => {
                    const numValue = value as number;
                    const displayValue = displayUnit === 'tonnes' ? numValue / 1000 : numValue;
                    return `${displayValue.toFixed(2)} ${displayUnitText}`;
                  }}
                />}
              />
              <Legend />
              {fields.map((fieldConfig) => (
                <Line
                  key={fieldConfig.field}
                  type="monotone"
                  dataKey={fieldConfig.field}
                  stroke={fieldConfig.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 6,
                  }}
                  name={fieldConfig.label}
                />
              ))}
            </LineChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
