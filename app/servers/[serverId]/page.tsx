'use client';

import { useServer } from '@/lib/hooks/use-servers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

function formatCoolingType(coolingType: string): string {
  return coolingType.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

function extractServerIdFromFull(serverId: string): string {
  const parts = serverId.split('-');
  if (parts.length >= 6) {
    return parts[parts.length - 1];
  }
  return serverId;
}

export default function ServerDetailPage() {
  const params = useParams();
  const serverId = params.serverId as string;
  
  const { server, isLoading, isError } = useServer(serverId);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading server...</div>
        </div>
      </div>
    );
  }

  if (isError || !server) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              Error loading server. Please try again later.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/servers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{server.id}</h1>
            <p className="text-muted-foreground">Server Details</p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/servers/${server.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Server
          </Link>
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Core server details and location</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Server ID</label>
                <p className="text-lg font-medium">{server.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Short Server ID</label>
                <p className="text-lg font-medium">{extractServerIdFromFull(server.id)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Facility ID</label>
                <p className="text-lg font-medium">
                  <Link href={`/facilities/${server.facility_id}`} className="text-blue-600 hover:underline">
                    {server.facility_id}
                  </Link>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Rack ID</label>
                <p className="text-lg font-medium">
                  <Link href={`/racks/${server.rack_id}`} className="text-blue-600 hover:underline">
                    {server.rack_id}
                  </Link>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Cooling Type</label>
                <p className="text-lg font-medium">{formatCoolingType(server.cooling_type)}</p>
              </div>
            </div>
            {server.description && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="text-sm">{server.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Power & Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Power & Performance</CardTitle>
            <CardDescription>Power consumption and processing capabilities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {server.rated_power && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Rated Power</label>
                  <p className="text-lg font-medium">{server.rated_power} kW</p>
                </div>
              )}
              {server.total_cpu_sockets && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total CPU Sockets</label>
                  <p className="text-lg font-medium">{server.total_cpu_sockets}</p>
                </div>
              )}
              {server.total_installed_memory && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Installed Memory</label>
                  <p className="text-lg font-medium">{server.total_installed_memory} GB</p>
                </div>
              )}
              {server.number_of_memory_units && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Memory Units</label>
                  <p className="text-lg font-medium">{server.number_of_memory_units}</p>
                </div>
              )}
              {server.number_of_psus && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Power Supply Units</label>
                  <p className="text-lg font-medium">{server.number_of_psus}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Hardware Components */}
        <Card>
          <CardHeader>
            <CardTitle>Hardware Components</CardTitle>
            <CardDescription>Installed processors, graphics, and accelerators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* CPUs */}
            {server.installed_cpus && server.installed_cpus.length > 0 && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground">
                  Installed CPUs ({server.installed_cpus.length})
                </label>
                <div className="grid gap-2">
                  {server.installed_cpus.map((cpu, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="font-medium">{cpu.vendor} {cpu.type}</span>
                      <Badge variant="outline">CPU {index + 1}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* GPUs */}
            {server.installed_gpus && server.installed_gpus.length > 0 && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground">
                  Installed GPUs ({server.installed_gpus.length})
                </label>
                <div className="grid gap-2">
                  {server.installed_gpus.map((gpu, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="font-medium">{gpu.vendor} {gpu.type}</span>
                      <Badge variant="outline">GPU {index + 1}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FPGAs */}
            {server.installed_fpgas && server.installed_fpgas.length > 0 && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground">
                  Installed FPGAs ({server.installed_fpgas.length})
                </label>
                <div className="grid gap-2">
                  {server.installed_fpgas.map((fpga, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="font-medium">{fpga.vendor} {fpga.type}</span>
                      <Badge variant="outline">FPGA {index + 1}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Storage Devices */}
        {server.storage_devices && server.storage_devices.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Storage Devices</CardTitle>
              <CardDescription>Installed storage components and capacity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground">
                  Installed Storage Devices ({server.storage_devices.length})
                </label>
                <div className="grid gap-2">
                  {server.storage_devices.map((storage, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <span className="font-medium">{storage.vendor}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {storage.capacity} TB
                        </span>
                      </div>
                      <Badge variant="outline">{storage.type}</Badge>
                    </div>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Storage: {server.storage_devices.reduce((total, storage) => total + storage.capacity, 0)} TB
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Product Passport */}
        {server.product_passport && Object.keys(server.product_passport).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Product Passport</CardTitle>
              <CardDescription>LCA product passport data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <pre className="text-sm overflow-x-auto">
                  {JSON.stringify(server.product_passport, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Time Series Configuration */}
        {server.timeSeriesConfig && (
          <Card>
            <CardHeader>
              <CardTitle>Time Series Configuration</CardTitle>
              <CardDescription>InfluxDB configuration for metrics collection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Endpoint</label>
                  <p className="text-sm font-mono break-all">{server.timeSeriesConfig.endpoint}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Organization</label>
                  <p className="text-sm font-mono">{server.timeSeriesConfig.org}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Bucket</label>
                  <p className="text-sm font-mono">{server.timeSeriesConfig.bucket}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Token</label>
                  <p className="text-sm font-mono break-all">{server.timeSeriesConfig.token}</p>
                </div>
              </div>
              
              {server.timeSeriesConfig.dataPoints && server.timeSeriesConfig.dataPoints.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Available Data Points ({server.timeSeriesConfig.dataPoints.length})
                  </label>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {server.timeSeriesConfig.dataPoints.map((dataPoint, index) => (
                      <div key={index} className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{dataPoint.field}</span>
                          <Badge variant="outline">{dataPoint.measurement}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Granularity: {dataPoint.granularitySeconds}s
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Tags: facility_id={dataPoint.tags.facility_id}, rack_id={dataPoint.tags.rack_id}, server_id={dataPoint.tags.server_id}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Timestamps */}
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
            <CardDescription>Creation and modification dates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <p className="text-lg font-medium">
                  {server.createdAt 
                    ? new Date(server.createdAt).toLocaleString()
                    : 'N/A'
                  }
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                <p className="text-lg font-medium">
                  {server.updatedAt 
                    ? new Date(server.updatedAt).toLocaleString()
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}