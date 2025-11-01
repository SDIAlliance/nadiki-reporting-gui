'use client';

import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ServerResponse, Components } from '@/packages/registrar-api-client/types/server-api';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ServerDetailPage() {
  const params = useParams();
  const facilityId = params.facilityId as string;
  const serverId = params.serverId as string;

  // Fetch server data
  const { data: server, error, isLoading } = useSWR<ServerResponse>(
    `/api/servers/${serverId}`,
    fetcher
  );

  // Debug: log the server data
  if (server) {
    console.log('Server data:', server);
    console.log('Installed CPUs:', server.installed_cpus);
    console.log('Installed GPUs:', server.installed_gpus);
    console.log('Installed FPGAs:', server.installed_fpgas);
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-destructive">Error loading server data</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-muted-foreground">Loading server data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Server Information</CardTitle>
          <CardDescription>Basic details about this server</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Server ID</dt>
              <dd className="mt-1 text-sm">{server?.id || serverId}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Facility ID</dt>
              <dd className="mt-1 text-sm">{server?.facility_id || facilityId}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Rack ID</dt>
              <dd className="mt-1 text-sm">{server?.rack_id || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Cooling Type</dt>
              <dd className="mt-1 text-sm">{server?.cooling_type || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Rated Power</dt>
              <dd className="mt-1 text-sm">{server?.rated_power ? `${server.rated_power} kW` : 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Expected Lifetime</dt>
              <dd className="mt-1 text-sm">{server?.exptected_lifetime ? `${server.exptected_lifetime} years` : 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Total CPU Sockets</dt>
              <dd className="mt-1 text-sm">{server?.total_cpu_sockets ?? 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Number of PSUs</dt>
              <dd className="mt-1 text-sm">{server?.number_of_psus ?? 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Total Installed Memory</dt>
              <dd className="mt-1 text-sm">{server?.total_installed_memory ? `${server.total_installed_memory} GB` : 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Number of Memory Units</dt>
              <dd className="mt-1 text-sm">{server?.number_of_memory_units ?? 'N/A'}</dd>
            </div>
            {server?.description && (
              <div className="col-span-2">
                <dt className="text-sm font-medium text-muted-foreground">Description</dt>
                <dd className="mt-1 text-sm">{server.description}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Installed CPUs Card */}
      {server?.installed_cpus && server.installed_cpus.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Installed CPUs</CardTitle>
            <CardDescription>CPU configuration for this server</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {server.installed_cpus.map((cpu: Components.Schemas.CPU, index: number) => {
                console.log(`CPU ${index}:`, cpu, 'vendor:', cpu.vendor, 'type:', cpu.type);
                return (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="font-medium mb-2">CPU {index + 1}</div>
                    <dl className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Vendor</dt>
                        <dd className="mt-1 text-sm">{cpu.vendor || 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Type</dt>
                        <dd className="mt-1 text-sm">{cpu.type || 'N/A'}</dd>
                      </div>
                      {cpu.physical_core_count !== undefined && (
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">Physical Cores</dt>
                          <dd className="mt-1 text-sm">{cpu.physical_core_count}</dd>
                        </div>
                      )}
                    </dl>
                    <pre className="mt-2 text-xs text-muted-foreground">{JSON.stringify(cpu, null, 2)}</pre>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Installed GPUs Card */}
      {server?.installed_gpus && server.installed_gpus.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Installed GPUs</CardTitle>
            <CardDescription>GPU configuration for this server</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {server.installed_gpus.map((gpu: Components.Schemas.GPU, index: number) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="font-medium mb-2">GPU {index + 1}</div>
                  <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Vendor</dt>
                      <dd className="mt-1 text-sm">{String(gpu.vendor)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Type</dt>
                      <dd className="mt-1 text-sm">{String(gpu.type)}</dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Installed FPGAs Card */}
      {server?.installed_fpgas && server.installed_fpgas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Installed FPGAs</CardTitle>
            <CardDescription>FPGA configuration for this server</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {server.installed_fpgas.map((fpga: Components.Schemas.FPGA, index: number) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="font-medium mb-2">FPGA {index + 1}</div>
                  <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Vendor</dt>
                      <dd className="mt-1 text-sm">{String(fpga.vendor)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Type</dt>
                      <dd className="mt-1 text-sm">{String(fpga.type)}</dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Impact Assessment Card */}
      {server?.impact_assessment && (
        <Card>
          <CardHeader>
            <CardTitle>Impact Assessment</CardTitle>
            <CardDescription>Environmental impact metrics for this server</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {server.impact_assessment.climate_change !== undefined && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Climate Change</dt>
                  <dd className="mt-1 text-sm">{server.impact_assessment.climate_change.toFixed(2)} kg CO2 eq</dd>
                </div>
              )}
              {server.impact_assessment.ozone_depletion !== undefined && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Ozone Depletion</dt>
                  <dd className="mt-1 text-sm">{server.impact_assessment.ozone_depletion.toFixed(6)} kg CFC-11 eq</dd>
                </div>
              )}
              {server.impact_assessment.human_toxicity !== undefined && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Human Toxicity</dt>
                  <dd className="mt-1 text-sm">{server.impact_assessment.human_toxicity.toFixed(2)} kg 1,4-DB eq</dd>
                </div>
              )}
              {server.impact_assessment.photochemical_oxidant_formation !== undefined && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Photochemical Oxidant Formation</dt>
                  <dd className="mt-1 text-sm">{server.impact_assessment.photochemical_oxidant_formation.toFixed(4)} kg NMVOC</dd>
                </div>
              )}
              {server.impact_assessment.particulate_matter_formation !== undefined && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Particulate Matter Formation</dt>
                  <dd className="mt-1 text-sm">{server.impact_assessment.particulate_matter_formation.toFixed(4)} kg PM10 eq</dd>
                </div>
              )}
              {server.impact_assessment.ionizing_radiation !== undefined && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Ionizing Radiation</dt>
                  <dd className="mt-1 text-sm">{server.impact_assessment.ionizing_radiation.toFixed(2)} kg U235 eq</dd>
                </div>
              )}
              {server.impact_assessment.terrestrial_acidification !== undefined && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Terrestrial Acidification</dt>
                  <dd className="mt-1 text-sm">{server.impact_assessment.terrestrial_acidification.toFixed(4)} kg SO2 eq</dd>
                </div>
              )}
              {server.impact_assessment.freshwater_eutrophication !== undefined && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Freshwater Eutrophication</dt>
                  <dd className="mt-1 text-sm">{server.impact_assessment.freshwater_eutrophication.toFixed(4)} kg P eq</dd>
                </div>
              )}
              {server.impact_assessment.marine_eutrophication !== undefined && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Marine Eutrophication</dt>
                  <dd className="mt-1 text-sm">{server.impact_assessment.marine_eutrophication.toFixed(4)} kg N eq</dd>
                </div>
              )}
              {server.impact_assessment.terrestrial_ecotoxicity !== undefined && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Terrestrial Ecotoxicity</dt>
                  <dd className="mt-1 text-sm">{server.impact_assessment.terrestrial_ecotoxicity.toFixed(2)} kg 1,4-DB eq</dd>
                </div>
              )}
              {server.impact_assessment.freshwater_ecotoxicity !== undefined && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Freshwater Ecotoxicity</dt>
                  <dd className="mt-1 text-sm">{server.impact_assessment.freshwater_ecotoxicity.toFixed(2)} kg 1,4-DB eq</dd>
                </div>
              )}
              {server.impact_assessment.marine_ecotoxicity !== undefined && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Marine Ecotoxicity</dt>
                  <dd className="mt-1 text-sm">{server.impact_assessment.marine_ecotoxicity.toFixed(2)} kg 1,4-DB eq</dd>
                </div>
              )}
              {server.impact_assessment.agricultural_land_occupation !== undefined && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Agricultural Land Occupation</dt>
                  <dd className="mt-1 text-sm">{server.impact_assessment.agricultural_land_occupation.toFixed(2)} m2a</dd>
                </div>
              )}
              {server.impact_assessment.urban_land_occupation !== undefined && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Urban Land Occupation</dt>
                  <dd className="mt-1 text-sm">{server.impact_assessment.urban_land_occupation.toFixed(2)} m2a</dd>
                </div>
              )}
              {server.impact_assessment.natural_land_transformation !== undefined && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Natural Land Transformation</dt>
                  <dd className="mt-1 text-sm">{server.impact_assessment.natural_land_transformation.toFixed(2)} m2</dd>
                </div>
              )}
              {server.impact_assessment.water_depletion !== undefined && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Water Depletion</dt>
                  <dd className="mt-1 text-sm">{server.impact_assessment.water_depletion.toFixed(2)} m3</dd>
                </div>
              )}
              {server.impact_assessment.metal_depletion !== undefined && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Metal Depletion</dt>
                  <dd className="mt-1 text-sm">{server.impact_assessment.metal_depletion.toFixed(2)} kg Fe eq</dd>
                </div>
              )}
              {server.impact_assessment.fossil_depletion !== undefined && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Fossil Depletion</dt>
                  <dd className="mt-1 text-sm">{server.impact_assessment.fossil_depletion.toFixed(2)} kg oil eq</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
