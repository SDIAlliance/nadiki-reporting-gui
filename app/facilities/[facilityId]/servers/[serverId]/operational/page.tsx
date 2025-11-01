'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TimeRangePicker, type TimeRangeValue } from '@/components/TimeRangePicker';
import { ServerMetricChart } from '@/components/charts/ServerMetricChart';
import { ServerMetricStackedAreaChart } from '@/components/charts/ServerMetricStackedAreaChart';
import type { ServerResponse } from '@/packages/registrar-api-client/types/server-api';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ServerOperationalPage() {
  const params = useParams();
  const facilityId = params.facilityId as string;
  const serverId = params.serverId as string;

  const [dateRange, setDateRange] = useState<TimeRangeValue | undefined>(undefined);

  // Fetch server data to get InfluxDB configuration
  const { data: server, error, isLoading } = useSWR<ServerResponse>(
    `/api/servers/${serverId}`,
    fetcher
  );

  // Prepare InfluxDB configuration from server data
  const influxConfig = server?.timeSeriesConfig ? {
    url: server.timeSeriesConfig.endpoint,
    token: server.timeSeriesConfig.token,
    org: server.timeSeriesConfig.org,
  } : undefined;

  const bucket = server?.timeSeriesConfig?.bucket || 'server-metrics';

  if (error) {
    return (
      <div className="p-8">
        <div className="text-destructive">Error loading server data</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-muted-foreground">Loading server data...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-6">
        {/* Time Range Selection */}
        <TimeRangePicker
          title="Time Period"
          description="Select the time range for operational analysis"
          defaultTimeRange="month"
          onChange={setDateRange}
        />

        {/* Tabs for organizing metrics */}
        <Tabs defaultValue="energy" className="w-full">
          <TabsList>
            <TabsTrigger value="energy">Energy Consumption</TabsTrigger>
            <TabsTrigger value="fans">Fans</TabsTrigger>
            <TabsTrigger value="io">I/O</TabsTrigger>
            <TabsTrigger value="network">Network</TabsTrigger>
            <TabsTrigger value="cpu">CPU Utilization</TabsTrigger>
          </TabsList>

          {/* Energy Consumption Tab */}
          <TabsContent value="energy" className="space-y-4">
            {/* Stacked Area Chart - Full Width */}
            <ServerMetricStackedAreaChart
              title="Energy Consumption Overview"
              description="Stacked view of power consumption across all server components"
              serverId={serverId}
              influxConfig={influxConfig}
              bucket={bucket}
              fields={[
                {
                  field: 'cpu_energy_consumption_watts',
                  label: 'CPU Energy',
                  color: '#2563eb',
                },
                {
                  field: 'dram_energy_consumption_watts',
                  label: 'DRAM Energy',
                  color: '#16a34a',
                },
                {
                  field: 'gpu_energy_consumption_watts',
                  label: 'GPU Energy',
                  color: '#ca8a04',
                },
                {
                  field: 'server_energy_consumption_watts',
                  label: 'Server Total Energy',
                  color: '#dc2626',
                },
              ]}
              aggregation="mean"
              timeRange={dateRange}
              yAxisLabel="Watts"
              formatValue={(value) => `${value.toFixed(1)}W`}
            />

            {/* Individual Line Charts - Two Column Layout */}
            <div className="grid gap-4 md:grid-cols-2">
              <ServerMetricChart
                title="CPU Energy Consumption"
                description="Power consumed by CPU"
                serverId={serverId}
                influxConfig={influxConfig}
                bucket={bucket}
                fields={['cpu_energy_consumption_watts']}
                aggregation="mean"
                timeRange={dateRange}
                yAxisLabel="Watts"
                formatValue={(value) => `${value.toFixed(1)}W`}
                height={300}
              />

              <ServerMetricChart
                title="DRAM Energy Consumption"
                description="Power consumed by DRAM"
                serverId={serverId}
                influxConfig={influxConfig}
                bucket={bucket}
                fields={['dram_energy_consumption_watts']}
                aggregation="mean"
                timeRange={dateRange}
                yAxisLabel="Watts"
                formatValue={(value) => `${value.toFixed(1)}W`}
                height={300}
              />

              <ServerMetricChart
                title="GPU Energy Consumption"
                description="Power consumed by GPU"
                serverId={serverId}
                influxConfig={influxConfig}
                bucket={bucket}
                fields={['gpu_energy_consumption_watts']}
                aggregation="mean"
                timeRange={dateRange}
                yAxisLabel="Watts"
                formatValue={(value) => `${value.toFixed(1)}W`}
                height={300}
              />

              <ServerMetricChart
                title="Total Server Energy Consumption"
                description="Total power consumed by server"
                serverId={serverId}
                influxConfig={influxConfig}
                bucket={bucket}
                fields={['server_energy_consumption_watts']}
                aggregation="mean"
                timeRange={dateRange}
                yAxisLabel="Watts"
                formatValue={(value) => `${value.toFixed(1)}W`}
                height={300}
              />
            </div>
          </TabsContent>

          {/* Fans Tab */}
          <TabsContent value="fans" className="space-y-4">
            <ServerMetricChart
              title="Fan Speed"
              description="Fan speeds for GPU and server cooling systems"
              serverId={serverId}
              influxConfig={influxConfig}
              bucket={bucket}
              fields={[
                'gpu_fan_speed_rpm',
                'server_fan_speed_rpm',
              ]}
              aggregation="mean"
              timeRange={dateRange}
              yAxisLabel="RPM"
              formatValue={(value) => `${value.toFixed(0)} RPM`}
            />
          </TabsContent>

          {/* I/O Tab */}
          <TabsContent value="io" className="space-y-4">
            <ServerMetricChart
              title="I/O Data Transfer"
              description="Bytes read and written to storage (in MB)"
              serverId={serverId}
              influxConfig={influxConfig}
              bucket={bucket}
              fields={[
                'io_bytes_read',
                'io_bytes_written',
              ]}
              aggregation="sum"
              timeRange={dateRange}
              yAxisLabel="Megabytes"
              formatValue={(value) => `${value.toFixed(2)} MB`}
              convertToMegabytes={true}
            />

            <ServerMetricChart
              title="I/O Operations"
              description="Number of read and write operations"
              serverId={serverId}
              influxConfig={influxConfig}
              bucket={bucket}
              fields={[
                'io_reads',
                'io_writes',
              ]}
              aggregation="sum"
              timeRange={dateRange}
              yAxisLabel="Operations"
              formatValue={(value) => `${value.toFixed(0)}`}
            />
          </TabsContent>

          {/* Network Tab */}
          <TabsContent value="network" className="space-y-4">
            <ServerMetricChart
              title="Network Data Transfer"
              description="Bytes received and transmitted over the network (in MB)"
              serverId={serverId}
              influxConfig={influxConfig}
              bucket={bucket}
              fields={[
                'network_received_bytes',
                'network_transmit_bytes',
              ]}
              aggregation="sum"
              timeRange={dateRange}
              yAxisLabel="Megabytes"
              formatValue={(value) => `${value.toFixed(2)} MB`}
              convertToMegabytes={true}
            />

            <ServerMetricChart
              title="Network Packets"
              description="Number of packets received and transmitted"
              serverId={serverId}
              influxConfig={influxConfig}
              bucket={bucket}
              fields={[
                'network_received_packets',
                'network_transmit_packets',
              ]}
              aggregation="sum"
              timeRange={dateRange}
              yAxisLabel="Packets"
              formatValue={(value) => `${value.toFixed(0)}`}
            />
          </TabsContent>

          {/* CPU Utilization Tab */}
          <TabsContent value="cpu" className="space-y-4">
            <ServerMetricChart
              title="CPU Utilization"
              description="Average CPU busy fraction across all cores"
              serverId={serverId}
              influxConfig={influxConfig}
              bucket={bucket}
              fields={['cpu_busy_faction']}
              aggregation="mean"
              timeRange={dateRange}
              yAxisLabel="Percentage"
              formatValue={(value) => `${(value * 100).toFixed(1)}%`}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
