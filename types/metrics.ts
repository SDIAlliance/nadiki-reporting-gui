export const METRIC_UNITS = [
  'W',
  'kW',
  'MW',
  'Wh',
  'kWh',
  'MWh',
  'W/s',
  'kW/s',
  'A',
  'V',
  'Hz',
  'C',
  'F',
  '%',
  'ratio',
  'count',
] as const;

export const METRIC_ENTITIES = [
  'Facility',
  'Server', 
  'Rack',
] as const;

export type MetricUnit = typeof METRIC_UNITS[number];
export type MetricEntity = typeof METRIC_ENTITIES[number];

export interface Metric {
  id: string;
  metric_name: string;
  unit: MetricUnit;
  entity: MetricEntity;
  created_at: string;
  updated_at: string;
}