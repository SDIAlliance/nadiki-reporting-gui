'use client';

import * as React from 'react';
import useSWR from 'swr';
import { InfluxDB } from '@influxdata/influxdb-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TimeRangePicker, type TimeRangeValue } from '@/components/TimeRangePicker';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { Line, LineChart, Area, AreaChart, CartesianGrid, XAxis, YAxis, Legend } from 'recharts';
import { format } from 'date-fns';
import type { ServerResponse } from '@/packages/registrar-api-client/types/server-api';
import { FacilityEmbodiedAttributableCard } from '@/components/metrics/FacilityEmbodiedAttributableCard';
import { ServerEmbodiedMetricCard } from '@/components/metrics/ServerEmbodiedMetricCard';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface WorkloadAnalysisProps {
  facilityId: string;
  serverId: string;
  podName: string;
  facility: {
    totalNumberOfServers?: number;
  };
}

export function WorkloadAnalysis({
  facilityId,
  serverId,
  podName,
  facility,
}: WorkloadAnalysisProps) {
  const [timeRange, setTimeRange] = React.useState<TimeRangeValue | undefined>(undefined);
  const [chartData, setChartData] = React.useState<Array<{ time: string; cpu_utilization: number }>>([]);
  const [loadingChart, setLoadingChart] = React.useState(false);
  const [chartError, setChartError] = React.useState<string | null>(null);
  const [averageCPU, setAverageCPU] = React.useState<number | null>(null);
  const [powerData, setPowerData] = React.useState<Array<{ time: string; server_power: number }>>([]);
  const [loadingPower, setLoadingPower] = React.useState(false);
  const [powerError, setPowerError] = React.useState<string | null>(null);
  const [averageServerPower, setAverageServerPower] = React.useState<number | null>(null);
  const [renewableData, setRenewableData] = React.useState<Array<{ time: string; renewable_percentage: number }>>([]);
  const [loadingRenewable, setLoadingRenewable] = React.useState(false);
  const [renewableError, setRenewableError] = React.useState<string | null>(null);
  const [splitPowerData, setSplitPowerData] = React.useState<Array<{ time: string; renewable: number; nonRenewable: number }>>([]);
  const [podSplitPowerData, setPodSplitPowerData] = React.useState<Array<{ time: string; renewable: number; nonRenewable: number }>>([]);

  // Fetch detailed server data
  const { data: serverDetail } = useSWR<ServerResponse>(
    serverId ? `/api/servers/${serverId}` : null,
    fetcher
  );

  // Prepare InfluxDB configuration from server data
  const influxConfig = serverDetail?.timeSeriesConfig ? {
    url: serverDetail.timeSeriesConfig.endpoint,
    token: serverDetail.timeSeriesConfig.token,
    org: serverDetail.timeSeriesConfig.org,
  } : undefined;

  const bucket = serverDetail?.timeSeriesConfig?.bucket;

  // Fetch CPU utilization data when all parameters are selected
  React.useEffect(() => {
    const fetchCPUData = async () => {
      if (!serverDetail?.timeSeriesConfig || !serverId || !podName || !timeRange) {
        setChartData([]);
        return;
      }

      const config = serverDetail.timeSeriesConfig;
      const bucketName = config.bucket;

      try {
        setLoadingChart(true);
        setChartError(null);

        const influx = new InfluxDB({
          url: config.endpoint,
          token: config.token,
        });

        const queryApi = influx.getQueryApi(config.org);

        // Calculate aggregation window based on time range
        const rangeDays = Math.abs((timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24));
        let aggregationWindow = '1h';
        if (rangeDays <= 1) {
          aggregationWindow = '1h';
        } else if (rangeDays <= 7) {
          aggregationWindow = '2h';
        } else if (rangeDays <= 31) {
          aggregationWindow = '6h';
        } else if (rangeDays <= 93) {
          aggregationWindow = '1d';
        } else {
          aggregationWindow = '1mo';
        }

        const query = `
from(bucket: "${bucketName}")
  |> range(start: ${timeRange.start.toISOString()}, stop: ${timeRange.end.toISOString()})
  |> filter(fn: (r) => r["_measurement"] == "server")
  |> filter(fn: (r) => r["_field"] == "cpu_busy_fraction")
  |> filter(fn: (r) => r["server_id"] == "${serverId}")
  |> filter(fn: (r) => r["container_label_io_kubernetes_container_name"] == "${podName}")
  |> aggregateWindow(every: ${aggregationWindow}, fn: mean, createEmpty: false)
  |> group(columns: ["_time"])
  |> sum()
  |> yield(name: "cpu_sum")`;

        const dataPoints: Map<string, number> = new Map();

        await new Promise<void>((resolve, reject) => {
          queryApi.queryRows(query, {
            next(row: string[], tableMeta: { columns: Array<{ label: string }> }) {
              const timeIndex = tableMeta.columns.findIndex((c: { label: string }) => c.label === '_time');
              const valueIndex = tableMeta.columns.findIndex((c: { label: string }) => c.label === '_value');

              if (timeIndex >= 0 && valueIndex >= 0) {
                const timestamp = row[timeIndex];
                const value = parseFloat(row[valueIndex]);

                if (!isNaN(value)) {
                  dataPoints.set(timestamp, value * 100);
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

        const chartDataArray = Array.from(dataPoints.entries())
          .map(([time, cpu_utilization]) => ({
            time,
            cpu_utilization,
          }))
          .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

        setChartData(chartDataArray);

        if (chartDataArray.length > 0) {
          const sum = chartDataArray.reduce((acc, point) => acc + point.cpu_utilization, 0);
          const avg = sum / chartDataArray.length;
          setAverageCPU(avg);
        } else {
          setAverageCPU(null);
        }
      } catch (err) {
        console.error('Error fetching CPU data:', err);
        setChartError(err instanceof Error ? err.message : 'Failed to fetch CPU data');
        setAverageCPU(null);
      } finally {
        setLoadingChart(false);
      }
    };

    fetchCPUData();
  }, [serverDetail, serverId, podName, timeRange]);

  // Fetch server power consumption data
  React.useEffect(() => {
    const fetchPowerData = async () => {
      if (!serverDetail?.timeSeriesConfig || !serverId || !podName || !timeRange) {
        setPowerData([]);
        return;
      }

      const config = serverDetail.timeSeriesConfig;
      const bucketName = config.bucket;

      try {
        setLoadingPower(true);
        setPowerError(null);

        const influx = new InfluxDB({
          url: config.endpoint,
          token: config.token,
        });

        const queryApi = influx.getQueryApi(config.org);

        const rangeDays = Math.abs((timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24));
        let aggregationWindow = '1h';
        if (rangeDays <= 1) {
          aggregationWindow = '1h';
        } else if (rangeDays <= 7) {
          aggregationWindow = '2h';
        } else if (rangeDays <= 31) {
          aggregationWindow = '6h';
        } else if (rangeDays <= 93) {
          aggregationWindow = '1d';
        } else {
          aggregationWindow = '1mo';
        }

        const query = `
from(bucket: "${bucketName}")
  |> range(start: ${timeRange.start.toISOString()}, stop: ${timeRange.end.toISOString()})
  |> filter(fn: (r) => r["_measurement"] == "server")
  |> filter(fn: (r) => r["_field"] == "server_energy_consumption_watts")
  |> filter(fn: (r) => r["server_id"] == "${serverId}")
  |> aggregateWindow(every: ${aggregationWindow}, fn: mean, createEmpty: false)
  |> yield(name: "power")`;

        const dataPoints: Map<string, number> = new Map();

        await new Promise<void>((resolve, reject) => {
          queryApi.queryRows(query, {
            next(row: string[], tableMeta: { columns: Array<{ label: string }> }) {
              const timeIndex = tableMeta.columns.findIndex((c: { label: string }) => c.label === '_time');
              const valueIndex = tableMeta.columns.findIndex((c: { label: string }) => c.label === '_value');

              if (timeIndex >= 0 && valueIndex >= 0) {
                const timestamp = row[timeIndex];
                const value = parseFloat(row[valueIndex]);

                if (!isNaN(value)) {
                  dataPoints.set(timestamp, value);
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

        const powerDataArray = Array.from(dataPoints.entries())
          .map(([time, server_power]) => ({
            time,
            server_power,
          }))
          .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

        setPowerData(powerDataArray);

        if (powerDataArray.length > 0) {
          const sum = powerDataArray.reduce((acc, point) => acc + point.server_power, 0);
          const avg = sum / powerDataArray.length;
          setAverageServerPower(avg);
        } else {
          setAverageServerPower(null);
        }
      } catch (err) {
        console.error('Error fetching power data:', err);
        setPowerError(err instanceof Error ? err.message : 'Failed to fetch power data');
        setAverageServerPower(null);
      } finally {
        setLoadingPower(false);
      }
    };

    fetchPowerData();
  }, [serverDetail, serverId, podName, timeRange]);

  // Fetch renewable percentage data
  React.useEffect(() => {
    const fetchRenewableData = async () => {
      if (!serverDetail?.timeSeriesConfig || !serverId || !podName || !timeRange) {
        setRenewableData([]);
        return;
      }

      const config = serverDetail.timeSeriesConfig;
      const bucketName = config.bucket;

      try {
        setLoadingRenewable(true);
        setRenewableError(null);

        const influx = new InfluxDB({
          url: config.endpoint,
          token: config.token,
        });

        const queryApi = influx.getQueryApi(config.org);

        const rangeDays = Math.abs((timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24));
        let aggregationWindow = '1h';
        if (rangeDays <= 1) {
          aggregationWindow = '1h';
        } else if (rangeDays <= 7) {
          aggregationWindow = '2h';
        } else if (rangeDays <= 31) {
          aggregationWindow = '6h';
        } else if (rangeDays <= 93) {
          aggregationWindow = '1d';
        } else {
          aggregationWindow = '1mo';
        }

        const query = `
from(bucket: "${bucketName}")
  |> range(start: ${timeRange.start.toISOString()}, stop: ${timeRange.end.toISOString()})
  |> filter(fn: (r) => r["_measurement"] == "facility")
  |> filter(fn: (r) => r["_field"] == "grid_renewable_percentage")
  |> filter(fn: (r) => r["facility_id"] == "${facilityId}")
  |> aggregateWindow(every: ${aggregationWindow}, fn: mean, createEmpty: false)
  |> yield(name: "mean")`;

        const dataPoints: Map<string, number> = new Map();

        await new Promise<void>((resolve, reject) => {
          queryApi.queryRows(query, {
            next(row: string[], tableMeta: { columns: Array<{ label: string }> }) {
              const timeIndex = tableMeta.columns.findIndex((c: { label: string }) => c.label === '_time');
              const valueIndex = tableMeta.columns.findIndex((c: { label: string }) => c.label === '_value');

              if (timeIndex >= 0 && valueIndex >= 0) {
                const timestamp = row[timeIndex];
                const value = parseFloat(row[valueIndex]);

                if (!isNaN(value)) {
                  dataPoints.set(timestamp, value);
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

        const renewableDataArray = Array.from(dataPoints.entries())
          .map(([time, renewable_percentage]) => ({
            time,
            renewable_percentage,
          }))
          .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

        setRenewableData(renewableDataArray);
      } catch (err) {
        console.error('Error fetching renewable data:', err);
        setRenewableError(err instanceof Error ? err.message : 'Failed to fetch renewable data');
      } finally {
        setLoadingRenewable(false);
      }
    };

    fetchRenewableData();
  }, [serverDetail, serverId, podName, timeRange, facilityId]);

  // Merge power and renewable data to calculate renewable/non-renewable split
  React.useEffect(() => {
    if (powerData.length === 0 || renewableData.length === 0) {
      setSplitPowerData([]);
      return;
    }

    const renewableMap = new Map<string, number>();
    renewableData.forEach(point => {
      renewableMap.set(point.time, point.renewable_percentage);
    });

    const merged: Map<string, { time: string; renewable: number; nonRenewable: number }> = new Map();

    powerData.forEach(powerPoint => {
      let renewablePercentage = 0;

      if (renewableMap.has(powerPoint.time)) {
        renewablePercentage = renewableMap.get(powerPoint.time)!;
      } else {
        const powerTime = new Date(powerPoint.time).getTime();
        let closestTime = '';
        let minDiff = Infinity;

        renewableData.forEach(r => {
          const diff = Math.abs(new Date(r.time).getTime() - powerTime);
          if (diff < minDiff) {
            minDiff = diff;
            closestTime = r.time;
          }
        });

        if (closestTime && renewableMap.has(closestTime)) {
          renewablePercentage = renewableMap.get(closestTime)!;
        }
      }

      const totalPower = powerPoint.server_power;
      const renewablePower = (totalPower * renewablePercentage) / 100;
      const nonRenewablePower = totalPower - renewablePower;

      merged.set(powerPoint.time, {
        time: powerPoint.time,
        renewable: renewablePower,
        nonRenewable: nonRenewablePower,
      });
    });

    const splitData = Array.from(merged.values())
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    setSplitPowerData(splitData);
  }, [powerData, renewableData]);

  // Calculate pod's attributable power split using CPU utilization
  React.useEffect(() => {
    if (powerData.length === 0 || renewableData.length === 0 || chartData.length === 0) {
      setPodSplitPowerData([]);
      return;
    }

    const renewableMap = new Map<string, number>();
    renewableData.forEach(point => {
      renewableMap.set(point.time, point.renewable_percentage);
    });

    const cpuMap = new Map<string, number>();
    chartData.forEach(point => {
      cpuMap.set(point.time, point.cpu_utilization);
    });

    const merged: Map<string, { time: string; renewable: number; nonRenewable: number }> = new Map();

    chartData.forEach(cpuPoint => {
      const powerPoint = powerData.find(p => p.time === cpuPoint.time);
      if (!powerPoint) return;

      let renewablePercentage = 0;
      if (renewableMap.has(cpuPoint.time)) {
        renewablePercentage = renewableMap.get(cpuPoint.time)!;
      } else {
        const cpuTime = new Date(cpuPoint.time).getTime();
        let closestTime = '';
        let minDiff = Infinity;

        renewableData.forEach(r => {
          const diff = Math.abs(new Date(r.time).getTime() - cpuTime);
          if (diff < minDiff) {
            minDiff = diff;
            closestTime = r.time;
          }
        });

        if (closestTime && renewableMap.has(closestTime)) {
          renewablePercentage = renewableMap.get(closestTime)!;
        }
      }

      const podPower = powerPoint.server_power * (cpuPoint.cpu_utilization / 100);
      const renewablePower = (podPower * renewablePercentage) / 100;
      const nonRenewablePower = podPower - renewablePower;

      merged.set(cpuPoint.time, {
        time: cpuPoint.time,
        renewable: renewablePower,
        nonRenewable: nonRenewablePower,
      });
    });

    const podSplitData = Array.from(merged.values())
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    setPodSplitPowerData(podSplitData);
  }, [powerData, renewableData, chartData]);

  return (
    <div className="space-y-6">
      {/* Time Range Selection */}
      <TimeRangePicker
        title="Time Period"
        description="Select the time range for workload analysis"
        defaultTimeRange="today"
        onChange={setTimeRange}
      />

      {/* CPU Utilization Chart */}
      {timeRange && (
        <Card>
          <CardHeader>
            <CardTitle>CPU Utilization</CardTitle>
            <CardDescription>
              Total CPU utilization for pod {podName} (summed across all CPU cores)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingChart && (
              <div className="flex items-center justify-center h-[350px]">
                <p className="text-muted-foreground">Loading CPU utilization data...</p>
              </div>
            )}

            {chartError && (
              <div className="flex items-center justify-center h-[350px]">
                <p className="text-destructive">Error: {chartError}</p>
              </div>
            )}

            {!loadingChart && !chartError && chartData.length === 0 && (
              <div className="flex items-center justify-center h-[350px]">
                <p className="text-muted-foreground">No data available for the selected time range</p>
              </div>
            )}

            {!loadingChart && !chartError && chartData.length > 0 && (
              <ChartContainer
                config={{
                  cpu_utilization: {
                    label: 'CPU Utilization',
                    color: '#2563eb',
                  },
                } satisfies ChartConfig}
                className="h-[350px] w-full"
              >
                <LineChart
                  data={chartData}
                  margin={{
                    top: 15,
                    right: 15,
                    left: 15,
                    bottom: 15,
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
                      const rangeDays = Math.abs((timeRange!.end.getTime() - timeRange!.start.getTime()) / (1000 * 60 * 60 * 24));
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
                    label={{ value: 'CPU %', angle: -90, position: 'insideLeft', textAnchor: 'middle' }}
                    tickFormatter={(value) => `${value.toFixed(3)}%`}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => format(new Date(value), 'PPpp')}
                        formatter={(value) => `${Number(value).toFixed(4)}%`}
                      />
                    }
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="cpu_utilization"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{
                      r: 6,
                    }}
                    name="CPU Utilization"
                  />
                </LineChart>
              </ChartContainer>
            )}

            {!loadingChart && !chartError && averageCPU !== null && (
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Average CPU Utilization</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Mean value over the selected time period
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary">
                      {averageCPU.toFixed(4)}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {chartData.length} data point(s)
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Server Power Consumption Chart */}
      {timeRange && (
        <Card>
          <CardHeader>
            <CardTitle>Server Power Consumption</CardTitle>
            <CardDescription>
              Total server power consumption over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingPower && (
              <div className="flex items-center justify-center h-[350px]">
                <p className="text-muted-foreground">Loading power consumption data...</p>
              </div>
            )}

            {powerError && (
              <div className="flex items-center justify-center h-[350px]">
                <p className="text-destructive">Error: {powerError}</p>
              </div>
            )}

            {!loadingPower && !powerError && powerData.length === 0 && (
              <div className="flex items-center justify-center h-[350px]">
                <p className="text-muted-foreground">No data available for the selected time range</p>
              </div>
            )}

            {!loadingPower && !powerError && powerData.length > 0 && (
              <ChartContainer
                config={{
                  server_power: {
                    label: 'Server Power',
                    color: '#dc2626',
                  },
                } satisfies ChartConfig}
                className="h-[350px] w-full"
              >
                <LineChart
                  data={powerData}
                  margin={{
                    top: 15,
                    right: 15,
                    left: 15,
                    bottom: 15,
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
                      const rangeDays = Math.abs((timeRange!.end.getTime() - timeRange!.start.getTime()) / (1000 * 60 * 60 * 24));
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
                    label={{ value: 'Watts', angle: -90, position: 'insideLeft', textAnchor: 'middle' }}
                    tickFormatter={(value) => `${value.toFixed(1)}W`}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => format(new Date(value), 'PPpp')}
                        formatter={(value) => `${Number(value).toFixed(2)}W`}
                      />
                    }
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="server_power"
                    stroke="#dc2626"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{
                      r: 6,
                    }}
                    name="Server Power"
                  />
                </LineChart>
              </ChartContainer>
            )}

            {!loadingPower && !powerError && averageServerPower !== null && averageCPU !== null && timeRange && (
              <div className="mt-6 pt-6 border-t space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Average Server Power for Pod</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Server power × CPU utilization ({averageServerPower.toFixed(2)}W × {averageCPU.toFixed(4)}%)
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary">
                      {((averageServerPower * averageCPU) / 100).toFixed(4)}W
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Average power attributed to pod
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Total Energy Consumption for Pod</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Power × Duration ({((averageServerPower * averageCPU) / 100).toFixed(4)}W × {((timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60)).toFixed(2)}h)
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary">
                      {(((averageServerPower * averageCPU) / 100) * ((timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60))).toFixed(4)}Wh
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Energy consumed over time period
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Grid Renewable Percentage Chart */}
      {timeRange && (
        <Card>
          <CardHeader>
            <CardTitle>Grid Renewable Percentage</CardTitle>
            <CardDescription>
              Percentage of renewable energy in the grid over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingRenewable && (
              <div className="flex items-center justify-center h-[350px]">
                <p className="text-muted-foreground">Loading renewable percentage data...</p>
              </div>
            )}

            {renewableError && (
              <div className="flex items-center justify-center h-[350px]">
                <p className="text-destructive">Error: {renewableError}</p>
              </div>
            )}

            {!loadingRenewable && !renewableError && renewableData.length === 0 && (
              <div className="flex items-center justify-center h-[350px]">
                <p className="text-muted-foreground">No data available for the selected time range</p>
              </div>
            )}

            {!loadingRenewable && !renewableError && renewableData.length > 0 && (
              <ChartContainer
                config={{
                  renewable_percentage: {
                    label: 'Renewable %',
                    color: '#16a34a',
                  },
                } satisfies ChartConfig}
                className="h-[350px] w-full"
              >
                <LineChart
                  data={renewableData}
                  margin={{
                    top: 15,
                    right: 15,
                    left: 15,
                    bottom: 15,
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
                      const rangeDays = Math.abs((timeRange!.end.getTime() - timeRange!.start.getTime()) / (1000 * 60 * 60 * 24));
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
                    label={{ value: 'Renewable %', angle: -90, position: 'insideLeft', textAnchor: 'middle' }}
                    tickFormatter={(value) => `${value.toFixed(1)}%`}
                    domain={[0, 100]}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => format(new Date(value), 'PPpp')}
                        formatter={(value) => `${Number(value).toFixed(2)}%`}
                      />
                    }
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="renewable_percentage"
                    stroke="#16a34a"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{
                      r: 6,
                    }}
                    name="Renewable %"
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Server Power Split (Renewable/Non-Renewable) */}
      {timeRange && splitPowerData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Server Power Breakdown</CardTitle>
            <CardDescription>
              Server power consumption split by renewable and non-renewable sources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                renewable: {
                  label: 'Renewable',
                  color: '#16a34a',
                },
                nonRenewable: {
                  label: 'Non-Renewable',
                  color: '#dc2626',
                },
              } satisfies ChartConfig}
              className="h-[350px] w-full"
            >
              <AreaChart
                data={splitPowerData}
                margin={{
                  top: 15,
                  right: 15,
                  left: 15,
                  bottom: 15,
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
                    const rangeDays = Math.abs((timeRange!.end.getTime() - timeRange!.start.getTime()) / (1000 * 60 * 60 * 24));
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
                  label={{ value: 'Watts', angle: -90, position: 'insideLeft', textAnchor: 'middle' }}
                  tickFormatter={(value) => `${value.toFixed(1)}W`}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => format(new Date(value), 'PPpp')}
                      formatter={(value) => `${Number(value).toFixed(2)}W`}
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
      )}

      {/* Pod Attributable Power Split (Renewable/Non-Renewable) */}
      {timeRange && podSplitPowerData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pod Attributable Power Breakdown</CardTitle>
            <CardDescription>
              Power consumption attributed to pod {podName}, split by renewable and non-renewable sources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                renewable: {
                  label: 'Renewable',
                  color: '#16a34a',
                },
                nonRenewable: {
                  label: 'Non-Renewable',
                  color: '#dc2626',
                },
              } satisfies ChartConfig}
              className="h-[350px] w-full"
            >
              <AreaChart
                data={podSplitPowerData}
                margin={{
                  top: 15,
                  right: 15,
                  left: 15,
                  bottom: 15,
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
                    const rangeDays = Math.abs((timeRange!.end.getTime() - timeRange!.start.getTime()) / (1000 * 60 * 60 * 24));
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
                  label={{ value: 'Watts', angle: -90, position: 'insideLeft', textAnchor: 'middle' }}
                  tickFormatter={(value) => `${value.toFixed(4)}W`}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => format(new Date(value), 'PPpp')}
                      formatter={(value) => `${Number(value).toFixed(6)}W`}
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

            {timeRange && (
              <div className="mt-6 pt-6 border-t space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Total Renewable Energy Consumption</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sum of renewable power over time period ({((timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60)).toFixed(2)}h)
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-600">
                      {(() => {
                        const avgRenewable = podSplitPowerData.reduce((sum, p) => sum + p.renewable, 0) / podSplitPowerData.length;
                        const totalHours = (timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60);
                        return (avgRenewable * totalHours).toFixed(6);
                      })()}Wh
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Renewable energy consumed
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Total Non-Renewable Energy Consumption</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sum of non-renewable power over time period ({((timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60)).toFixed(2)}h)
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-red-600">
                      {(() => {
                        const avgNonRenewable = podSplitPowerData.reduce((sum, p) => sum + p.nonRenewable, 0) / podSplitPowerData.length;
                        const totalHours = (timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60);
                        return (avgNonRenewable * totalHours).toFixed(6);
                      })()}Wh
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Non-renewable energy consumed
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Facility Embodied Impacts Attributable */}
      {timeRange && facility && (
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Facility Embodied Impacts Attributable</h2>
            <p className="text-muted-foreground">
              Total facility embodied impacts divided by {facility.totalNumberOfServers || 1} server{(facility.totalNumberOfServers || 0) !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <FacilityEmbodiedAttributableCard
              metric="climate_change"
              facilityId={facilityId}
              totalNumberOfServers={facility.totalNumberOfServers || 0}
              influxConfig={{
                url: process.env.NEXT_PUBLIC_INFLUX_URL || '',
                token: process.env.NEXT_PUBLIC_INFLUX_TOKEN || '',
                org: process.env.NEXT_PUBLIC_INFLUX_ORG || '',
              }}
              bucket={process.env.NEXT_PUBLIC_INFLUX_IMPACT_BUCKET || 'facility-impact'}
              timeRange={timeRange}
            />
            {/* Add other facility embodied impact cards as needed */}
          </div>
        </div>
      )}

      {/* Server Embodied Impacts */}
      {timeRange && serverId && influxConfig && bucket && averageCPU !== null && (
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Server Embodied Impacts Attributable</h2>
            <p className="text-muted-foreground">
              Server embodied impacts multiplied by average CPU utilization ({averageCPU.toFixed(4)}%)
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <ServerEmbodiedMetricCard
              metric="climate_change"
              serverId={serverId}
              influxConfig={influxConfig}
              bucket={process.env.NEXT_PUBLIC_INFLUX_IMPACT_BUCKET || 'server-impact'}
              timeRange={timeRange}
              cpuUtilizationMultiplier={averageCPU}
            />
            {/* Add other server embodied impact cards as needed */}
          </div>
        </div>
      )}
    </div>
  );
}
