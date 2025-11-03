import type {
  OpenAPIClient,
  Parameters,
  UnknownParamsObject,
  OperationResponse,
  AxiosRequestConfig,
} from 'openapi-client-axios';

declare namespace Components {
    namespace Schemas {
        export interface CPU {
            /**
             * CPU vendor (e.g., Intel, AMD)
             */
            vendor: string;
            /**
             * CPU type identifier
             */
            type: string;
            physical_core_count?: number;
        }
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
        export interface FPGA {
            /**
             * FPGA vendor (e.g., Intel, Xilinx)
             */
            vendor: string;
            /**
             * FPGA type identifier
             */
            type: string;
        }
        export interface GPU {
            /**
             * GPU vendor (e.g., Nvidia, AMD)
             */
            vendor: string;
            /**
             * GPU type identifier
             */
            type: string;
        }
        export interface ServerCreate {
            /**
             * ID of the facility where the server is located
             */
            facility_id: string;
            /**
             * ID of the rack where the server is installed
             */
            rack_id: string;
            impactAssessment?: ServerImpactAssessment;
            /**
             * Rated power in kW
             */
            rated_power?: number; // float
            /**
             * Total number of CPU sockets
             */
            total_cpu_sockets?: number;
            /**
             * Expected lifetime of the server hardware
             */
            exptected_lifetime: number;
            /**
             * Array of installed CPUs
             */
            installed_cpus?: CPU[];
            /**
             * Number of power supply units
             */
            number_of_psus?: number;
            /**
             * Total installed memory in GB
             */
            total_installed_memory?: number;
            /**
             * Number of memory units installed
             */
            number_of_memory_units?: number;
            /**
             * Array of installed storage devices
             */
            storage_devices?: StorageDevice[];
            /**
             * Array of installed GPUs
             */
            installed_gpus?: GPU[];
            /**
             * Array of installed FPGAs
             */
            installed_fpgas?: FPGA[];
            /**
             * LCA product passport data
             */
            product_passport?: {
                [key: string]: any;
            };
            /**
             * Type of cooling system used for this server
             */
            cooling_type: "direct-to-chip" | "immersion" | "back-door-liquid" | "back-door-fan" | "air";
            /**
             * Textual description ob the facility for informational purposes
             */
            description?: string;
        }
        export interface ServerImpactAssessment {
            /**
             * Climate change impact in kg CO2 eq. If left blank, will be retrieved from Boavizta API according to server specifications.
             */
            climate_change?: number; // float
            /**
             * Energy used to manufacture the server (kWh). If left blank, will be retrieved from Boavizta API according to server specifications.
             */
            primary_energy_use?: number; // float
            /**
             * Ozone depletion impact in kg CFC-11 eq. If left blank, will be retrieved from Boavizta API according to server specifications.
             */
            ozone_depletion?: number; // float
            /**
             * Human toxicity impact in kg 1,4-DB eq. If left blank, will be retrieved from Boavizta API according to server specifications.
             */
            human_toxicity?: number; // float
            /**
             * Photochemical oxidant formation impact in kg NMVOC. If left blank, will be retrieved from Boavizta API according to server specifications.
             */
            photochemical_oxidant_formation?: number; // float
            /**
             * Particulate matter formation impact in kg PM10 eq. If left blank, will be retrieved from Boavizta API according to server specifications.
             */
            particulate_matter_formation?: number; // float
            /**
             * Ionizing radiation impact in kg U235 eq. If left blank, will be retrieved from Boavizta API according to server specifications.
             */
            ionizing_radiation?: number; // float
            /**
             * Terrestrial acidification impact in kg SO2 eq. If left blank, will be retrieved from Boavizta API according to server specifications.
             */
            terrestrial_acidification?: number; // float
            /**
             * Freshwater eutrophication impact in kg P eq. If left blank, will be retrieved from Boavizta API according to server specifications.
             */
            freshwater_eutrophication?: number; // float
            /**
             * Marine eutrophication impact in kg N eq. If left blank, will be retrieved from Boavizta API according to server specifications.
             */
            marine_eutrophication?: number; // float
            /**
             * Terrestrial ecotoxicity impact in kg 1,4-DB eq. If left blank, will be retrieved from Boavizta API according to server specifications.
             */
            terrestrial_ecotoxicity?: number; // float
            /**
             * Freshwater ecotoxicity impact in kg 1,4-DB eq. If left blank, will be retrieved from Boavizta API according to server specifications.
             */
            freshwater_ecotoxicity?: number; // float
            /**
             * Marine ecotoxicity impact in kg 1,4-DB eq. If left blank, will be retrieved from Boavizta API according to server specifications.
             */
            marine_ecotoxicity?: number; // float
            /**
             * Agricultural land occupation impact in m2a. If left blank, will be retrieved from Boavizta API according to server specifications.
             */
            agricultural_land_occupation?: number; // float
            /**
             * Urban land occupation impact in m2a. If left blank, will be retrieved from Boavizta API according to server specifications.
             */
            urban_land_occupation?: number; // float
            /**
             * Natural land transformation impact in m2. If left blank, will be retrieved from Boavizta API according to server specifications.
             */
            natural_land_transformation?: number; // float
            /**
             * Resource depletion in kgSbeq. If left blank, will be retrieved from Boavizta API according to server specifications.
             */
            abiotic_depletion_potential?: number; // float
        }
        export interface ServerResponse {
            /**
             * ID of the facility where the server is located
             */
            facility_id: string;
            /**
             * ID of the rack where the server is installed
             */
            rack_id: string;
            impactAssessment?: ServerImpactAssessment;
            /**
             * Rated power in kW
             */
            rated_power?: number; // float
            /**
             * Total number of CPU sockets
             */
            total_cpu_sockets?: number;
            /**
             * Expected lifetime of the server hardware
             */
            exptected_lifetime: number;
            /**
             * Array of installed CPUs
             */
            installed_cpus?: CPU[];
            /**
             * Number of power supply units
             */
            number_of_psus?: number;
            /**
             * Total installed memory in GB
             */
            total_installed_memory?: number;
            /**
             * Number of memory units installed
             */
            number_of_memory_units?: number;
            /**
             * Array of installed storage devices
             */
            storage_devices?: StorageDevice[];
            /**
             * Array of installed GPUs
             */
            installed_gpus?: GPU[];
            /**
             * Array of installed FPGAs
             */
            installed_fpgas?: FPGA[];
            /**
             * LCA product passport data
             */
            product_passport?: {
                [key: string]: any;
            };
            /**
             * Type of cooling system used for this server
             */
            cooling_type: "direct-to-chip" | "immersion" | "back-door-liquid" | "back-door-fan" | "air";
            /**
             * Textual description ob the facility for informational purposes
             */
            description?: string;
            /**
             * Unique server identifier (format SERVER-[FACILITY_ID]-[RACK_ID]-[SERVER_ID])
             * example:
             * SERVER-FACILITY-NLD-001-RACK-001-001
             */
            id: string;
            timeSeriesConfig: ServerTimeSeriesConfig;
            boavizta_response?: {
                [key: string]: any;
            };
            createdAt?: string; // date-time
            updatedAt?: string; // date-time
        }
        export interface ServerTimeSeriesConfig {
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
            dataPoints: ServerTimeSeriesDataPoint[];
        }
        export interface ServerTimeSeriesDataPoint {
            /**
             * Name of the Influx measurement
             */
            measurement: "facility" | "rack" | "server";
            /**
             * Metric name with unit suffix
             */
            field: string; // /^(cpu_energy_consumption_joules|server_energy_consumption_joules)$/
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
                 * Rack identifier
                 */
                rack_id: string;
                /**
                 * Server identifier (format SERVER-[FACILITY_ID]-[RACK_ID]-[SERVER_ID])
                 */
                server_id: string;
                /**
                 * ISO 3166-1 alpha-3 country code
                 */
                country_code: string;
            };
        }
        export interface ServerUpdate {
            /**
             * ID of the facility where the server is located
             */
            facility_id: string;
            /**
             * ID of the rack where the server is installed
             */
            rack_id: string;
            impactAssessment?: ServerImpactAssessment;
            /**
             * Rated power in kW
             */
            rated_power?: number; // float
            /**
             * Total number of CPU sockets
             */
            total_cpu_sockets?: number;
            /**
             * Expected lifetime of the server hardware
             */
            exptected_lifetime: number;
            /**
             * Array of installed CPUs
             */
            installed_cpus?: CPU[];
            /**
             * Number of power supply units
             */
            number_of_psus?: number;
            /**
             * Total installed memory in GB
             */
            total_installed_memory?: number;
            /**
             * Number of memory units installed
             */
            number_of_memory_units?: number;
            /**
             * Array of installed storage devices
             */
            storage_devices?: StorageDevice[];
            /**
             * Array of installed GPUs
             */
            installed_gpus?: GPU[];
            /**
             * Array of installed FPGAs
             */
            installed_fpgas?: FPGA[];
            /**
             * LCA product passport data
             */
            product_passport?: {
                [key: string]: any;
            };
            /**
             * Type of cooling system used for this server
             */
            cooling_type: "direct-to-chip" | "immersion" | "back-door-liquid" | "back-door-fan" | "air";
            /**
             * Textual description ob the facility for informational purposes
             */
            description?: string;
        }
        export interface StorageDevice {
            /**
             * Disk vendor (e.g., Samsung, Intel)
             */
            vendor: string;
            /**
             * Disk capacity in TB
             */
            capacity: number; // float
            /**
             * Type of storage device
             */
            type: "NVMe" | "SSD" | "HDD" | "Other";
        }
    }
}
declare namespace Paths {
    namespace CreateServer {
        export type RequestBody = Components.Schemas.ServerCreate;
        namespace Responses {
            export type $201 = Components.Schemas.ServerResponse;
            export type $400 = Components.Schemas.Error;
        }
    }
    namespace DeleteServer {
        namespace Responses {
            export interface $204 {
            }
            export type $404 = Components.Schemas.Error;
        }
    }
    namespace GetServer {
        namespace Responses {
            export type $200 = Components.Schemas.ServerResponse;
            export type $404 = Components.Schemas.Error;
        }
    }
    namespace ListServers {
        namespace Parameters {
            export type FacilityId = string;
            export type Limit = number;
            export type Offset = number;
            export type RackId = string;
        }
        export interface QueryParameters {
            limit?: Parameters.Limit;
            offset?: Parameters.Offset;
            facility_id?: Parameters.FacilityId;
            rack_id?: Parameters.RackId;
        }
        namespace Responses {
            export interface $200 {
                items?: Components.Schemas.ServerResponse[];
                /**
                 * Total number of servers
                 */
                total?: number;
                /**
                 * Number of servers per page
                 */
                limit?: number;
                /**
                 * Current offset
                 */
                offset?: number;
            }
        }
    }
    namespace Servers$ServerId {
        namespace Parameters {
            export type ServerId = string;
        }
        export interface PathParameters {
            serverId: Parameters.ServerId;
        }
    }
    namespace UpdateServer {
        export type RequestBody = Components.Schemas.ServerUpdate;
        namespace Responses {
            export type $200 = Components.Schemas.ServerResponse;
            export type $400 = Components.Schemas.Error;
            export type $404 = Components.Schemas.Error;
        }
    }
}


export interface OperationMethods {
  /**
   * listServers - List all servers
   * 
   * Retrieve a list of all registered servers
   */
  'listServers'(
    parameters?: Parameters<Paths.ListServers.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.ListServers.Responses.$200>
  /**
   * createServer - Register a new server
   * 
   * Create a new server entry in the registry
   */
  'createServer'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: Paths.CreateServer.RequestBody,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.CreateServer.Responses.$201>
  /**
   * getServer - Get server details
   * 
   * Retrieve detailed information about a specific server
   */
  'getServer'(
    parameters?: Parameters<Paths.Servers$ServerId.PathParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.GetServer.Responses.$200>
  /**
   * updateServer - Update server
   * 
   * Update all server information
   */
  'updateServer'(
    parameters?: Parameters<Paths.Servers$ServerId.PathParameters> | null,
    data?: Paths.UpdateServer.RequestBody,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.UpdateServer.Responses.$200>
  /**
   * deleteServer - Delete server
   * 
   * Remove a server from the registry
   */
  'deleteServer'(
    parameters?: Parameters<Paths.Servers$ServerId.PathParameters> | null,
    data?: any,
    config?: AxiosRequestConfig  
  ): OperationResponse<Paths.DeleteServer.Responses.$204>
}

export interface PathsDictionary {
  ['/servers']: {
    /**
     * createServer - Register a new server
     * 
     * Create a new server entry in the registry
     */
    'post'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: Paths.CreateServer.RequestBody,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.CreateServer.Responses.$201>
    /**
     * listServers - List all servers
     * 
     * Retrieve a list of all registered servers
     */
    'get'(
      parameters?: Parameters<Paths.ListServers.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.ListServers.Responses.$200>
  }
  ['/servers/{serverId}']: {
    /**
     * getServer - Get server details
     * 
     * Retrieve detailed information about a specific server
     */
    'get'(
      parameters?: Parameters<Paths.Servers$ServerId.PathParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.GetServer.Responses.$200>
    /**
     * updateServer - Update server
     * 
     * Update all server information
     */
    'put'(
      parameters?: Parameters<Paths.Servers$ServerId.PathParameters> | null,
      data?: Paths.UpdateServer.RequestBody,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.UpdateServer.Responses.$200>
    /**
     * deleteServer - Delete server
     * 
     * Remove a server from the registry
     */
    'delete'(
      parameters?: Parameters<Paths.Servers$ServerId.PathParameters> | null,
      data?: any,
      config?: AxiosRequestConfig  
    ): OperationResponse<Paths.DeleteServer.Responses.$204>
  }
}

export type Client = OpenAPIClient<OperationMethods, PathsDictionary>


export type CPU = Components.Schemas.CPU;
export type Error = Components.Schemas.Error;
export type FPGA = Components.Schemas.FPGA;
export type GPU = Components.Schemas.GPU;
export type ServerCreate = Components.Schemas.ServerCreate;
export type ServerImpactAssessment = Components.Schemas.ServerImpactAssessment;
export type ServerResponse = Components.Schemas.ServerResponse;
export type ServerTimeSeriesConfig = Components.Schemas.ServerTimeSeriesConfig;
export type ServerTimeSeriesDataPoint = Components.Schemas.ServerTimeSeriesDataPoint;
export type ServerUpdate = Components.Schemas.ServerUpdate;
export type StorageDevice = Components.Schemas.StorageDevice;
