'use client';

import { MultiFieldImpactChart } from './MultiFieldImpactChart';

interface CO2EmissionsChartProps {
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
  cumulative?: boolean;
}

export function CO2EmissionsChart({
  facilityId,
  influxConfig,
  bucket,
  timeRange,
  cumulative = false,
}: CO2EmissionsChartProps) {
  const title = cumulative
    ? 'Operational CO2 Emissions (cumulative)'
    : 'Operational CO2 Emissions (actual)';

  return (
    <MultiFieldImpactChart
      title={title}
      description={cumulative ? 'Cumulative CO2 emissions over time' : 'CO2 emissions by period'}
      influxConfig={influxConfig}
      bucket={bucket}
      measurement="co2_grams"
      fields={[
        {
          field: 'co2_grams',
          label: 'CO2 Emissions',
          color: '#dc2626', // red-600 for emissions
          aggregationFunction: 'sum',
        },
      ]}
      facilityId={facilityId}
      timeRange={timeRange}
      yAxisLabel="kgCO2-eq"
      defaultAggregation="sum"
      formatValue={(value) => `${value.toFixed(2)} kg`}
      valueTransform={(value) => value / 1000} // Convert grams to kg
      cumulative={cumulative}
    />
  );
}
