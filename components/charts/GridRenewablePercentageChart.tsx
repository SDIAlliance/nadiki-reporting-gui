'use client';

import { OperationalMetricChart } from './OperationalMetricChart';

interface GridRenewablePercentageChartProps {
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

export function GridRenewablePercentageChart({
  facilityId,
  influxConfig,
  bucket,
  timeRange,
}: GridRenewablePercentageChartProps) {
  return (
    <OperationalMetricChart
      title="Grid Renewable Energy Percentage"
      description="Percentage of renewable energy in the grid mix"
      influxConfig={influxConfig}
      bucket={bucket}
      field="grid_renewable_percentage"
      facilityId={facilityId}
      timeRange={timeRange}
      yAxisLabel="%"
      aggregationFunction="mean"
      formatValue={(value) => `${value.toFixed(1)}%`}
      valueTransform={(value) => value}
      color="#10b981"
    />
  );
}
