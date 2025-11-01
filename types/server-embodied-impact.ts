export type ServerEmbodiedImpactMetric =
  | 'climate_change'
  | 'primary_energy_use'
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
  | 'abiotic_depletion_potential';

// Mapping of metrics to friendly titles and units based on API specification
export const SERVER_EMBODIED_METRIC_INFO: Record<ServerEmbodiedImpactMetric, { title: string; unit: string }> = {
  climate_change: {
    title: 'Climate Change',
    unit: 'kg CO2 eq',
  },
  primary_energy_use: {
    title: 'Primary Energy Use',
    unit: 'kWh',
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
    unit: 'm2a',
  },
  urban_land_occupation: {
    title: 'Urban Land Occupation',
    unit: 'm2a',
  },
  natural_land_transformation: {
    title: 'Natural Land Transformation',
    unit: 'm2',
  },
  abiotic_depletion_potential: {
    title: 'Abiotic Depletion Potential',
    unit: 'kgSbeq',
  },
};

// Color palette for different metrics (using chart colors)
export const SERVER_EMBODIED_METRIC_COLORS: Record<ServerEmbodiedImpactMetric, string> = {
  climate_change: '#2563eb', // blue
  primary_energy_use: '#10b981', // emerald
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
  abiotic_depletion_potential: '#db2777', // pink
};
