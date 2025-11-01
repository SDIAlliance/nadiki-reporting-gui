'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TimeRangePicker, type TimeRangeValue } from '@/components/TimeRangePicker';
import { OnsiteRenewableEnergyChart } from '@/components/charts/OnsiteRenewableEnergyChart';
import { GridEmissionFactorChart } from '@/components/charts/GridEmissionFactorChart';
import { GridTransformersChart } from '@/components/charts/GridTransformersChart';
import { PUEChart } from '@/components/charts/PUEChart';
import { GridRenewablePercentageChart } from '@/components/charts/GridRenewablePercentageChart';
import { PUEMetricCard } from '@/components/metrics/PUEMetricCard';
import type { FacilityResponse } from '@/packages/registrar-api-client/types/facility-api';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function OperationalPage() {
  const params = useParams();
  const facilityId = params.facilityId as string;

  const [dateRange, setDateRange] = useState<TimeRangeValue | undefined>(undefined);

  // Fetch facility data using SWR
  const { data: facility, error, isLoading } = useSWR<FacilityResponse>(
    `/api/facilities/${facilityId}`,
    fetcher
  );

  // Prepare InfluxDB configuration from facility data
  const influxConfig = facility?.timeSeriesConfig ? {
    url: facility.timeSeriesConfig.endpoint,
    token: facility.timeSeriesConfig.token,
    org: facility.timeSeriesConfig.org,
  } : undefined;

  if (error) {
    return (
      <div className="p-8">
        <div className="text-destructive">Error loading facility data</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-muted-foreground">Loading facility data...</div>
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
          defaultTimeRange="year"
          onChange={setDateRange}
        />

        {/* Tabs for organizing metrics */}
        <Tabs defaultValue="kpi" className="w-full">
          <TabsList>
            <TabsTrigger value="kpi">KPI</TabsTrigger>
            <TabsTrigger value="power">Power Consumption</TabsTrigger>
            <TabsTrigger value="renewable">Renewable Power</TabsTrigger>
          </TabsList>

          {/* KPI Tab */}
          <TabsContent value="kpi" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <PUEMetricCard
                title="Avg PUE 1 Over Time Period"
                field="pue_1_ratio"
                facilityId={facilityId}
                influxConfig={influxConfig}
                bucket={facility?.timeSeriesConfig?.bucket || 'facility-metrics'}
                timeRange={dateRange}
              />

              <PUEMetricCard
                title="Avg PUE 2 Over Time Period"
                field="pue_2_ratio"
                facilityId={facilityId}
                influxConfig={influxConfig}
                bucket={facility?.timeSeriesConfig?.bucket || 'facility-metrics'}
                timeRange={dateRange}
              />
            </div>
          </TabsContent>

          {/* Power Consumption Tab */}
          <TabsContent value="power" className="space-y-4">
            <GridTransformersChart
              facilityId={facilityId}
              influxConfig={influxConfig}
              bucket={facility?.timeSeriesConfig?.bucket || 'facility-metrics'}
              timeRange={dateRange}
            />

            <PUEChart
              facilityId={facilityId}
              influxConfig={influxConfig}
              bucket={facility?.timeSeriesConfig?.bucket || 'facility-metrics'}
              timeRange={dateRange}
            />
          </TabsContent>

          {/* Renewable Power Tab */}
          <TabsContent value="renewable" className="space-y-4">
            <OnsiteRenewableEnergyChart
              facilityId={facilityId}
              influxConfig={influxConfig}
              bucket={facility?.timeSeriesConfig?.bucket || 'facility-metrics'}
              timeRange={dateRange}
            />

            <GridEmissionFactorChart
              facilityId={facilityId}
              influxConfig={influxConfig}
              bucket={facility?.timeSeriesConfig?.bucket || 'facility-metrics'}
              timeRange={dateRange}
            />

            <GridRenewablePercentageChart
              facilityId={facilityId}
              influxConfig={influxConfig}
              bucket={facility?.timeSeriesConfig?.bucket || 'facility-metrics'}
              timeRange={dateRange}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
