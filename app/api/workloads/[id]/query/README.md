# Workload Query API

## Endpoint

`GET /api/workloads/[id]/query`

## Description

Retrieves calculated workload metrics for a specific workload over a time range. This endpoint aggregates time-series data from InfluxDB and returns final calculated values (no time-series data).

## Query Parameters

- `from` (required): Unix timestamp (seconds) for the start of the time range
- `to` (required): Unix timestamp (seconds) for the end of the time range

## Example Request

```bash
GET /api/workloads/abc123-def456-ghi789/query?from=1704067200&to=1704153600
```

## Response Format

```json
{
  "averageCpuUtilization": 45.2341,
  "averageServerPowerForPod": 12.5678,
  "totalEnergyConsumptionForPod": 301.6272,
  "gridRenewablePercentageAverage": 55.23,
  "totalRenewableEnergyConsumption": 166.6183,
  "totalNonRenewableEnergyConsumption": 135.0089,
  "totalOperationalCo2Emissions": 89.2134,
  "facilityEmbodiedImpactsAttributable": {
    "climate_change": 0.0234,
    "ozone_depletion": 0.000012,
    "human_toxicity": 0.0456,
    "photochemical_oxidant_formation": 0.0089,
    "particulate_matter_formation": 0.0067,
    "ionizing_radiation": 0.0012,
    "terrestrial_acidification": 0.0023,
    "freshwater_eutrophication": 0.0045,
    "marine_eutrophication": 0.0078,
    "terrestrial_ecotoxicity": 0.0034,
    "freshwater_ecotoxicity": 0.0056,
    "marine_ecotoxicity": 0.0089,
    "agricultural_land_occupation": 0.0123,
    "urban_land_occupation": 0.0067,
    "natural_land_transformation": 0.0045,
    "water_depletion": 0.0234,
    "metal_depletion": 0.0156,
    "fossil_depletion": 0.0189
  },
  "serverEmbodiedImpactsAttributable": {
    "climate_change": 0.0567,
    "primary_energy_use": 0.0345,
    "ozone_depletion": 0.000023,
    "human_toxicity": 0.0678,
    "photochemical_oxidant_formation": 0.0123,
    "particulate_matter_formation": 0.0089,
    "ionizing_radiation": 0.0034,
    "terrestrial_acidification": 0.0045,
    "freshwater_eutrophication": 0.0067,
    "marine_eutrophication": 0.0089,
    "terrestrial_ecotoxicity": 0.0056,
    "freshwater_ecotoxicity": 0.0078,
    "marine_ecotoxicity": 0.0123,
    "agricultural_land_occupation": 0.0234,
    "urban_land_occupation": 0.0156,
    "natural_land_transformation": 0.0089,
    "abiotic_depletion_potential": 0.0234
  }
}
```

## Response Fields

### Operational Metrics

- `averageCpuUtilization` (number): Average CPU utilization for the pod as a percentage (0-100)
- `averageServerPowerForPod` (number): Average server power attributed to the pod in watts (W)
- `totalEnergyConsumptionForPod` (number): Total energy consumed by the pod in watt-hours (Wh)

### Renewable Energy Metrics

- `gridRenewablePercentageAverage` (number): Average percentage of renewable energy in the grid (0-100)
- `totalRenewableEnergyConsumption` (number): Total renewable energy consumed in watt-hours (Wh)
- `totalNonRenewableEnergyConsumption` (number): Total non-renewable energy consumed in watt-hours (Wh)

### Emissions

- `totalOperationalCo2Emissions` (number): Total operational CO2 emissions in grams CO2 equivalent (gCO2eq)

### Embodied Impacts

- `facilityEmbodiedImpactsAttributable` (object): Facility-level embodied impacts divided by the total number of servers
  - Each key is an impact category (e.g., `climate_change`, `water_depletion`)
  - Each value is the impact attributable to one server over the time period

- `serverEmbodiedImpactsAttributable` (object): Server-level embodied impacts multiplied by average CPU utilization
  - Each key is an impact category (e.g., `climate_change`, `primary_energy_use`)
  - Each value is the impact attributable to the workload over the time period

## Calculation Details

### Average CPU Utilization
Calculated by querying the `cpu_busy_fraction` field from InfluxDB, summing across all CPU cores, and averaging over the time range. Result is converted to percentage.

### Average Server Power for Pod
Calculated as: `server_energy_consumption_watts × (cpu_utilization / 100)`

### Total Energy Consumption for Pod
Calculated as: `averageServerPowerForPod × duration_hours`

### Grid Renewable Percentage
Averaged over the time range from the `grid_renewable_percentage` field.

### Renewable/Non-Renewable Split
- Renewable: `totalEnergyConsumptionForPod × (gridRenewablePercentageAverage / 100)`
- Non-Renewable: `totalEnergyConsumptionForPod - totalRenewableEnergyConsumption`

### Operational CO2 Emissions
Calculated as: `(totalNonRenewableEnergyConsumption / 1000) × grid_emission_factor_grams`

### Facility Embodied Impacts
For each impact category, the total facility embodied impact is summed over the time range and divided by the total number of servers in the facility.

### Server Embodied Impacts
For each impact category, the total server embodied impact is summed over the time range and multiplied by the average CPU utilization (as a fraction).

## Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required parameters",
  "details": "Both \"from\" and \"to\" query parameters (unix timestamps) are required"
}
```

### 404 Not Found
```json
{
  "error": "Workload not found",
  "details": "No workload found with ID: abc123-def456-ghi789"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to fetch server configuration",
  "details": "Server server-123 not found or API error"
}
```

## Dependencies

- Workload must exist in the database
- Server must have valid InfluxDB time-series configuration
- InfluxDB must contain data for the requested time range
- Facility must exist and have valid configuration
