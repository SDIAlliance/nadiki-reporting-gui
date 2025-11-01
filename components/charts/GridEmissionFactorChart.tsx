'use client';

import { OperationalMetricChart } from './OperationalMetricChart';

interface GridEmissionFactorChartProps {
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

export function GridEmissionFactorChart({
  facilityId,
  influxConfig,
  bucket,
  timeRange,
}: GridEmissionFactorChartProps) {
  return (
    <OperationalMetricChart
      title="Grid Emission Factor"
      description="Carbon intensity of grid electricity in gCO2eq/kWh (from Electricity Map API)"
      influxConfig={influxConfig}
      bucket={bucket}
      field="grid_emission_factor_grams"
      facilityId={facilityId}
      timeRange={timeRange}
      yAxisLabel="gCO2eq/kWh"
      aggregationFunction="mean"
      formatValue={(value) => `${value.toFixed(1)} gCO2eq/kWh`}
      color="#16a34a"
    />
  );
}
