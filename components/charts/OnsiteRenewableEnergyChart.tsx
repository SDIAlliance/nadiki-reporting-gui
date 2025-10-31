'use client';

import { InfluxLineChart } from './InfluxLineChart';

interface OnsiteRenewableEnergyChartProps {
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

export function OnsiteRenewableEnergyChart({
  facilityId,
  influxConfig,
  bucket,
  timeRange,
}: OnsiteRenewableEnergyChartProps) {
  return (
    <InfluxLineChart
      title="Onsite Renewable Energy"
      description="Average watts generated from onsite renewable energy sources"
      influxConfig={influxConfig}
      bucket={bucket}
      measurement="facility"
      fields={['onsite_renewable_energy_avg_watts']}
      filters={{
        facility_id: facilityId,
      }}
      timeRange={timeRange}
      yAxisLabel="Watts"
      colors={['#16a34a']}
      formatValue={(value) => `${value.toFixed(2)} W`}
    />
  );
}
