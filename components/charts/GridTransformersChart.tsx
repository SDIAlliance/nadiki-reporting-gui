'use client';

import { MultiFieldOperationalChart } from './MultiFieldOperationalChart';

interface GridTransformersChartProps {
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

export function GridTransformersChart({
  facilityId,
  influxConfig,
  bucket,
  timeRange,
}: GridTransformersChartProps) {
  return (
    <MultiFieldOperationalChart
      title="Power Consumption Metrics"
      description="Average power consumption from various facility sources"
      influxConfig={influxConfig}
      bucket={bucket}
      fields={[
        {
          field: 'grid_transformers_avg_watts',
          label: 'Grid Transformers',
          color: '#2563eb',
          aggregationFunction: 'mean',
        },
        {
          field: 'it_power_usage_level1_avg_watts',
          label: 'IT Power Level 1',
          color: '#16a34a',
          aggregationFunction: 'mean',
        },
        {
          field: 'it_power_usage_level2_avg_watts',
          label: 'IT Power Level 2',
          color: '#dc2626',
          aggregationFunction: 'mean',
        },
        {
          field: 'total_generators_avg_watts',
          label: 'Total Generators',
          color: '#ca8a04',
          aggregationFunction: 'mean',
        },
        {
          field: 'office_avg_watts',
          label: 'Office',
          color: '#9333ea',
          aggregationFunction: 'mean',
        },
      ]}
      facilityId={facilityId}
      timeRange={timeRange}
      yAxisLabel="kW"
      defaultAggregation="mean"
      formatValue={(value) => `${value.toFixed(2)} kW`}
      valueTransform={(value) => value / 1000}
    />
  );
}
