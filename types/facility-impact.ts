export const ENERGY_SOURCES = {
  GRID: 'grid',
  ONSITE_SOLAR: 'onsite_solar',
  ONSITE_WIND: 'onsite_wind',
  DIESEL_GENERATOR: 'diesel_generator',
  GAS_GENERATOR: 'gas_generator',
} as const;

export type EnergySource = typeof ENERGY_SOURCES[keyof typeof ENERGY_SOURCES];

export const ENERGY_SOURCE_LABELS: Record<EnergySource, string> = {
  [ENERGY_SOURCES.GRID]: 'Grid',
  [ENERGY_SOURCES.ONSITE_SOLAR]: 'On-site Solar',
  [ENERGY_SOURCES.ONSITE_WIND]: 'On-site Wind',
  [ENERGY_SOURCES.DIESEL_GENERATOR]: 'Diesel Generator',
  [ENERGY_SOURCES.GAS_GENERATOR]: 'Gas Generator',
};

export const IMPACT_CATEGORIES = {
  CLIMATE_CHANGE: 'climate_change',
  PRIMARY_ENERGY_USE: 'primary_energy_use',
  PRIMARY_NONRENEWABLE_ENERGY_USE: 'primary_nonrenewable_energy_use',
  PRIMARY_RENEWABLE_ENERGY_USE: 'primary_renewable_energy_use',
} as const;

export type ImpactCategory = typeof IMPACT_CATEGORIES[keyof typeof IMPACT_CATEGORIES];

export const IMPACT_CATEGORY_UNITS: Record<ImpactCategory, string> = {
  [IMPACT_CATEGORIES.CLIMATE_CHANGE]: 'kg CO2 eq',
  [IMPACT_CATEGORIES.PRIMARY_ENERGY_USE]: 'kWh',
  [IMPACT_CATEGORIES.PRIMARY_NONRENEWABLE_ENERGY_USE]: 'kWh',
  [IMPACT_CATEGORIES.PRIMARY_RENEWABLE_ENERGY_USE]: 'kWh',
};

export const IMPACT_CATEGORY_LABELS: Record<ImpactCategory, string> = {
  [IMPACT_CATEGORIES.CLIMATE_CHANGE]: 'Climate Change',
  [IMPACT_CATEGORIES.PRIMARY_ENERGY_USE]: 'Primary Energy Use',
  [IMPACT_CATEGORIES.PRIMARY_NONRENEWABLE_ENERGY_USE]: 'Primary Non-renewable Energy Use',
  [IMPACT_CATEGORIES.PRIMARY_RENEWABLE_ENERGY_USE]: 'Primary Renewable Energy Use',
};

export interface FacilityImpactMeasurement {
  time: string;
  facility_id: string;
  country_code: string;
  impact_category: ImpactCategory;
  energy_source: EnergySource;
  cumulative_impact: number;
  period_impact: number;
  emission_factor?: number;
}