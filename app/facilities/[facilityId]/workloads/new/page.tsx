'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { Check, ChevronsUpDown, Server } from 'lucide-react';
import useSWR from 'swr';
import { InfluxDB } from '@influxdata/influxdb-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useServers } from '@/lib/hooks/use-servers';
import { TimeRangePicker, type TimeRangeValue } from '@/components/TimeRangePicker';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { Line, LineChart, Area, AreaChart, CartesianGrid, XAxis, YAxis, Legend } from 'recharts';
import { format } from 'date-fns';
import type { ServerResponse } from '@/packages/registrar-api-client/types/server-api';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function NewWorkloadPage() {
  const params = useParams();
  const facilityId = params.facilityId as string;

  const [open, setOpen] = React.useState(false);
  const [selectedServerId, setSelectedServerId] = React.useState<string>('');
  const [containerNames, setContainerNames] = React.useState<string[]>([]);
  const [loadingContainers, setLoadingContainers] = React.useState(false);
  const [containerError, setContainerError] = React.useState<string | null>(null);
  const [podOpen, setPodOpen] = React.useState(false);
  const [selectedPodName, setSelectedPodName] = React.useState<string>('');
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

  // Fetch servers for this facility
  const { servers, isLoading, isError } = useServers({ facilityId });

  // Fetch detailed server data when a server is selected
  const { data: serverDetail } = useSWR<ServerResponse>(
    selectedServerId ? `/api/servers/${selectedServerId}` : null,
    fetcher
  );

  // Prepare InfluxDB configuration from server data
  const influxConfig = serverDetail?.timeSeriesConfig ? {
    url: serverDetail.timeSeriesConfig.endpoint,
    token: serverDetail.timeSeriesConfig.token,
    org: serverDetail.timeSeriesConfig.org,
  } : undefined;

  const bucket = serverDetail?.timeSeriesConfig?.bucket;

  const selectedServer = servers.find((server) => server.id === selectedServerId);

  // Fetch container names from InfluxDB when server is selected and InfluxDB is configured
  React.useEffect(() => {
    const fetchContainerNames = async () => {
      if (!serverDetail?.timeSeriesConfig || !selectedServerId) {
        setContainerNames([]);
        return;
      }

      const config = serverDetail.timeSeriesConfig;
      const bucketName = config.bucket;

      try {
        setLoadingContainers(true);
        setContainerError(null);

        const influx = new InfluxDB({
          url: config.endpoint,
          token: config.token,
        });

        const queryApi = influx.getQueryApi(config.org);

        // Query to get unique values for container_label_io_kubernetes_container_name tag
        const query = `
import "influxdata/influxdb/schema"

schema.tagValues(
  bucket: "${bucketName}",
  tag: "container_label_io_kubernetes_container_name",
  predicate: (r) => r._measurement == "server" and r._field == "cpu_busy_fraction" and r.server_id == "${selectedServerId}",
  start: -30d
)`;

        console.log('InfluxDB Query for container names:', query);

        const names: string[] = [];

        await new Promise<void>((resolve, reject) => {
          queryApi.queryRows(query, {
            next(row: string[], tableMeta: { columns: Array<{ label: string }> }) {
              const valueIndex = tableMeta.columns.findIndex((c: { label: string }) => c.label === '_value');
              if (valueIndex >= 0 && row[valueIndex]) {
                names.push(row[valueIndex]);
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

        setContainerNames(names.sort());
        console.log('Found container names:', names);
      } catch (err) {
        console.error('Error fetching container names:', err);
        setContainerError(err instanceof Error ? err.message : 'Failed to fetch container names');
      } finally {
        setLoadingContainers(false);
      }
    };

    fetchContainerNames();
  }, [serverDetail, selectedServerId]);

  // Fetch CPU utilization data when all parameters are selected
  React.useEffect(() => {
    const fetchCPUData = async () => {
      if (!serverDetail?.timeSeriesConfig || !selectedServerId || !selectedPodName || !timeRange) {
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
          aggregationWindow = '1h'; // Hourly for today
        } else if (rangeDays <= 7) {
          aggregationWindow = '2h'; // 2 hours for this week
        } else if (rangeDays <= 31) {
          aggregationWindow = '6h'; // 6 hours for this month
        } else if (rangeDays <= 93) {
          aggregationWindow = '1d'; // Daily for ~3 months
        } else {
          aggregationWindow = '1mo'; // Monthly for this year
        }

        // Query to get CPU utilization, summing across all CPU cores
        const query = `
from(bucket: "${bucketName}")
  |> range(start: ${timeRange.start.toISOString()}, stop: ${timeRange.end.toISOString()})
  |> filter(fn: (r) => r["_measurement"] == "server")
  |> filter(fn: (r) => r["_field"] == "cpu_busy_fraction")
  |> filter(fn: (r) => r["server_id"] == "${selectedServerId}")
  |> filter(fn: (r) => r["container_label_io_kubernetes_container_name"] == "${selectedPodName}")
  |> aggregateWindow(every: ${aggregationWindow}, fn: mean, createEmpty: false)
  |> group(columns: ["_time"])
  |> sum()
  |> yield(name: "cpu_sum")`;

        console.log('InfluxDB Query for CPU data:', query);

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
                  // Convert to percentage
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

        // Convert map to array and sort by time
        const chartDataArray = Array.from(dataPoints.entries())
          .map(([time, cpu_utilization]) => ({
            time,
            cpu_utilization,
          }))
          .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

        setChartData(chartDataArray);
        console.log('Chart data points:', chartDataArray.length);

        // Calculate average CPU utilization
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
  }, [serverDetail, selectedServerId, selectedPodName, timeRange]);

  // Fetch server power consumption data when all parameters are selected
  React.useEffect(() => {
    const fetchPowerData = async () => {
      if (!serverDetail?.timeSeriesConfig || !selectedServerId || !selectedPodName || !timeRange) {
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

        // Calculate aggregation window based on time range
        const rangeDays = Math.abs((timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24));
        let aggregationWindow = '1h';
        if (rangeDays <= 1) {
          aggregationWindow = '1h'; // Hourly for today
        } else if (rangeDays <= 7) {
          aggregationWindow = '2h'; // 2 hours for this week
        } else if (rangeDays <= 31) {
          aggregationWindow = '6h'; // 6 hours for this month
        } else if (rangeDays <= 93) {
          aggregationWindow = '1d'; // Daily for ~3 months
        } else {
          aggregationWindow = '1mo'; // Monthly for this year
        }

        // Query to get server energy consumption in watts
        const query = `
from(bucket: "${bucketName}")
  |> range(start: ${timeRange.start.toISOString()}, stop: ${timeRange.end.toISOString()})
  |> filter(fn: (r) => r["_measurement"] == "server")
  |> filter(fn: (r) => r["_field"] == "server_energy_consumption_watts")
  |> filter(fn: (r) => r["server_id"] == "${selectedServerId}")
  |> aggregateWindow(every: ${aggregationWindow}, fn: mean, createEmpty: false)
  |> yield(name: "power")`;

        console.log('InfluxDB Query for power data:', query);

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

        // Convert map to array and sort by time
        const powerDataArray = Array.from(dataPoints.entries())
          .map(([time, server_power]) => ({
            time,
            server_power,
          }))
          .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

        setPowerData(powerDataArray);
        console.log('Power data points:', powerDataArray.length);

        // Calculate average server power
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
  }, [serverDetail, selectedServerId, selectedPodName, timeRange]);

  // Fetch renewable percentage data when all parameters are selected
  React.useEffect(() => {
    const fetchRenewableData = async () => {
      if (!serverDetail?.timeSeriesConfig || !selectedServerId || !selectedPodName || !timeRange) {
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

        // Calculate aggregation window based on time range
        const rangeDays = Math.abs((timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24));
        let aggregationWindow = '1h';
        if (rangeDays <= 1) {
          aggregationWindow = '1h'; // Hourly for today
        } else if (rangeDays <= 7) {
          aggregationWindow = '2h'; // 2 hours for this week
        } else if (rangeDays <= 31) {
          aggregationWindow = '6h'; // 6 hours for this month
        } else if (rangeDays <= 93) {
          aggregationWindow = '1d'; // Daily for ~3 months
        } else {
          aggregationWindow = '1mo'; // Monthly for this year
        }

        // Query to get grid renewable percentage
        const query = `
from(bucket: "${bucketName}")
  |> range(start: ${timeRange.start.toISOString()}, stop: ${timeRange.end.toISOString()})
  |> filter(fn: (r) => r["_measurement"] == "facility")
  |> filter(fn: (r) => r["_field"] == "grid_renewable_percentage")
  |> filter(fn: (r) => r["facility_id"] == "${facilityId}")
  |> aggregateWindow(every: ${aggregationWindow}, fn: mean, createEmpty: false)
  |> yield(name: "mean")`;

        console.log('InfluxDB Query for renewable data:', query);

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
                  // Value already comes as percentage (e.g., 55 means 55%)
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

        // Convert map to array and sort by time
        const renewableDataArray = Array.from(dataPoints.entries())
          .map(([time, renewable_percentage]) => ({
            time,
            renewable_percentage,
          }))
          .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

        setRenewableData(renewableDataArray);
        console.log('Renewable data points:', renewableDataArray.length);
      } catch (err) {
        console.error('Error fetching renewable data:', err);
        setRenewableError(err instanceof Error ? err.message : 'Failed to fetch renewable data');
      } finally {
        setLoadingRenewable(false);
      }
    };

    fetchRenewableData();
  }, [serverDetail, selectedServerId, selectedPodName, timeRange, facilityId]);

  // Merge power and renewable data to calculate renewable/non-renewable split
  React.useEffect(() => {
    if (powerData.length === 0 || renewableData.length === 0) {
      setSplitPowerData([]);
      return;
    }

    // Create maps for easy lookup
    const renewableMap = new Map<string, number>();
    renewableData.forEach(point => {
      renewableMap.set(point.time, point.renewable_percentage);
    });

    // Merge data by timestamp
    const merged: Map<string, { time: string; renewable: number; nonRenewable: number }> = new Map();

    powerData.forEach(powerPoint => {
      // Find closest renewable percentage by time
      let renewablePercentage = 0;

      // Try exact match first
      if (renewableMap.has(powerPoint.time)) {
        renewablePercentage = renewableMap.get(powerPoint.time)!;
      } else {
        // Find closest time point in renewable data
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
    console.log('Split power data points:', splitData.length);
  }, [powerData, renewableData]);

  // Calculate pod's attributable power split using CPU utilization for each time point
  React.useEffect(() => {
    if (powerData.length === 0 || renewableData.length === 0 || chartData.length === 0) {
      setPodSplitPowerData([]);
      return;
    }

    // Create maps for easy lookup
    const renewableMap = new Map<string, number>();
    renewableData.forEach(point => {
      renewableMap.set(point.time, point.renewable_percentage);
    });

    const cpuMap = new Map<string, number>();
    chartData.forEach(point => {
      cpuMap.set(point.time, point.cpu_utilization);
    });

    // Merge data by timestamp from CPU data (since that's pod-specific)
    const merged: Map<string, { time: string; renewable: number; nonRenewable: number }> = new Map();

    chartData.forEach(cpuPoint => {
      // Find matching power data point
      const powerPoint = powerData.find(p => p.time === cpuPoint.time);
      if (!powerPoint) return;

      // Find renewable percentage
      let renewablePercentage = 0;
      if (renewableMap.has(cpuPoint.time)) {
        renewablePercentage = renewableMap.get(cpuPoint.time)!;
      } else {
        // Find closest time point
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

      // Calculate pod's attributable power: server_power × (cpu_utilization / 100)
      const podPower = powerPoint.server_power * (cpuPoint.cpu_utilization / 100);

      // Split into renewable and non-renewable
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
    console.log('Pod split power data points:', podSplitData.length);
  }, [powerData, renewableData, chartData]);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">New Workload</h1>
        <p className="text-muted-foreground">Create a new workload configuration for {facilityId}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Server Selection</CardTitle>
          <CardDescription>Select the server for this workload configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
              >
                {selectedServer ? (
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    <span>{selectedServer.id}</span>
                  </div>
                ) : (
                  "Select server..."
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0">
              <Command>
                <CommandInput placeholder="Search servers..." />
                <CommandList>
                  <CommandEmpty>
                    {isLoading ? 'Loading servers...' : 'No servers found.'}
                  </CommandEmpty>
                  <CommandGroup>
                    {servers.map((server) => (
                      <CommandItem
                        key={server.id}
                        value={server.id}
                        onSelect={(currentValue) => {
                          setSelectedServerId(currentValue === selectedServerId ? '' : currentValue);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedServerId === server.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <Server className="mr-2 h-4 w-4" />
                        <div className="flex flex-col">
                          <span>{server.id}</span>
                          {server.rack_id && (
                            <span className="text-xs text-muted-foreground">
                              Rack: {server.rack_id}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {isError && (
            <p className="text-sm text-destructive mt-2">Failed to load servers</p>
          )}

          {selectedServer && (
            <div className="mt-4 p-4 border rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">Selected Server Details</h4>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Server ID:</dt>
                  <dd className="font-medium">{selectedServer.id}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Rack ID:</dt>
                  <dd className="font-medium">{selectedServer.rack_id || 'N/A'}</dd>
                </div>
                {selectedServer.rated_power && (
                  <div>
                    <dt className="text-muted-foreground">Rated Power:</dt>
                    <dd className="font-medium">{selectedServer.rated_power} kW</dd>
                  </div>
                )}
                {selectedServer.cooling_type && (
                  <div>
                    <dt className="text-muted-foreground">Cooling Type:</dt>
                    <dd className="font-medium">{selectedServer.cooling_type}</dd>
                  </div>
                )}
              </dl>

              {/* InfluxDB Configuration Status */}
              {serverDetail && (
                <div className="mt-4 pt-4 border-t">
                  <h5 className="font-medium mb-2 text-sm">InfluxDB Configuration</h5>
                  {influxConfig && bucket ? (
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2 text-green-600">
                        <Check className="h-4 w-4" />
                        <span>Time-series data available</span>
                      </div>
                      <dl className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <dt className="text-muted-foreground">Endpoint:</dt>
                          <dd className="font-mono text-xs">{influxConfig.url}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Organization:</dt>
                          <dd className="font-mono text-xs">{influxConfig.org}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Bucket:</dt>
                          <dd className="font-mono text-xs">{bucket}</dd>
                        </div>
                      </dl>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No time-series configuration available for this server
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pod Selection Card */}
      {selectedServerId && influxConfig && bucket && (
        <Card>
          <CardHeader>
            <CardTitle>Pod Selection</CardTitle>
            <CardDescription>
              Select a pod/container from the available workloads on this server
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Popover open={podOpen} onOpenChange={setPodOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={podOpen}
                  className="w-full justify-between"
                  disabled={loadingContainers}
                >
                  {loadingContainers ? (
                    "Loading pods..."
                  ) : selectedPodName ? (
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="font-mono text-sm">{selectedPodName}</span>
                    </div>
                  ) : containerNames.length > 0 ? (
                    "Select pod..."
                  ) : (
                    "No pods available"
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[500px] p-0">
                <Command>
                  <CommandInput placeholder="Search pods..." />
                  <CommandList>
                    <CommandEmpty>
                      {containerError ? `Error: ${containerError}` : 'No pods found.'}
                    </CommandEmpty>
                    <CommandGroup>
                      {containerNames.map((name) => (
                        <CommandItem
                          key={name}
                          value={name}
                          onSelect={(currentValue) => {
                            setSelectedPodName(currentValue === selectedPodName ? '' : currentValue);
                            setPodOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedPodName === name ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                          <span className="font-mono text-sm">{name}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {containerError && (
              <p className="text-sm text-destructive mt-2">
                Failed to load pods: {containerError}
              </p>
            )}

            {!loadingContainers && !containerError && containerNames.length > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                {containerNames.length} pod(s) available
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Time Range Selection */}
      {selectedPodName && (
        <TimeRangePicker
          title="Time Period"
          description="Select the time range for workload analysis"
          defaultTimeRange="today"
          onChange={setTimeRange}
        />
      )}

      {/* CPU Utilization Chart */}
      {selectedPodName && timeRange && (
        <Card>
          <CardHeader>
            <CardTitle>CPU Utilization</CardTitle>
            <CardDescription>
              Total CPU utilization for pod {selectedPodName} (summed across all CPU cores)
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

            {/* Average CPU Utilization */}
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
      {selectedPodName && timeRange && (
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

            {/* Average Server Power for Pod */}
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
      {selectedPodName && timeRange && (
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
      {selectedPodName && timeRange && splitPowerData.length > 0 && (
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
      {selectedPodName && timeRange && podSplitPowerData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pod Attributable Power Breakdown</CardTitle>
            <CardDescription>
              Power consumption attributed to pod {selectedPodName}, split by renewable and non-renewable sources
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

            {/* Total Energy Consumption by Source */}
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
    </div>
  );
}
