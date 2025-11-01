'use client';

import { MultiFieldImpactChart } from './MultiFieldImpactChart';

type EmbodiedImpactMetric =
  | 'climate_change'
  | 'ozone_depletion'
  | 'human_toxicity'
  | 'photochemical_oxidant_formation'
  | 'particulate_matter_formation'
  | 'ionizing_radiation'
  | 'terrestrial_acidification'
  | 'freshwater_eutrophication'
  | 'marine_eutrophication'
  | 'terrestrial_ecotoxicity'
  | 'freshwater_ecotoxicity'
  | 'marine_ecotoxicity'
  | 'agricultural_land_occupation'
  | 'urban_land_occupation'
  | 'natural_land_transformation'
  | 'water_depletion'
  | 'metal_depletion'
  | 'fossil_depletion';

interface EmbodiedImpactChartProps {
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
  metric: EmbodiedImpactMetric;
  cumulative?: boolean;
}

// Mapping of metrics to friendly titles and units
const METRIC_INFO: Record<EmbodiedImpactMetric, { title: string; unit: string }> = {
  climate_change: {
    title: 'Climate Change',
    unit: 'kg CO2 eq',
  },
  ozone_depletion: {
    title: 'Ozone Depletion',
    unit: 'kg CFC-11 eq',
  },
  human_toxicity: {
    title: 'Human Toxicity',
    unit: 'kg 1,4-DB eq',
  },
  photochemical_oxidant_formation: {
    title: 'Photochemical Oxidant Formation',
    unit: 'kg NMVOC',
  },
  particulate_matter_formation: {
    title: 'Particulate Matter Formation',
    unit: 'kg PM10 eq',
  },
  ionizing_radiation: {
    title: 'Ionizing Radiation',
    unit: 'kg U235 eq',
  },
  terrestrial_acidification: {
    title: 'Terrestrial Acidification',
    unit: 'kg SO2 eq',
  },
  freshwater_eutrophication: {
    title: 'Freshwater Eutrophication',
    unit: 'kg P eq',
  },
  marine_eutrophication: {
    title: 'Marine Eutrophication',
    unit: 'kg N eq',
  },
  terrestrial_ecotoxicity: {
    title: 'Terrestrial Ecotoxicity',
    unit: 'kg 1,4-DB eq',
  },
  freshwater_ecotoxicity: {
    title: 'Freshwater Ecotoxicity',
    unit: 'kg 1,4-DB eq',
  },
  marine_ecotoxicity: {
    title: 'Marine Ecotoxicity',
    unit: 'kg 1,4-DB eq',
  },
  agricultural_land_occupation: {
    title: 'Agricultural Land Occupation',
    unit: 'm²a',
  },
  urban_land_occupation: {
    title: 'Urban Land Occupation',
    unit: 'm²a',
  },
  natural_land_transformation: {
    title: 'Natural Land Transformation',
    unit: 'm²',
  },
  water_depletion: {
    title: 'Water Depletion',
    unit: 'm³',
  },
  metal_depletion: {
    title: 'Metal Depletion',
    unit: 'kg Fe eq',
  },
  fossil_depletion: {
    title: 'Fossil Depletion',
    unit: 'kg oil eq',
  },
};

// Color palette for different metrics (using chart colors)
const METRIC_COLORS: Record<EmbodiedImpactMetric, string> = {
  climate_change: '#2563eb', // blue
  ozone_depletion: '#7c3aed', // purple
  human_toxicity: '#dc2626', // red
  photochemical_oxidant_formation: '#ea580c', // orange
  particulate_matter_formation: '#d97706', // amber
  ionizing_radiation: '#65a30d', // lime
  terrestrial_acidification: '#16a34a', // green
  freshwater_eutrophication: '#059669', // emerald
  marine_eutrophication: '#0d9488', // teal
  terrestrial_ecotoxicity: '#0891b2', // cyan
  freshwater_ecotoxicity: '#0284c7', // sky
  marine_ecotoxicity: '#2563eb', // blue
  agricultural_land_occupation: '#4f46e5', // indigo
  urban_land_occupation: '#7c3aed', // violet
  natural_land_transformation: '#a21caf', // fuchsia
  water_depletion: '#c026d3', // magenta
  metal_depletion: '#db2777', // pink
  fossil_depletion: '#e11d48', // rose
};

export function EmbodiedImpactChart({
  facilityId,
  influxConfig,
  bucket,
  timeRange,
  metric,
  cumulative = false,
}: EmbodiedImpactChartProps) {
  const metricInfo = METRIC_INFO[metric];
  const title = cumulative
    ? `${metricInfo.title} (cumulative)`
    : `${metricInfo.title} (actual)`;
  const description = cumulative
    ? 'Cumulative embodied impact over time'
    : 'Embodied impact by period';

  return (
    <MultiFieldImpactChart
      title={title}
      description={description}
      influxConfig={influxConfig}
      bucket={bucket}
      measurement="facility_embodied"
      fields={[
        {
          field: metric,
          label: metricInfo.title,
          color: METRIC_COLORS[metric],
          aggregationFunction: 'sum',
        },
      ]}
      facilityId={facilityId}
      timeRange={timeRange}
      yAxisLabel={metricInfo.unit}
      defaultAggregation="sum"
      formatValue={(value) => value.toExponential(2)} // Use scientific notation for small values
      valueTransform={(value) => value} // Values are already in the correct unit
      cumulative={cumulative}
      disableAutoScaling={true} // Don't auto-scale these metrics
      facilityIdTag="id" // Embodied data uses 'id' tag instead of 'facility_id'
      useFieldAsMetric={true} // Embodied data uses metric name as _field
    />
  );
}
