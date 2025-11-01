'use client';

import { useFacility } from '@/lib/hooks/use-facilities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useParams } from 'next/navigation';

function MetricsStatusBadge() {
  // Mock metrics status for now
  const isReceivingMetrics = Math.random() > 0.5;
  
  return (
    <Badge variant={isReceivingMetrics ? 'default' : 'secondary'}>
      {isReceivingMetrics ? 'Receiving Metrics' : 'No Metrics'}
    </Badge>
  );
}

export default function FacilityOverviewPage() {
  const params = useParams();
  const facilityId = params.facilityId as string;
  
  const { facility, isLoading, isError } = useFacility(facilityId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading facility...</div>
      </div>
    );
  }

  if (isError || !facility) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            Error loading facility. Please try again later.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{facility.id}</h1>
            <p className="text-muted-foreground">Facility Overview</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Core facility details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Facility ID</label>
                <p className="text-lg font-medium">{facility.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Country Code</label>
                <p className="text-lg font-medium">{facility.countryCode}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Latitude</label>
                <p className="text-lg font-medium">{facility.location.latitude}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Longitude</label>
                <p className="text-lg font-medium">{facility.location.longitude}</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Metrics Status</label>
              <div className="mt-1">
                <MetricsStatusBadge />
              </div>
            </div>
            {facility.description && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="text-sm">{facility.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Technical Specifications */}
        <Card>
          <CardHeader>
            <CardTitle>Technical Specifications</CardTitle>
            <CardDescription>Power and capacity information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {facility.installedCapacity && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Installed Capacity</label>
                  <p className="text-lg font-medium">{facility.installedCapacity} kW</p>
                </div>
              )}
              {facility.designPue && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Design PUE</label>
                  <p className="text-lg font-medium">{facility.designPue}</p>
                </div>
              )}
              {facility.tierLevel && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tier Level</label>
                  <p className="text-lg font-medium">Tier {facility.tierLevel}</p>
                </div>
              )}
              {facility.gridPowerFeeds && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Grid Power Feeds</label>
                  <p className="text-lg font-medium">{facility.gridPowerFeeds}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Space Information */}
        {(facility.totalSpace || facility.whiteSpace || facility.whiteSpaceFloors) && (
          <Card>
            <CardHeader>
              <CardTitle>Space Information</CardTitle>
              <CardDescription>Facility space allocation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {facility.totalSpace && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Total Space</label>
                    <p className="text-lg font-medium">{facility.totalSpace} m²</p>
                  </div>
                )}
                {facility.whiteSpace && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">White Space</label>
                    <p className="text-lg font-medium">{facility.whiteSpace} m²</p>
                  </div>
                )}
                {facility.whiteSpaceFloors && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">White Space Floors</label>
                    <p className="text-lg font-medium">{facility.whiteSpaceFloors}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Time Series Configuration */}
        {facility.timeSeriesConfig && (
          <Card>
            <CardHeader>
              <CardTitle>Time Series Configuration</CardTitle>
              <CardDescription>InfluxDB configuration for metrics collection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Endpoint</label>
                  <p className="text-sm font-mono break-all">{facility.timeSeriesConfig.endpoint}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Organization</label>
                  <p className="text-sm font-mono">{facility.timeSeriesConfig.org}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Bucket</label>
                  <p className="text-sm font-mono">{facility.timeSeriesConfig.bucket}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Token</label>
                  <p className="text-sm font-mono break-all">{facility.timeSeriesConfig.token}</p>
                </div>
              </div>
              
              {facility.timeSeriesConfig.dataPoints && facility.timeSeriesConfig.dataPoints.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Available Data Points ({facility.timeSeriesConfig.dataPoints.length})
                  </label>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {facility.timeSeriesConfig.dataPoints.map((dataPoint, index) => (
                      <div key={index} className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{dataPoint.field}</span>
                          <Badge variant="outline">{dataPoint.measurement}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Granularity: {dataPoint.granularitySeconds}s
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Tags: facility_id={dataPoint.tags.facility_id}, country_code={dataPoint.tags.country_code}
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
                  {facility.createdAt 
                    ? new Date(facility.createdAt).toLocaleString()
                    : 'N/A'
                  }
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                <p className="text-lg font-medium">
                  {facility.updatedAt 
                    ? new Date(facility.updatedAt).toLocaleString()
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