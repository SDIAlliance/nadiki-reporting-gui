'use client';

import { MultiFieldImpactChart } from './MultiFieldImpactChart';

type EnergyMeasurement =
  | 'non_renewable_energy_use_incl_generators_kwh'
  | 'non_renewable_energy_use_kwh'
  | 'renewable_energy_use_incl_onsite_kwh'
  | 'renewable_energy_use_kwh';

interface EnergyUseChartProps {
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
  measurement: EnergyMeasurement;
  cumulative?: boolean;
}

// Mapping of measurements to friendly titles
const MEASUREMENT_TITLES: Record<EnergyMeasurement, string> = {
  'non_renewable_energy_use_incl_generators_kwh': 'Non-Renewable Energy (incl. Generators)',
  'non_renewable_energy_use_kwh': 'Non-Renewable Energy',
  'renewable_energy_use_incl_onsite_kwh': 'Renewable Energy (incl. Onsite)',
  'renewable_energy_use_kwh': 'Renewable Energy',
};

// Color mapping for different energy types
const MEASUREMENT_COLORS: Record<EnergyMeasurement, string> = {
  'non_renewable_energy_use_incl_generators_kwh': '#dc2626', // red-600
  'non_renewable_energy_use_kwh': '#ea580c', // orange-600
  'renewable_energy_use_incl_onsite_kwh': '#16a34a', // green-600
  'renewable_energy_use_kwh': '#059669', // emerald-600
};

export function EnergyUseChart({
  facilityId,
  influxConfig,
  bucket,
  timeRange,
  measurement,
  cumulative = false,
}: EnergyUseChartProps) {
  const baseTitle = MEASUREMENT_TITLES[measurement];

  // Special formatting for renewable_energy_use_kwh to clarify it's grid-based only
  let title: string;
  if (measurement === 'renewable_energy_use_kwh') {
    title = cumulative
      ? 'Renewable Energy (cumulative, only grid-based)'
      : 'Renewable Energy (actual, only grid-based)';
  } else {
    title = cumulative ? `${baseTitle} (cumulative)` : `${baseTitle} (actual)`;
  }

  const description = cumulative
    ? 'Cumulative energy use over time'
    : 'Energy use by period';

  return (
    <MultiFieldImpactChart
      title={title}
      description={description}
      influxConfig={influxConfig}
      bucket={bucket}
      measurement={measurement}
      fields={[
        {
          field: measurement,
          label: baseTitle,
          color: MEASUREMENT_COLORS[measurement],
          aggregationFunction: 'sum',
        },
      ]}
      facilityId={facilityId}
      timeRange={timeRange}
      yAxisLabel="kWh"
      defaultAggregation="sum"
      formatValue={(value) => `${value.toFixed(2)} kWh`}
      valueTransform={(value) => value} // Values are already in kWh
      cumulative={cumulative}
      disableAutoScaling={true} // Keep energy values in kWh, don't scale to MWh
    />
  );
}
