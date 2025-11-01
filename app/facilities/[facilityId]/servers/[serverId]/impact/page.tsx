'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { TimeRangePicker, type TimeRangeValue } from '@/components/TimeRangePicker';
import { ServerEmbodiedImpactChart } from '@/components/charts/ServerEmbodiedImpactChart';
import { ServerEmbodiedMetricCard } from '@/components/metrics/ServerEmbodiedMetricCard';
import type { ServerEmbodiedImpactMetric } from '@/types/server-embodied-impact';

export default function ServerImpactPage() {
  const params = useParams();
  const serverId = params.serverId as string;

  const [dateRange, setDateRange] = useState<TimeRangeValue | undefined>(undefined);

  // Prepare InfluxDB configuration from environment variables for server impact data
  const influxConfig = {
    url: process.env.NEXT_PUBLIC_INFLUX_URL || '',
    token: process.env.NEXT_PUBLIC_INFLUX_TOKEN || '',
    org: process.env.NEXT_PUBLIC_INFLUX_ORG || '',
  };

  const bucket = process.env.NEXT_PUBLIC_INFLUX_IMPACT_BUCKET || 'server-impact';

  // Define all metrics to display
  const metrics: ServerEmbodiedImpactMetric[] = [
    'climate_change',
    'primary_energy_use',
    'ozone_depletion',
    'human_toxicity',
    'photochemical_oxidant_formation',
    'particulate_matter_formation',
    'ionizing_radiation',
    'terrestrial_acidification',
    'freshwater_eutrophication',
    'marine_eutrophication',
    'terrestrial_ecotoxicity',
    'freshwater_ecotoxicity',
    'marine_ecotoxicity',
    'agricultural_land_occupation',
    'urban_land_occupation',
    'natural_land_transformation',
    'abiotic_depletion_potential',
  ];

  return (
    <div>
      <div className="grid gap-6">
        {/* Time Range Selection */}
        <TimeRangePicker
          title="Time Period"
          description="Select the time range for embodied impact analysis"
          defaultTimeRange="today"
          onChange={setDateRange}
        />

        {/* KPI Cards - Total Embodied Impacts */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          {metrics.map((metric) => (
            <ServerEmbodiedMetricCard
              key={`card-${metric}`}
              metric={metric}
              serverId={serverId}
              influxConfig={influxConfig}
              bucket={bucket}
              timeRange={dateRange}
            />
          ))}
        </div>

        {/* All Embodied Impact Charts in a 2-column grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {metrics.map((metric) => (
            <ServerEmbodiedImpactChart
              key={`chart-${metric}`}
              serverId={serverId}
              influxConfig={influxConfig}
              bucket={bucket}
              timeRange={dateRange}
              metric={metric}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
