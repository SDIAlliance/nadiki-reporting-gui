'use client';

import { useRack } from '@/lib/hooks/use-racks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

function extractCageId(rackId: string): string {
  const parts = rackId.split('-');
  if (parts.length >= 4) {
    return parts[parts.length - 1];
  }
  return rackId;
}

export default function RackDetailPage() {
  const params = useParams();
  const rackId = params.rackId as string;
  const facilityId = params.facilityId as string;

  const { rack, isLoading, isError } = useRack(rackId);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading rack...</div>
        </div>
      </div>
    );
  }

  if (isError || !rack) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              Error loading rack. Please try again later.
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
            <Link href={`/facilities/${facilityId}/racks`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{rack.id}</h1>
            <p className="text-muted-foreground">Rack Details</p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/facilities/${facilityId}/racks/${rack.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Rack
          </Link>
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Core rack details and location</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Rack ID</label>
                <p className="text-lg font-medium">{rack.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Cage ID</label>
                <p className="text-lg font-medium">{extractCageId(rack.id)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Facility ID</label>
                <p className="text-lg font-medium">
                  <Link href={`/facilities/${rack.facility_id}`} className="text-blue-600 hover:underline">
                    {rack.facility_id}
                  </Link>
                </p>
              </div>
            </div>
            {rack.description && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="text-sm">{rack.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Power & Cooling */}
        <Card>
          <CardHeader>
            <CardTitle>Power & Cooling</CardTitle>
            <CardDescription>Power and cooling capacity information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {rack.total_available_power && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Available Power</label>
                  <p className="text-lg font-medium">{rack.total_available_power} kW</p>
                </div>
              )}
              {rack.total_available_cooling_capacity && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Available Cooling Capacity</label>
                  <p className="text-lg font-medium">{rack.total_available_cooling_capacity} kW</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Infrastructure */}
        <Card>
          <CardHeader>
            <CardTitle>Infrastructure</CardTitle>
            <CardDescription>Power distribution and redundancy configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {rack.number_of_pdus && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Number of PDUs</label>
                  <p className="text-lg font-medium">{rack.number_of_pdus}</p>
                </div>
              )}
              {rack.power_redundancy && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Power Redundancy</label>
                  <p className="text-lg font-medium">{rack.power_redundancy}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Product Passport */}
        {rack.product_passport && Object.keys(rack.product_passport).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Product Passport</CardTitle>
              <CardDescription>LCA product passport data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <pre className="text-sm overflow-x-auto">
                  {JSON.stringify(rack.product_passport, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Time Series Configuration */}
        {rack.timeSeriesConfig && (
          <Card>
            <CardHeader>
              <CardTitle>Time Series Configuration</CardTitle>
              <CardDescription>InfluxDB configuration for metrics collection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Endpoint</label>
                  <p className="text-sm font-mono break-all">{rack.timeSeriesConfig.endpoint}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Organization</label>
                  <p className="text-sm font-mono">{rack.timeSeriesConfig.org}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Bucket</label>
                  <p className="text-sm font-mono">{rack.timeSeriesConfig.bucket}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Token</label>
                  <p className="text-sm font-mono break-all">{rack.timeSeriesConfig.token}</p>
                </div>
              </div>

              {rack.timeSeriesConfig.dataPoints && rack.timeSeriesConfig.dataPoints.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Available Data Points ({rack.timeSeriesConfig.dataPoints.length})
                  </label>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {rack.timeSeriesConfig.dataPoints.map((dataPoint, index) => (
                      <div key={index} className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{dataPoint.field}</span>
                          <Badge variant="outline">{dataPoint.measurement}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Granularity: {dataPoint.granularitySeconds}s
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Tags: facility_id={dataPoint.tags.facility_id}, rack_id={dataPoint.tags.rack_id}
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
                  {rack.createdAt
                    ? new Date(rack.createdAt).toLocaleString()
                    : 'N/A'
                  }
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                <p className="text-lg font-medium">
                  {rack.updatedAt
                    ? new Date(rack.updatedAt).toLocaleString()
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
