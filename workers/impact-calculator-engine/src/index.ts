import { DurableObject, WorkerEntrypoint } from "cloudflare:workers";
import { FacilityResponse, FacilityTimeSeriesDataPoint } from 'registrar-api-client/types/facility-api'
import { InfluxDB, QueryApi, WriteApi, Point } from '@influxdata/influxdb-client';

// Define the metrics required for environmental impact calculation
const REQUIRED_METRICS: FacilityTimeSeriesDataPoint['field'][] = [
	'it_power_usage_level1_avg_watts',
	'it_power_usage_level2_avg_watts',
	'grid_transformers_avg_watts',
	'onsite_renewable_energy_avg_watts',
	'renewable_energy_certificates_watts',
	'grid_emission_factor_grams',
	'backup_emission_factor_grams',
	'pue_1_ratio',
	'pue_2_ratio',
	'total_generator_avg_watts',
	'generator_load_factor_ratio'
];

export class CalculatorService extends WorkerEntrypoint<Env> {
	// starting point should be a timestamp
	async createFacilityCalculator(
		facilityId: string, config: FacilityResponse, startingPoint: number = 0
	): Promise<void> {
		const id = this.env.IMPACT_CALCULATOR_ENGINE.idFromName(`facility-${facilityId}`);
		const stub = this.env.IMPACT_CALCULATOR_ENGINE.get(id);
		await stub.startFacilityCalculator(facilityId, config, startingPoint)
	}
}

/** A Durable Object's behavior is defined in an exported Javascript class */
export class CalculatorEngine extends DurableObject<Env> {
	private queryApi: QueryApi | null = null;
	private writeApi: WriteApi | null = null;
	private influxReadClient: InfluxDB | null = null;
	private influxWriteClient: InfluxDB | null = null;

	/**
	 * The constructor is invoked once upon creation of the Durable Object, i.e. the first call to
	 * 	`DurableObjectStub::get` for a given identifier (no-op constructors can be omitted)
	 *
	 * @param ctx - The interface for interacting with Durable Object state
	 * @param env - The interface to reference bindings declared in wrangler.jsonc
	 */
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
	}

	// starting point should be a timestamp
	async startFacilityCalculator(
		facilityId: string, config: FacilityResponse, startingPoint: number = 0
	): Promise<void> {
		await this.ctx.storage.put('entity', 'facility');
		await this.ctx.storage.put('id', facilityId);
		await this.ctx.storage.put('config', config);
		console.log('Starting facility calculator with', facilityId, startingPoint);

		// Initialize InfluxDB client using facility's time series config
		console.log('Starting influxDB client with', config.timeSeriesConfig)
		this.influxReadClient = new InfluxDB({
			// TODO: Replace with config value when issue is solved: https://github.com/SDIAlliance/dc-registrar-api/issues/5
			url: 'https://influxdb.svc.nadiki.work:8443',
			token: 'CHp-BPOdE1mvmH_z7o_QjwcJ5CzThgVXNcv60ib4Sq6n4dHR-O7wxFJ-1I8cfIhqYRanUpMFMnVFySJ1EhuVFw==',
		});
		this.influxWriteClient = new InfluxDB({
			// TODO: Replace with config value when issue is solved: https://github.com/SDIAlliance/dc-registrar-api/issues/5
			url: 'https://influxdb.svc.nadiki.work:8443',
			token: config.timeSeriesConfig.token,
		});
		
		this.queryApi = this.influxReadClient.getQueryApi('198d41261b534dfb');
		this.writeApi = this.influxWriteClient.getWriteApi('198d41261b534dfb', config.timeSeriesConfig.bucket);

		// Reset total_primary_energy_use counter to 0 by writing initial value
		console.log('Resetting total_primary_energy_use counter to 0');
		await this.writeValue(config, 'total_primary_energy_use', 0);

		// Perform initial calculation (with isInitial flag set to true)
		await this.performFacilityCalculation(facilityId, config, startingPoint, true);

		await this.ctx.storage.put('lastCalculation', {
			timestamp: Date.now(),
			facilityId,
			config,
			isInitial: false
		});

		// Set up alarm for recurring calculations every 15 minutes
		const currentAlarm = await this.ctx.storage.getAlarm();
		if (currentAlarm == null) {
			const nextAlarmTime = Date.now() + (15 * 60 * 1000); // 15 minutes from now
			await this.ctx.storage.setAlarm(nextAlarmTime);
			console.log(`Set alarm for next calculation at ${new Date(nextAlarmTime).toISOString()}`);
		}
	}

	/**
	 * Alarm handler - called every 15 minutes to perform recurring calculations
	 */
	async alarm(): Promise<void> {
		console.log('Alarm triggered - starting recurring calculation');
		
		try {
			// Retrieve stored configuration
			const facilityId = await this.ctx.storage.get<string>('id');
			const config = await this.ctx.storage.get<FacilityResponse>('config');
			const lastCalculation = await this.ctx.storage.get<{ timestamp: number; facilityId: string; config: FacilityResponse; isInitial: boolean }>('lastCalculation');
			
			if (!facilityId || !config) {
				console.error('Missing facility configuration for alarm calculation');
				return;
			}

			// Initialize InfluxDB clients if needed
			if (!this.influxReadClient || !this.queryApi || !this.writeApi) {
				this.influxReadClient = new InfluxDB({
					url: 'https://influxdb.svc.nadiki.work:8443',
					token: 'CHp-BPOdE1mvmH_z7o_QjwcJ5CzThgVXNcv60ib4Sq6n4dHR-O7wxFJ-1I8cfIhqYRanUpMFMnVFySJ1EhuVFw==',
				});
				this.influxWriteClient = new InfluxDB({
					url: 'https://influxdb.svc.nadiki.work:8443',
					token: config.timeSeriesConfig.token,
				});
				this.queryApi = this.influxReadClient.getQueryApi('198d41261b534dfb');
				this.writeApi = this.influxWriteClient.getWriteApi('198d41261b534dfb', config.timeSeriesConfig.bucket);
			}

			// Use last calculation timestamp as starting point for this calculation
			const startingPoint = lastCalculation?.timestamp || (Date.now() - (15 * 60 * 1000));
			
			// Perform the calculation
			await this.performFacilityCalculation(facilityId, config, startingPoint);
			
			// Update last calculation timestamp
			await this.ctx.storage.put('lastCalculation', {
				timestamp: Date.now(),
				facilityId,
				config,
				isInitial: false
			});

			// Schedule next alarm
			const nextAlarmTime = Date.now() + (15 * 60 * 1000);
			await this.ctx.storage.setAlarm(nextAlarmTime);
			console.log(`Set next alarm for ${new Date(nextAlarmTime).toISOString()}`);
			
		} catch (error) {
			console.error('Error in alarm calculation:', error);
			// Still schedule next alarm even if this one failed
			const nextAlarmTime = Date.now() + (15 * 60 * 1000);
			await this.ctx.storage.setAlarm(nextAlarmTime);
		}
	}

	/**
	 * Performs the core facility calculation logic
	 * @param facilityId - The facility ID
	 * @param config - The facility configuration
	 * @param startingPoint - The timestamp to start calculation from
	 * @param isInitial - Whether this is the initial calculation after reset
	 */
	private async performFacilityCalculation(
		facilityId: string, 
		config: FacilityResponse, 
		startingPoint: number,
		isInitial: boolean = false
	): Promise<void> {
		// Determine the time range for the calculation
		const now = Date.now();
		const startTime = startingPoint === 0 
			? now - (15 * 60 * 1000) // Last 15 minutes if startingPoint is 0
			: startingPoint;
		
		const timeRange = {
			start: new Date(startTime).toISOString(),
			stop: new Date(now).toISOString()
		};

		console.log(`Starting calculation for facility ${facilityId}`);
		console.log(`Time range: ${timeRange.start} to ${timeRange.stop}`);

		// Validate that required metrics have data available
		const missingMetrics: string[] = [];
		const availableMetrics: string[] = [];

		for (const metric of REQUIRED_METRICS) {
			const hasData = await this.validateMetric(config, metric, timeRange);
			if (hasData) {
				availableMetrics.push(metric);
			} else {
				missingMetrics.push(metric);
			}
		}

		console.log(`Available metrics: ${availableMetrics.join(', ')}`);
		console.log(`Missing metrics: ${missingMetrics.join(', ')}`);

		// Handle case when metrics are missing
		if (missingMetrics.length > 0) {
			// TODO: Implement fallback logic for missing metrics
			// For now, we'll continue with available metrics
			console.warn(`Some metrics are missing data: ${missingMetrics.join(', ')}`);
		}

		// Filter watts metrics from available metrics
		const wattsMetrics = availableMetrics.filter((metric): metric is FacilityTimeSeriesDataPoint['field'] => 
			metric.endsWith('_watts')
		);
		console.log(`Watts metrics to process: ${wattsMetrics.join(', ')}`);

		// Calculate total kWh for each watts metric
		const kWhResults: Record<string, number> = {};
		
		for (const metric of wattsMetrics) {
			const totalKWh = await this.calculateTotalKWhForMetric(config, metric, timeRange);
			kWhResults[metric] = totalKWh;
			console.log(`${metric}: ${totalKWh} kWh`);
		}

		// Calculate and write cumulative total_primary_energy_use from grid_transformers_avg_watts
		if (kWhResults['grid_transformers_avg_watts'] !== undefined) {
			const newPrimaryEnergyKWh = kWhResults['grid_transformers_avg_watts'];
			
			// For initial calculation, start from 0 (already written in startFacilityCalculator)
			// For subsequent calculations, read the last value
			const lastPrimaryEnergy = isInitial ? 0 : await this.readLastValue(config, 'total_primary_energy_use');
			const cumulativePrimaryEnergy = lastPrimaryEnergy + newPrimaryEnergyKWh;
			
			await this.writeValue(config, 'total_primary_energy_use', cumulativePrimaryEnergy);
			console.log(`Updated total_primary_energy_use: ${cumulativePrimaryEnergy} kWh (previous: ${lastPrimaryEnergy}, added: ${newPrimaryEnergyKWh})`);
		} else {
			console.warn('grid_transformers_avg_watts not available, cannot calculate total_primary_energy_use');
		}
	}

	/**
	 * Calculates total kWh for a specific watts metric over the given time range
	 * @param config - The facility configuration
	 * @param metric - The watts metric field name
	 * @param timeRange - The time range for calculation
	 * @returns Total kWh consumed over the period
	 */
	private async calculateTotalKWhForMetric(
		config: FacilityResponse, 
		metric: FacilityTimeSeriesDataPoint['field'], 
		timeRange: { start: string; stop: string }
	): Promise<number> {
		if (!this.queryApi) {
			console.error('QueryApi not initialized');
			return 0;
		}

		const bucket = config.timeSeriesConfig.bucket;
		const facilityId = config.id;
		const countryCode = config.countryCode;
		
		// Flux query to get all data points and aggregate by sum over time intervals
		const fluxQuery = `
			from(bucket: "${bucket}")
				|> range(start: ${timeRange.start}, stop: ${timeRange.stop})
				|> filter(fn: (r) => r._measurement == "facility")
				|> filter(fn: (r) => r._field == "${metric}")
				|> filter(fn: (r) => r.facility_id == "${facilityId}")
				|> filter(fn: (r) => r.country_code == "${countryCode}")
				|> aggregateWindow(every: 1m, fn: sum, createEmpty: true)
				|> yield(name: "sum")
		`;

		try {
			const dataPoints: Array<{ timestamp: Date; watts: number }> = [];
			
			// Execute query and collect data points
			await new Promise<void>((resolve, reject) => {
				this.queryApi!.queryRows(fluxQuery, {
					next(row: string[], tableMeta: { columns: Array<{ label: string }> }) {
						const timeIndex = tableMeta.columns.findIndex(col => col.label === '_time');
						const valueIndex = tableMeta.columns.findIndex(col => col.label === '_value');
						
						if (timeIndex >= 0 && valueIndex >= 0) {
							const timestamp = new Date(row[timeIndex]);
							const watts = parseFloat(row[valueIndex]) || 0;
							dataPoints.push({ timestamp, watts });
						}
					},
					error(error: Error) {
						console.error(`Error querying metric ${metric}:`, error);
						reject(error);
					},
					complete() {
						resolve();
					},
				});
			});

			// Convert watts to kWh and sum up total consumption
			// Formula: kWh = (watts * time_interval_in_hours) / 1000
			// Since we're using 1-minute intervals: hours = 1/60
			let totalKWh = 0;
			const timeIntervalHours = 1 / 60; // 1 minute in hours

			for (const dataPoint of dataPoints) {
				const kWh = (dataPoint.watts * timeIntervalHours) / 1000;
				totalKWh += kWh;
			}

			console.log(`Processed ${dataPoints.length} data points for ${metric}`);
			return totalKWh;
		} catch (error) {
			console.error(`Failed to calculate kWh for metric ${metric}:`, error);
			return 0;
		}
	}

	/**
	 * Reads the last value for a specific field from InfluxDB
	 * @param config - The facility configuration
	 * @param field - The field name to read
	 * @returns The last value or 0 if none exists
	 */
	private async readLastValue(
		config: FacilityResponse, 
		field: string
	): Promise<number> {
		if (!this.queryApi) {
			console.error('QueryApi not initialized');
			return 0;
		}

		const bucket = config.timeSeriesConfig.bucket;
		const facilityId = config.id;
		const countryCode = config.countryCode;
		
		const fluxQuery = `
			from(bucket: "${bucket}")
				|> range(start: -30d)
				|> filter(fn: (r) => r._measurement == "facility")
				|> filter(fn: (r) => r._field == "${field}")
				|> filter(fn: (r) => r.facility_id == "${facilityId}")
				|> filter(fn: (r) => r.country_code == "${countryCode}")
				|> last()
		`;

		try {
			let lastValue = 0;
			
			await new Promise<void>((resolve, reject) => {
				this.queryApi!.queryRows(fluxQuery, {
					next(row: string[], tableMeta: { columns: Array<{ label: string }> }) {
						const valueIndex = tableMeta.columns.findIndex(col => col.label === '_value');
						if (valueIndex >= 0) {
							lastValue = parseFloat(row[valueIndex]) || 0;
						}
					},
					error(error: Error) {
						console.error(`Error reading last value for ${field}:`, error);
						reject(error);
					},
					complete() {
						resolve();
					},
				});
			});

			console.log(`Last value for ${field}: ${lastValue}`);
			return lastValue;
		} catch (error) {
			console.error(`Failed to read last value for ${field}:`, error);
			return 0;
		}
	}

	/**
	 * Writes a value to InfluxDB for a specific field
	 * @param config - The facility configuration
	 * @param field - The field name to write
	 * @param value - The value to write
	 * @param timestamp - Optional timestamp (defaults to now)
	 */
	private async writeValue(
		config: FacilityResponse,
		field: string,
		value: number,
		timestamp: Date = new Date()
	): Promise<void> {
		if (!this.writeApi) {
			console.error('WriteApi not initialized');
			return;
		}

		const facilityId = config.id;
		const countryCode = config.countryCode;

		try {
			const point = new Point('facility')
				.tag('facility_id', facilityId)
				.tag('country_code', countryCode)
				.floatField(field, value)
				.timestamp(timestamp);

			this.writeApi.writePoint(point);
			await this.writeApi.flush();
			
			console.log(`Written ${field}: ${value} at ${timestamp.toISOString()}`);
		} catch (error) {
			console.error(`Failed to write ${field}:`, error);
		}
	}


	/**
	 * Validates if a specific metric has data available in InfluxDB for the given time range
	 * @param config - The facility configuration
	 * @param metric - The metric field name to validate
	 * @param timeRange - The time range to check for data
	 * @returns True if data exists, false otherwise
	 */
	private async validateMetric(
		config: FacilityResponse, 
		metric: FacilityTimeSeriesDataPoint['field'], 
		timeRange: { start: string; stop: string }
	): Promise<boolean> {
		if (!this.queryApi) {
			console.error('QueryApi not initialized');
			return false;
		}

		// Build Flux query to check if data exists for this metric
		const bucket = config.timeSeriesConfig.bucket;
		const facilityId = config.id;
		const countryCode = config.countryCode;
		
		const fluxQuery = `
			from(bucket: "${bucket}")
				|> range(start: ${timeRange.start}, stop: ${timeRange.stop})
				|> filter(fn: (r) => r._measurement == "facility")
				|> filter(fn: (r) => r._field == "${metric}")
				|> filter(fn: (r) => r.facility_id == "${facilityId}")
				|> filter(fn: (r) => r.country_code == "${countryCode}")
				|> count()
				|> limit(n: 1)
		`;

		// console.log("Flux Query", fluxQuery)

		try {
			let hasData = false;
			
			// Execute query and check if any data is returned
			await new Promise<void>((resolve, reject) => {
				this.queryApi!.queryRows(fluxQuery, {
					next(row: string[], tableMeta: { columns: Array<{ label: string }> }) {
						// If we get any row, it means data exists
						const countIndex = tableMeta.columns.findIndex((col: { label: string }) => col.label === '_value');
						if (countIndex >= 0 && parseInt(row[countIndex]) > 0) {
							hasData = true;
						}
					},
					error(error: Error) {
						console.error(`Error querying metric ${metric}:`, error);
						reject(error);
					},
					complete() {
						resolve();
					},
				});
			});

			return hasData;
		} catch (error) {
			console.error(`Failed to validate metric ${metric}:`, error);
			return false;
		}
	}
}

export default {
	/**
	 * This is the standard fetch handler for a Cloudflare Worker
	 *
	 * @param request - The request submitted to the Worker from the client
	 * @param env - The interface to reference bindings declared in wrangler.jsonc
	 * @param ctx - The execution context of the Worker
	 * @returns The response to be sent back to the client
	 */
	// async fetch(request, env): Promise<Response> {
	// 	// Create a `DurableObjectId` for an instance of the `MyDurableObject`
	// 	// class named "foo". Requests from all Workers to the instance named
	// 	// "foo" will go to a single globally unique Durable Object instance.
	// 	const id: DurableObjectId = env.IMPACT_CALCULATOR_ENGINE.idFromName("foo");

	// 	// Create a stub to open a communication channel with the Durable
	// 	// Object instance.
	// 	const stub = env.IMPACT_CALCULATOR_ENGINE.get(id);

	// 	// Call the `sayHello()` RPC method on the stub to invoke the method on
	// 	// the remote Durable Object instance
	// 	const greeting = await stub.sayHello("world");

	// 	return new Response(greeting);
	// },
} satisfies ExportedHandler<Env>;
