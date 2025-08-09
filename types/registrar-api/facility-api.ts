/* eslint-disable */
import type {
  OpenAPIClient,
  Parameters,
  UnknownParamsObject,
  OperationResponse,
  AxiosRequestConfig,
} from 'openapi-client-axios';

declare namespace Components {
    namespace Schemas {
        export interface Error {
            /**
             * Error code
             */
            code: string;
            /**
             * Error message
             */
            message: string;
            /**
             * Additional error details
             */
            details?: {
                [key: string]: any;
            };
        }
        export interface FacilityCreate {
            location: Location;
            /**
             * Embodied carbon emissions from facility construction (CO2-eq)
             */
            embeddedGhgEmissionsFacility?: number; // float
            /**
             * Expected lifetime of the facility in years
             */
            lifetimeFacility?: number;
            /**
             * Sum of GHG emissions embodied in assets
             */
            embeddedGhgEmissionsAssets?: number; // float
            /**
             * Expected average lifetime of assets in years
             */
            lifetimeAssets?: number;
            coolingFluids?: {
                /**
                 * Type identifier for the cooling fluid
                 */
                type: string;
                /**
                 * Amount of cooling fluid (kg or m3)
                 */
                amount: number; // float
                /**
                 * Global Warming Potential factor for this fluid type
                 */
                gwpFactor?: number; // float
            }[];
            /**
             * Annual maintenance runtime hours for generators
             */
            maintenanceHoursGenerator?: number; // float
            /**
             * Installed/rated power capacity (kW)
             */
            installedCapacity?: number; // float
            /**
             * Number of physical power feeds
             */
            gridPowerFeeds?: number;
            /**
             * Design Power Usage Effectiveness
             */
            designPue?: number; // float
            /**
             * Certified/rated tier level
             */
            tierLevel?: 1 | 2 | 3 | 4;
            /**
             * Number of floors used for white space
             */
            whiteSpaceFloors?: number;
            /**
             * Total facility space (m2)
             */
            totalSpace?: number; // float
            /**
             * Total white space (m2)
             */
            whiteSpace?: number; // float
            /**
             * Textual description ob the facility for informational purposes
             */
            description?: string;
        }
        export interface FacilityResponse {
            location: Location;
            /**
             * Embodied carbon emissions from facility construction (CO2-eq)
             */
            embeddedGhgEmissionsFacility?: number; // float
            /**
             * Expected lifetime of the facility in years
             */
            lifetimeFacility?: number;
            /**
             * Sum of GHG emissions embodied in assets
             */
            embeddedGhgEmissionsAssets?: number; // float
            /**
             * Expected average lifetime of assets in years
             */
            lifetimeAssets?: number;
            coolingFluids?: {
                /**
                 * Type identifier for the cooling fluid
                 */
                type: string;
                /**
                 * Amount of cooling fluid (kg or m3)
                 */
                amount: number; // float
                /**
                 * Global Warming Potential factor for this fluid type
                 */
                gwpFactor?: number; // float
            }[];
            /**
             * Annual maintenance runtime hours for generators
             */
            maintenanceHoursGenerator?: number; // float
            /**
             * Installed/rated power capacity (watts)
             */
            installedCapacity?: number; // float
            /**
             * Number of physical power feeds
             */
            gridPowerFeeds?: number;
            /**
             * Design Power Usage Effectiveness
             */
            designPue?: number; // float
            /**
             * Certified/rated tier level
             */
            tierLevel?: 1 | 2 | 3 | 4;
            /**
             * Number of floors used for white space
             */
            whiteSpaceFloors?: number;
            /**
             * Total facility space (m2)
             */
            totalSpace?: number; // float
            /**
             * Total white space (m2)
             */
            whiteSpace?: number; // float
            /**
             * Textual description ob the facility for informational purposes
             */
            description?: string;
            /**
             * Unique facility identifier (format FACILITY-[COUNTRY_CODE]-ID)
             * example:
             * FACILITY-NLD-001
             */
            id: string;
            /**
             * ISO 3166-1 alpha-3 country code derived from location
             * example:
             * NLD
             */
            countryCode: string;
            timeSeriesConfig: FacilityTimeSeriesConfig;
            createdAt?: string; // date-time
            updatedAt?: string; // date-time
        }
        export interface FacilityTimeSeriesConfig {
            /**
             * InfluxDB endpoint URL with port number
             * example:
             * https://timeseries.registry.example.com:8086
             */
            endpoint: string;
            /**
             * InfluxDB organization to use
             * example:
             * leitmotiv
             */
            org: string;
            /**
             * InfluxDB bucket to send data to
             * example:
             * my-bucket
             */
            bucket: string;
            /**
             * InfluxDB token to use for authentication
             * example:
             * ABCDEFGHIJK
             */
            token: string;
            /**
             * List of time series metrics available for streaming
             */
            dataPoints: FacilityTimeSeriesDataPoint[];
        }
        export interface FacilityTimeSeriesDataPoint {
            /**
             * Name of the Influx measurement
             */
            measurement: "facility" | "rack" | "server";
            /**
             * Metric name with unit suffix
             */
            field: "heatpump_power_consumption_joules" | "office_energy_use_joules" | "dc_water_usage_cubic_meters" | "office_water_usage_cubic_meters" | "total_generator_energy_joules" | "generator_load_factor_ratio" | "grid_transformers_energy_joules" | "onsite_renewable_energy_joules" | "it_power_usage_level1_joules" | "it_power_usage_level2_joules" | "renewable_energy_certificates_joules" | "grid_emission_factor_grams" | "backup_emission_factor_grams" | "electricity_source" | "pue_1_ratio" | "pue_2_ratio";
            /**
             * Time series data granularity in seconds
             */
            granularitySeconds: number;
            tags: {
                /**
                 * Facility identifier
                 */
                facility_id: string;
                /**
                 * ISO 3166-1 alpha-3 country code
                 */
                country_code: string;
            };
        }
        export interface FacilityUpdate {
            location: Location;
            /**
             * Embodied carbon emissions from facility construction (CO2-eq)
             */
            embeddedGhgEmissionsFacility?: number; // float
            /**
             * Expected lifetime of the facility in years
             */
            lifetimeFacility?: number;
            /**
             * Sum of GHG emissions embodied in assets
             */
            embeddedGhgEmissionsAssets?: number; // float
            /**
             * Expected average lifetime of assets in years
             */
            lifetimeAssets?: number;
            coolingFluids?: {
                /**
                 * Type identifier for the cooling fluid
                 */
                type: string;
                /**
                 * Amount of cooling fluid (kg or m3)
                 */
                amount: number; // float
                /**
                 * Global Warming Potential factor for this fluid type
                 */
                gwpFactor?: number; // float
            }[];
            /**
             * Annual maintenance runtime hours for generators
             */
            maintenanceHoursGenerator?: number; // float
            /**
             * Installed/rated power capacity (watts)
             */
            installedCapacity?: number; // float
            /**
             * Number of physical power feeds
             */
            gridPowerFeeds?: number;
            /**
             * Design Power Usage Effectiveness
             */
            designPue?: number; // float
            /**
             * Certified/rated tier level
             */
            tierLevel?: 1 | 2 | 3 | 4;
            /**
             * Number of floors used for white space
             */
            whiteSpaceFloors?: number;
            /**
             * Total facility space (m2)
             */
            totalSpace?: number; // float
            /**
             * Total white space (m2)
             */
            whiteSpace?: number; // float
            /**
             * Textual description ob the facility for informational purposes
             */
            description?: string;
        }
        export interface Location {
            /**
             * Latitude coordinate of the facility
             */
            latitude: number; // float
            /**
             * Longitude coordinate of the facility
             */
            longitude: number; // float
        }
    }
}
declare namespace Paths {
    namespace CreateFacility {
        export type RequestBody = Components.Schemas.FacilityCreate;
        namespace Responses {
            export type $201 = Components.Schemas.FacilityResponse;
            export type $400 = Components.Schemas.Error;
        }
    }
    namespace DeleteFacility {
        namespace Responses {
            export interface $204 {
            }
            export type $404 = Components.Schemas.Error;
        }
    }
    namespace Facilities$FacilityId {
        namespace Parameters {
            export type FacilityId = string;
        }
        export interface PathParameters {
            facilityId: Parameters.FacilityId;
        }
    }
    namespace GetFacility {
        namespace Responses {
            export type $200 = Components.Schemas.FacilityResponse;
            export type $404 = Components.Schemas.Error;
        }
    }
    namespace ListFacilities {
        namespace Parameters {
            export type Limit = number;
            export type Offset = number;
        }
        export interface QueryParameters {
            limit?: Parameters.Limit;
            offset?: Parameters.Offset;
        }
        namespace Responses {
            export interface $200 {
                items?: Components.Schemas.FacilityResponse[];
                /**
                 * Total number of facilities
                 */
                total?: number;
                /**
                 * Number of facilities per page
                 */
                limit?: number;
                /**
                 * Current offset
                 */
                offset?: number;
            }
        }
    }
    namespace UpdateFacility {
        export type RequestBody = Components.Schemas.FacilityUpdate;
        namespace Responses {
            export type $200 = Components.Schemas.FacilityResponse;
            export type $400 = Components.Schemas.Error;
            export type $404 = Components.Schemas.Error;
        }
    }
}


export interface OperationMethods {
  /**
   * listFacilities - List all facilities
   * 
   * Retrieve a list of all registered facilities
   */
  'listFacilities'(
    parameters?: Parameters<Paths.ListFacilities.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.ListFacilities.Responses.$200>
  /**
   * createFacility - Register a new facility
   * 
   * Create a new facility entry in the registry
   */
  'createFacility'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: Paths.CreateFacility.RequestBody,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.CreateFacility.Responses.$201>
  /**
   * getFacility - Get facility details
   * 
   * Retrieve detailed information about a specific facility
   */
  'getFacility'(
    parameters?: Parameters<Paths.Facilities$FacilityId.PathParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.GetFacility.Responses.$200>
  /**
   * updateFacility - Update facility
   * 
   * Update all facility information
   */
  'updateFacility'(
    parameters?: Parameters<Paths.Facilities$FacilityId.PathParameters> | null,
    data?: Paths.UpdateFacility.RequestBody,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.UpdateFacility.Responses.$200>
  /**
   * deleteFacility - Delete facility
   * 
   * Remove a facility from the registry
   */
  'deleteFacility'(
    parameters?: Parameters<Paths.Facilities$FacilityId.PathParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.DeleteFacility.Responses.$204>
}

export interface PathsDictionary {
  ['/facilities']: {
    /**
     * createFacility - Register a new facility
     * 
     * Create a new facility entry in the registry
     */
    'post'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: Paths.CreateFacility.RequestBody,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.CreateFacility.Responses.$201>
    /**
     * listFacilities - List all facilities
     * 
     * Retrieve a list of all registered facilities
     */
    'get'(
      parameters?: Parameters<Paths.ListFacilities.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.ListFacilities.Responses.$200>
  }
  ['/facilities/{facilityId}']: {
    /**
     * getFacility - Get facility details
     * 
     * Retrieve detailed information about a specific facility
     */
    'get'(
      parameters?: Parameters<Paths.Facilities$FacilityId.PathParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.GetFacility.Responses.$200>
    /**
     * updateFacility - Update facility
     * 
     * Update all facility information
     */
    'put'(
      parameters?: Parameters<Paths.Facilities$FacilityId.PathParameters> | null,
      data?: Paths.UpdateFacility.RequestBody,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.UpdateFacility.Responses.$200>
    /**
     * deleteFacility - Delete facility
     * 
     * Remove a facility from the registry
     */
    'delete'(
      parameters?: Parameters<Paths.Facilities$FacilityId.PathParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.DeleteFacility.Responses.$204>
  }
}

export type Client = OpenAPIClient<OperationMethods, PathsDictionary>


export type Error = Components.Schemas.Error;
export type FacilityCreate = Components.Schemas.FacilityCreate;
export type FacilityResponse = Components.Schemas.FacilityResponse;
export type FacilityTimeSeriesConfig = Components.Schemas.FacilityTimeSeriesConfig;
export type FacilityTimeSeriesDataPoint = Components.Schemas.FacilityTimeSeriesDataPoint;
export type FacilityUpdate = Components.Schemas.FacilityUpdate;
export type Location = Components.Schemas.Location;
