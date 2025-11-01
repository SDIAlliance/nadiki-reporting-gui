'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TimeRangePicker, type TimeRangeValue } from '@/components/TimeRangePicker';
import { CO2EmissionsChart } from '@/components/charts/CO2EmissionsChart';
import { EnergyUseChart } from '@/components/charts/EnergyUseChart';
import { EnergyOverviewAreaChart } from '@/components/charts/EnergyOverviewAreaChart';
import { EnergyPercentAreaChart } from '@/components/charts/EnergyPercentAreaChart';
import { EmbodiedImpactChart } from '@/components/charts/EmbodiedImpactChart';
import type { FacilityResponse } from '@/packages/registrar-api-client/types/facility-api';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ImpactPage() {
  const params = useParams();
  const facilityId = params.facilityId as string;

  const [dateRange, setDateRange] = useState<TimeRangeValue | undefined>(undefined);

  // Fetch facility data using SWR
  const { error, isLoading } = useSWR<FacilityResponse>(
    `/api/facilities/${facilityId}`,
    fetcher
  );

  // Prepare InfluxDB configuration from environment variables for impact data
  const influxConfig = {
    url: process.env.NEXT_PUBLIC_INFLUX_URL || '',
    token: process.env.NEXT_PUBLIC_INFLUX_TOKEN || '',
    org: process.env.NEXT_PUBLIC_INFLUX_ORG || '',
  };

  const bucket = process.env.NEXT_PUBLIC_INFLUX_IMPACT_BUCKET || 'facility-impact';

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
          description="Select the time range for impact analysis"
          defaultTimeRange="year"
          onChange={setDateRange}
        />

        {/* Tabs for organizing metrics */}
        <Tabs defaultValue="co2" className="w-full">
          <TabsList>
            <TabsTrigger value="co2">CO2 Emissions</TabsTrigger>
            <TabsTrigger value="energy">Primary Energy Use</TabsTrigger>
            <TabsTrigger value="embodied">Embodied Impacts</TabsTrigger>
          </TabsList>

          {/* CO2 Emissions Tab */}
          <TabsContent value="co2" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Actual CO2 Emissions */}
              <CO2EmissionsChart
                facilityId={facilityId}
                influxConfig={influxConfig}
                bucket={bucket}
                timeRange={dateRange}
                cumulative={false}
              />

              {/* Cumulative CO2 Emissions */}
              <CO2EmissionsChart
                facilityId={facilityId}
                influxConfig={influxConfig}
                bucket={bucket}
                timeRange={dateRange}
                cumulative={true}
              />
            </div>
          </TabsContent>

          {/* Primary Energy Use Tab */}
          <TabsContent value="energy" className="space-y-4">
            {/* Energy Overview Area Charts */}
            <div className="grid gap-6 md:grid-cols-2">
              <EnergyOverviewAreaChart
                facilityId={facilityId}
                influxConfig={influxConfig}
                bucket={bucket}
                timeRange={dateRange}
              />

              <EnergyPercentAreaChart
                facilityId={facilityId}
                influxConfig={influxConfig}
                bucket={bucket}
                timeRange={dateRange}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Non-Renewable Energy (incl. Generators) - Actual */}
              <EnergyUseChart
                facilityId={facilityId}
                influxConfig={influxConfig}
                bucket={bucket}
                timeRange={dateRange}
                measurement="non_renewable_energy_use_incl_generators_kwh"
                cumulative={false}
              />

              {/* Non-Renewable Energy (incl. Generators) - Cumulative */}
              <EnergyUseChart
                facilityId={facilityId}
                influxConfig={influxConfig}
                bucket={bucket}
                timeRange={dateRange}
                measurement="non_renewable_energy_use_incl_generators_kwh"
                cumulative={true}
              />

              {/* Non-Renewable Energy - Actual */}
              <EnergyUseChart
                facilityId={facilityId}
                influxConfig={influxConfig}
                bucket={bucket}
                timeRange={dateRange}
                measurement="non_renewable_energy_use_kwh"
                cumulative={false}
              />

              {/* Non-Renewable Energy - Cumulative */}
              <EnergyUseChart
                facilityId={facilityId}
                influxConfig={influxConfig}
                bucket={bucket}
                timeRange={dateRange}
                measurement="non_renewable_energy_use_kwh"
                cumulative={true}
              />

              {/* Renewable Energy (incl. Onsite) - Actual */}
              <EnergyUseChart
                facilityId={facilityId}
                influxConfig={influxConfig}
                bucket={bucket}
                timeRange={dateRange}
                measurement="renewable_energy_use_incl_onsite_kwh"
                cumulative={false}
              />

              {/* Renewable Energy (incl. Onsite) - Cumulative */}
              <EnergyUseChart
                facilityId={facilityId}
                influxConfig={influxConfig}
                bucket={bucket}
                timeRange={dateRange}
                measurement="renewable_energy_use_incl_onsite_kwh"
                cumulative={true}
              />

              {/* Renewable Energy - Actual */}
              <EnergyUseChart
                facilityId={facilityId}
                influxConfig={influxConfig}
                bucket={bucket}
                timeRange={dateRange}
                measurement="renewable_energy_use_kwh"
                cumulative={false}
              />

              {/* Renewable Energy - Cumulative */}
              <EnergyUseChart
                facilityId={facilityId}
                influxConfig={influxConfig}
                bucket={bucket}
                timeRange={dateRange}
                measurement="renewable_energy_use_kwh"
                cumulative={true}
              />
            </div>
          </TabsContent>

          {/* Embodied Impacts Tab */}
          <TabsContent value="embodied" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Climate Change */}
              <EmbodiedImpactChart facilityId={facilityId} influxConfig={influxConfig} bucket={bucket} timeRange={dateRange} metric="climate_change" cumulative={false} />
              <EmbodiedImpactChart facilityId={facilityId} influxConfig={influxConfig} bucket={bucket} timeRange={dateRange} metric="climate_change" cumulative={true} />

              {/* Ozone Depletion */}
              <EmbodiedImpactChart facilityId={facilityId} influxConfig={influxConfig} bucket={bucket} timeRange={dateRange} metric="ozone_depletion" cumulative={false} />
              <EmbodiedImpactChart facilityId={facilityId} influxConfig={influxConfig} bucket={bucket} timeRange={dateRange} metric="ozone_depletion" cumulative={true} />

              {/* Human Toxicity */}
              <EmbodiedImpactChart facilityId={facilityId} influxConfig={influxConfig} bucket={bucket} timeRange={dateRange} metric="human_toxicity" cumulative={false} />
              <EmbodiedImpactChart facilityId={facilityId} influxConfig={influxConfig} bucket={bucket} timeRange={dateRange} metric="human_toxicity" cumulative={true} />

              {/* Photochemical Oxidant Formation */}
              <EmbodiedImpactChart facilityId={facilityId} influxConfig={influxConfig} bucket={bucket} timeRange={dateRange} metric="photochemical_oxidant_formation" cumulative={false} />
              <EmbodiedImpactChart facilityId={facilityId} influxConfig={influxConfig} bucket={bucket} timeRange={dateRange} metric="photochemical_oxidant_formation" cumulative={true} />

              {/* Particulate Matter Formation */}
              <EmbodiedImpactChart facilityId={facilityId} influxConfig={influxConfig} bucket={bucket} timeRange={dateRange} metric="particulate_matter_formation" cumulative={false} />
              <EmbodiedImpactChart facilityId={facilityId} influxConfig={influxConfig} bucket={bucket} timeRange={dateRange} metric="particulate_matter_formation" cumulative={true} />

              {/* Ionizing Radiation */}
              <EmbodiedImpactChart facilityId={facilityId} influxConfig={influxConfig} bucket={bucket} timeRange={dateRange} metric="ionizing_radiation" cumulative={false} />
              <EmbodiedImpactChart facilityId={facilityId} influxConfig={influxConfig} bucket={bucket} timeRange={dateRange} metric="ionizing_radiation" cumulative={true} />

              {/* Terrestrial Acidification */}
              <EmbodiedImpactChart facilityId={facilityId} influxConfig={influxConfig} bucket={bucket} timeRange={dateRange} metric="terrestrial_acidification" cumulative={false} />
              <EmbodiedImpactChart facilityId={facilityId} influxConfig={influxConfig} bucket={bucket} timeRange={dateRange} metric="terrestrial_acidification" cumulative={true} />

              {/* Freshwater Eutrophication */}
              <EmbodiedImpactChart facilityId={facilityId} influxConfig={influxConfig} bucket={bucket} timeRange={dateRange} metric="freshwater_eutrophication" cumulative={false} />
              <EmbodiedImpactChart facilityId={facilityId} influxConfig={influxConfig} bucket={bucket} timeRange={dateRange} metric="freshwater_eutrophication" cumulative={true} />

              {/* Marine Eutrophication */}
              <EmbodiedImpactChart facilityId={facilityId} influxConfig={influxConfig} bucket={bucket} timeRange={dateRange} metric="marine_eutrophication" cumulative={false} />
              <EmbodiedImpactChart facilityId={facilityId} influxConfig={influxConfig} bucket={bucket} timeRange={dateRange} metric="marine_eutrophication" cumulative={true} />

              {/* Terrestrial Ecotoxicity */}
              <EmbodiedImpactChart facilityId={facilityId} influxConfig={influxConfig} bucket={bucket} timeRange={dateRange} metric="terrestrial_ecotoxicity" cumulative={false} />
              <EmbodiedImpactChart facilityId={facilityId} influxConfig={influxConfig} bucket={bucket} timeRange={dateRange} metric="terrestrial_ecotoxicity" cumulative={true} />

              {/* Freshwater Ecotoxicity */}
              <EmbodiedImpactChart facilityId={facilityId} influxConfig={influxConfig} bucket={bucket} timeRange={dateRange} metric="freshwater_ecotoxicity" cumulative={false} />
              <EmbodiedImpactChart facilityId={facilityId} influxConfig={influxConfig} bucket={bucket} timeRange={dateRange} metric="freshwater_ecotoxicity" cumulative={true} />

              {/* Marine Ecotoxicity */}
              <EmbodiedImpactChart facilityId={facilityId} influxConfig={influxConfig} bucket={bucket} timeRange={dateRange} metric="marine_ecotoxicity" cumulative={false} />
              <EmbodiedImpactChart facilityId={facilityId} influxConfig={influxConfig} bucket={bucket} timeRange={dateRange} metric="marine_ecotoxicity" cumulative={true} />

              {/* Agricultural Land Occupation */}
              <EmbodiedImpactChart facilityId={facilityId} influxConfig={influxConfig} bucket={bucket} timeRange={dateRange} metric="agricultural_land_occupation" cumulative={false} />
              <EmbodiedImpactChart facilityId={facilityId} influxConfig={influxConfig} bucket={bucket} timeRange={dateRange} metric="agricultural_land_occupation" cumulative={true} />

              {/* Urban Land Occupation */}
              <EmbodiedImpactChart facilityId={facilityId} influxConfig={influxConfig} bucket={bucket} timeRange={dateRange} metric="urban_land_occupation" cumulative={false} />
              <EmbodiedImpactChart facilityId={facilityId} influxConfig={influxConfig} bucket={bucket} timeRange={dateRange} metric="urban_land_occupation" cumulative={true} />

              {/* Natural Land Transformation */}
              <EmbodiedImpactChart facilityId={facilityId} influxConfig={influxConfig} bucket={bucket} timeRange={dateRange} metric="natural_land_transformation" cumulative={false} />
              <EmbodiedImpactChart facilityId={facilityId} influxConfig={influxConfig} bucket={bucket} timeRange={dateRange} metric="natural_land_transformation" cumulative={true} />

              {/* Water Depletion */}
              <EmbodiedImpactChart facilityId={facilityId} influxConfig={influxConfig} bucket={bucket} timeRange={dateRange} metric="water_depletion" cumulative={false} />
              <EmbodiedImpactChart facilityId={facilityId} influxConfig={influxConfig} bucket={bucket} timeRange={dateRange} metric="water_depletion" cumulative={true} />

              {/* Metal Depletion */}
              <EmbodiedImpactChart facilityId={facilityId} influxConfig={influxConfig} bucket={bucket} timeRange={dateRange} metric="metal_depletion" cumulative={false} />
              <EmbodiedImpactChart facilityId={facilityId} influxConfig={influxConfig} bucket={bucket} timeRange={dateRange} metric="metal_depletion" cumulative={true} />

              {/* Fossil Depletion */}
              <EmbodiedImpactChart facilityId={facilityId} influxConfig={influxConfig} bucket={bucket} timeRange={dateRange} metric="fossil_depletion" cumulative={false} />
              <EmbodiedImpactChart facilityId={facilityId} influxConfig={influxConfig} bucket={bucket} timeRange={dateRange} metric="fossil_depletion" cumulative={true} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}