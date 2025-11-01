'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { format } from 'date-fns';
import { InfluxDB } from '@influxdata/influxdb-client';

interface EnergyOverviewAreaChartProps {
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

interface DataPoint {
  time: string;
  nonRenewable: number;
  renewable: number;
}

// Determine aggregation window based on time range
function getAggregationWindow(timeRange?: { start: Date; end: Date }): string {
  if (!timeRange) {
    return '1h';
  }

  const rangeDays = Math.abs((timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24));

  if (rangeDays <= 1) {
    return '30m';
  } else if (rangeDays <= 7) {
    return '1h';
  } else if (rangeDays < 30) {
    return '6h';
  } else {
    return '1d';
  }
}

// Format numbers with K/M/B suffixes
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

const chartConfig = {
  nonRenewable: {
    label: 'Non-Renewable (incl. Generators)',
    color: '#dc2626', // red-600
  },
  renewable: {
    label: 'Renewable (incl. Onsite)',
    color: '#16a34a', // green-600
  },
} satisfies ChartConfig;

export function EnergyOverviewAreaChart({
  facilityId,
  influxConfig,
  bucket,
  timeRange,
}: EnergyOverviewAreaChartProps) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!influxConfig) {
          setData([]);
          setLoading(false);
          return;
        }

        const influx = new InfluxDB({
          url: influxConfig.url,
          token: influxConfig.token,
        });

        const queryApi = influx.getQueryApi(influxConfig.org);
        const aggregationWindow = getAggregationWindow(timeRange);

        // Fetch non-renewable energy data
        const nonRenewableQuery = `from(bucket: "${bucket}")
  |> range(start: ${timeRange ? timeRange.start.toISOString() : '-30d'}, stop: ${timeRange ? timeRange.end.toISOString() : 'now()'})
  |> filter(fn: (r) => r._measurement == "non_renewable_energy_use_incl_generators_kwh")
  |> filter(fn: (r) => r._field == "_value")
  |> filter(fn: (r) => r.facility_id == "${facilityId}")
  |> aggregateWindow(every: ${aggregationWindow}, fn: sum, createEmpty: false)
  |> keep(columns: ["_time", "_value"])
  |> yield(name: "result")`;

        // Fetch renewable energy data
        const renewableQuery = `from(bucket: "${bucket}")
  |> range(start: ${timeRange ? timeRange.start.toISOString() : '-30d'}, stop: ${timeRange ? timeRange.end.toISOString() : 'now()'})
  |> filter(fn: (r) => r._measurement == "renewable_energy_use_incl_onsite_kwh")
  |> filter(fn: (r) => r._field == "_value")
  |> filter(fn: (r) => r.facility_id == "${facilityId}")
  |> aggregateWindow(every: ${aggregationWindow}, fn: sum, createEmpty: false)
  |> keep(columns: ["_time", "_value"])
  |> yield(name: "result")`;

        console.log('Non-Renewable Query:', nonRenewableQuery);
        console.log('Renewable Query:', renewableQuery);

        // Fetch both datasets
        const nonRenewableData: { time: string; value: number }[] = [];
        const renewableData: { time: string; value: number }[] = [];

        await new Promise<void>((resolve, reject) => {
          queryApi.queryRows(nonRenewableQuery, {
            next(row: string[], tableMeta: { columns: Array<{ label: string }> }) {
              const timeIndex = tableMeta.columns.findIndex((c) => c.label === '_time');
              const valueIndex = tableMeta.columns.findIndex((c) => c.label === '_value');

              if (timeIndex >= 0 && valueIndex >= 0) {
                nonRenewableData.push({
                  time: row[timeIndex],
                  value: parseFloat(row[valueIndex]),
                });
              }
            },
            error(error: Error) {
              console.error('Non-renewable query error:', error);
              reject(error);
            },
            complete() {
              resolve();
            },
          });
        });

        await new Promise<void>((resolve, reject) => {
          queryApi.queryRows(renewableQuery, {
            next(row: string[], tableMeta: { columns: Array<{ label: string }> }) {
              const timeIndex = tableMeta.columns.findIndex((c) => c.label === '_time');
              const valueIndex = tableMeta.columns.findIndex((c) => c.label === '_value');

              if (timeIndex >= 0 && valueIndex >= 0) {
                renewableData.push({
                  time: row[timeIndex],
                  value: parseFloat(row[valueIndex]),
                });
              }
            },
            error(error: Error) {
              console.error('Renewable query error:', error);
              reject(error);
            },
            complete() {
              resolve();
            },
          });
        });

        // Merge datasets by timestamp
        const mergedData: Map<string, DataPoint> = new Map();

        nonRenewableData.forEach((point) => {
          mergedData.set(point.time, {
            time: point.time,
            nonRenewable: point.value,
            renewable: 0,
          });
        });

        renewableData.forEach((point) => {
          const existing = mergedData.get(point.time);
          if (existing) {
            existing.renewable = point.value;
          } else {
            mergedData.set(point.time, {
              time: point.time,
              nonRenewable: 0,
              renewable: point.value,
            });
          }
        });

        const finalData = Array.from(mergedData.values());
        finalData.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

        setData(finalData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [influxConfig, bucket, facilityId, timeRange]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Energy Overview</CardTitle>
          <CardDescription>Renewable and non-renewable energy consumption</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[250px]">
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
          <CardTitle>Energy Overview</CardTitle>
          <CardDescription>Renewable and non-renewable energy consumption</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[250px]">
            <div className="text-destructive">Error: {error}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Energy Overview</CardTitle>
          <CardDescription>Renewable and non-renewable energy consumption</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[250px]">
            <div className="text-muted-foreground">No data available</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Energy Overview</CardTitle>
        <CardDescription>Renewable and non-renewable energy consumption over time</CardDescription>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart
            data={data}
            margin={{
              top: 10,
              right: 10,
              left: 10,
              bottom: 0,
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
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
              tickFormatter={formatCompactNumber}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => format(new Date(value), 'PPpp')}
                  formatter={(value) => `${(value as number).toFixed(2)} kWh`}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="renewable"
              stackId="1"
              stroke="var(--color-renewable)"
              fill="var(--color-renewable)"
            />
            <Area
              type="monotone"
              dataKey="nonRenewable"
              stackId="1"
              stroke="var(--color-nonRenewable)"
              fill="var(--color-nonRenewable)"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
