import "interpolate"
import "array"
import "http/requests"
import "experimental/json"
import "array"

output_bucket = "FACILITY-NLD-012"
output_measure = "facility"
output_field = "grid_emission_factor_grams"
country_code = "NLD"
facility_id = "FACILITY-NLD-012"
org_name = "Leitmotiv"

option task = { 
  name: "FETCH-GRID-EMISSIONS-NLD-012",
  every: 1h,
}

response = requests.get(url: "https://api.electricitymaps.com/v3/carbon-intensity/latest?zone=NL", 
    headers: ["auth-token": "dBFKwYexCX5xu"]
)

// api.agify.io returns JSON with the form
//
// {
//    name: string,
//    age: number,
//    count: number,
// }
//
// Define a data variable that parses the JSON response body into a Flux record.
data = json.parse(data: response.body)
result = array.from(rows: [{
    _value: data.carbonIntensity, 
    _time: data.datetime, 
    _field: output_field,
    _measurement: output_measure,
    country_code: country_code,
    facility_id: facility_id
    is_estmated: data.isEstimated, 
    emission_factor_type: data.emissionFactorType, 
    temporal_granularity: data.temporalGranularity
}])

result 
    |> to(
        bucket: output_bucket
    )


