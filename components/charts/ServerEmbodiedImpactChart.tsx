'use client';

import { MultiFieldImpactChart } from './MultiFieldImpactChart';
import {
  type ServerEmbodiedImpactMetric,
  SERVER_EMBODIED_METRIC_INFO,
  SERVER_EMBODIED_METRIC_COLORS,
} from '@/types/server-embodied-impact';

interface ServerEmbodiedImpactChartProps {
  serverId: string;
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
  metric: ServerEmbodiedImpactMetric;
}

export function ServerEmbodiedImpactChart({
  serverId,
  influxConfig,
  bucket,
  timeRange,
  metric,
}: ServerEmbodiedImpactChartProps) {
  const metricInfo = SERVER_EMBODIED_METRIC_INFO[metric];
  const title = metricInfo.title;
  const description = 'Embodied impact over time';

  return (
    <MultiFieldImpactChart
      title={title}
      description={description}
      influxConfig={influxConfig}
      bucket={bucket}
      measurement="server_embodied"
      fields={[
        {
          field: metric,
          label: metricInfo.title,
          color: SERVER_EMBODIED_METRIC_COLORS[metric],
          aggregationFunction: 'last', // Use last value for embodied metrics
        },
      ]}
      facilityId={serverId}
      timeRange={timeRange}
      yAxisLabel={metricInfo.unit}
      defaultAggregation="last"
      formatValue={(value) => value.toExponential(2)} // Use scientific notation for small values
      valueTransform={(value) => value}
      cumulative={false}
      disableAutoScaling={true} // Don't auto-scale these metrics
      facilityIdTag="id" // Server embodied data uses 'id' tag instead of 'facility_id'
      useFieldAsMetric={true} // Embodied data uses metric name as _field
      height={300}
    />
  );
}
