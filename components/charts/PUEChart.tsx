'use client';

import { MultiFieldOperationalChart } from './MultiFieldOperationalChart';

interface PUEChartProps {
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

export function PUEChart({
  facilityId,
  influxConfig,
  bucket,
  timeRange,
}: PUEChartProps) {
  return (
    <MultiFieldOperationalChart
      title="Power Usage Effectiveness (PUE)"
      description="PUE ratio trends over time"
      influxConfig={influxConfig}
      bucket={bucket}
      fields={[
        {
          field: 'pue_1_ratio',
          label: 'PUE 1',
          color: '#2563eb',
          aggregationFunction: 'mean',
        },
        {
          field: 'pue_2_ratio',
          label: 'PUE 2',
          color: '#16a34a',
          aggregationFunction: 'mean',
        },
      ]}
      facilityId={facilityId}
      timeRange={timeRange}
      yAxisLabel="PUE Ratio"
      defaultAggregation="mean"
      formatValue={(value) => value.toFixed(3)}
      valueTransform={(value) => value}
    />
  );
}
