'use client';

import { InfluxLineChart } from './InfluxLineChart';
import { ENERGY_SOURCES, ENERGY_SOURCE_LABELS, IMPACT_CATEGORIES, IMPACT_CATEGORY_UNITS } from '@/types/facility-impact';

interface PrimaryEnergyUseChartProps {
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

const ENERGY_SOURCE_COLORS = {
  [ENERGY_SOURCES.GRID]: '#2563eb',
  [ENERGY_SOURCES.ONSITE_SOLAR]: '#16a34a',
  [ENERGY_SOURCES.ONSITE_WIND]: '#dc2626',
  [ENERGY_SOURCES.DIESEL_GENERATOR]: '#ca8a04',
  [ENERGY_SOURCES.GAS_GENERATOR]: '#9333ea',
};

export function PrimaryEnergyUseChart({
  facilityId,
  influxConfig,
  bucket,
  timeRange,
  cumulative = true
}: PrimaryEnergyUseChartProps) {
  const field = cumulative ? 'cumulative_impact' : 'period_impact';
  const title = cumulative ? 'Primary Energy Use (Cumulative)' : 'Primary Energy Use (Period)';
  const description = cumulative
    ? 'Running total of primary energy consumption by source since January 1st'
    : 'Energy consumption by source for each period';

  // The chart will group by energy_source to create multiple lines
  return (
    <InfluxLineChart
      title={title}
      description={description}
      influxConfig={influxConfig}
      bucket={bucket}
      measurement="facility_operational_impact"
      fields={[field]}
      filters={{
        facility_id: facilityId,
        impact_category: IMPACT_CATEGORIES.PRIMARY_ENERGY_USE,
      }}
      groupBy={['energy_source']}
      timeRange={timeRange}
      yAxisLabel={IMPACT_CATEGORY_UNITS[IMPACT_CATEGORIES.PRIMARY_ENERGY_USE]}
      colors={Object.values(ENERGY_SOURCE_COLORS)}
      formatValue={(value) => `${value.toFixed(0)} kWh`}
    />
  );
}