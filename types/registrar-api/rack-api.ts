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
        export interface RackCreate {
            /**
             * ID of the facility where the rack is located
             */
            facility_id: string;
            /**
             * Total available power in kW
             */
            total_available_power?: number; // float
            /**
             * Total available cooling capacity in kW
             */
            total_available_cooling_capacity?: number; // float
            /**
             * Number of PDUs in the rack
             */
            number_of_pdus?: number;
            /**
             * Number of power feeds used for redundancy
             */
            power_redundancy?: number;
            /**
             * LCA product passport data
             */
            product_passport?: {
                [key: string]: any;
            };
            /**
             * Textual description ob the facility for informational purposes
             */
            description?: string;
        }
        export interface RackResponse {
            /**
             * ID of the facility where the rack is located
             */
            facility_id: string;
            /**
             * Total available power in kW
             */
            total_available_power?: number; // float
            /**
             * Total available cooling capacity in kW
             */
            total_available_cooling_capacity?: number; // float
            /**
             * Number of PDUs in the rack
             */
            number_of_pdus?: number;
            /**
             * Number of power feeds used for redundancy
             */
            power_redundancy?: number;
            /**
             * LCA product passport data
             */
            product_passport?: {
                [key: string]: any;
            };
            /**
             * Textual description ob the facility for informational purposes
             */
            description?: string;
            /**
             * Unique rack identifier (format RACK-[FACILITY_ID]-[RACK_ID])
             * example:
             * RACK-FACILITY-NLD-001-001
             */
            id: string;
            timeSeriesConfig: RackTimeSeriesConfig;
            createdAt?: string; // date-time
            updatedAt?: string; // date-time
        }
        export interface RackTimeSeriesConfig {
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
            dataPoints: RackTimeSeriesDataPoint[];
        }
        export interface RackTimeSeriesDataPoint {
            /**
             * Name of the Influx measurement
             */
            measurement: "facility" | "rack" | "server";
            /**
             * Prometheus metric name with unit suffix. For PDU metrics,
             * the name must follow the pattern 'pdu_N_energy_consumption_joules'
             * where N is the PDU number (1 to number_of_pdus)
             *
             */
            field: string; // /^(pdu_[1-9][0-9]*_energy_consumption_joules|inlet_temperature_celsius|outlet_temperature_celsius)$/
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
                 * Rack identifier (format RACK-[FACILITY_ID]-[RACK_ID])
                 */
                rack_id: string;
                /**
                 * ISO 3166-1 alpha-3 country code
                 */
                country_code: string;
            };
        }
        export interface RackUpdate {
            /**
             * ID of the facility where the rack is located
             */
            facility_id: string;
            /**
             * Total available power in kW
             */
            total_available_power?: number; // float
            /**
             * Total available cooling capacity in kW
             */
            total_available_cooling_capacity?: number; // float
            /**
             * Number of PDUs in the rack
             */
            number_of_pdus?: number;
            /**
             * Number of power feeds used for redundancy
             */
            power_redundancy?: number;
            /**
             * LCA product passport data
             */
            product_passport?: {
                [key: string]: any;
            };
            /**
             * Textual description ob the facility for informational purposes
             */
            description?: string;
        }
    }
}
declare namespace Paths {
    namespace CreateRack {
        export type RequestBody = Components.Schemas.RackCreate;
        namespace Responses {
            export type $201 = Components.Schemas.RackResponse;
            export type $400 = Components.Schemas.Error;
        }
    }
    namespace DeleteRack {
        namespace Responses {
            export interface $204 {
            }
            export type $404 = Components.Schemas.Error;
        }
    }
    namespace GetRack {
        namespace Responses {
            export type $200 = Components.Schemas.RackResponse;
            export type $404 = Components.Schemas.Error;
        }
    }
    namespace ListRacks {
        namespace Parameters {
            export type FacilityId = string;
            export type Limit = number;
            export type Offset = number;
        }
        export interface QueryParameters {
            limit?: Parameters.Limit;
            offset?: Parameters.Offset;
            facility_id?: Parameters.FacilityId;
        }
        namespace Responses {
            export interface $200 {
                items?: Components.Schemas.RackResponse[];
                /**
                 * Total number of racks
                 */
                total?: number;
                /**
                 * Number of racks per page
                 */
                limit?: number;
                /**
                 * Current offset
                 */
                offset?: number;
            }
        }
    }
    namespace Racks$RackId {
        namespace Parameters {
            export type RackId = string;
        }
        export interface PathParameters {
            rackId: Parameters.RackId;
        }
    }
    namespace UpdateRack {
        export type RequestBody = Components.Schemas.RackUpdate;
        namespace Responses {
            export type $200 = Components.Schemas.RackResponse;
            export type $400 = Components.Schemas.Error;
            export type $404 = Components.Schemas.Error;
        }
    }
}


export interface OperationMethods {
  /**
   * listRacks - List all racks
   * 
   * Retrieve a list of all registered racks
   */
  'listRacks'(
    parameters?: Parameters<Paths.ListRacks.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.ListRacks.Responses.$200>
  /**
   * createRack - Register a new rack
   * 
   * Create a new rack entry in the registry
   */
  'createRack'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: Paths.CreateRack.RequestBody,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.CreateRack.Responses.$201>
  /**
   * getRack - Get rack details
   * 
   * Retrieve detailed information about a specific rack
   */
  'getRack'(
    parameters?: Parameters<Paths.Racks$RackId.PathParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.GetRack.Responses.$200>
  /**
   * updateRack - Update rack
   * 
   * Update all rack information
   */
  'updateRack'(
    parameters?: Parameters<Paths.Racks$RackId.PathParameters> | null,
    data?: Paths.UpdateRack.RequestBody,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.UpdateRack.Responses.$200>
  /**
   * deleteRack - Delete rack
   * 
   * Remove a rack from the registry
   */
  'deleteRack'(
    parameters?: Parameters<Paths.Racks$RackId.PathParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.DeleteRack.Responses.$204>
}

export interface PathsDictionary {
  ['/racks']: {
    /**
     * createRack - Register a new rack
     * 
     * Create a new rack entry in the registry
     */
    'post'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: Paths.CreateRack.RequestBody,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.CreateRack.Responses.$201>
    /**
     * listRacks - List all racks
     * 
     * Retrieve a list of all registered racks
     */
    'get'(
      parameters?: Parameters<Paths.ListRacks.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.ListRacks.Responses.$200>
  }
  ['/racks/{rackId}']: {
    /**
     * getRack - Get rack details
     * 
     * Retrieve detailed information about a specific rack
     */
    'get'(
      parameters?: Parameters<Paths.Racks$RackId.PathParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.GetRack.Responses.$200>
    /**
     * updateRack - Update rack
     * 
     * Update all rack information
     */
    'put'(
      parameters?: Parameters<Paths.Racks$RackId.PathParameters> | null,
      data?: Paths.UpdateRack.RequestBody,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.UpdateRack.Responses.$200>
    /**
     * deleteRack - Delete rack
     * 
     * Remove a rack from the registry
     */
    'delete'(
      parameters?: Parameters<Paths.Racks$RackId.PathParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.DeleteRack.Responses.$204>
  }
}

export type Client = OpenAPIClient<OperationMethods, PathsDictionary>


export type Error = Components.Schemas.Error;
export type RackCreate = Components.Schemas.RackCreate;
export type RackResponse = Components.Schemas.RackResponse;
export type RackTimeSeriesConfig = Components.Schemas.RackTimeSeriesConfig;
export type RackTimeSeriesDataPoint = Components.Schemas.RackTimeSeriesDataPoint;
export type RackUpdate = Components.Schemas.RackUpdate;
