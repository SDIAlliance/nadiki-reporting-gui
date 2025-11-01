'use client';

import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ServerDetailPage() {
  const params = useParams();
  const facilityId = params.facilityId as string;
  const serverId = params.serverId as string;

  // Fetch server data
  const { data: server, error, isLoading } = useSWR(
    `/api/facilities/${facilityId}/servers/${serverId}`,
    fetcher
  );

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
      <div>
        <h1 className="text-3xl font-bold">Server Details</h1>
        <p className="text-muted-foreground">Server ID: {serverId}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Server Information</CardTitle>
          <CardDescription>Basic details about this server</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Server ID</dt>
              <dd className="mt-1 text-sm">{serverId}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Facility ID</dt>
              <dd className="mt-1 text-sm">{facilityId}</dd>
            </div>
            {server && Object.keys(server).length > 0 ? (
              Object.entries(server).map(([key, value]) => (
                <div key={key}>
                  <dt className="text-sm font-medium text-muted-foreground capitalize">
                    {key.replace(/_/g, ' ')}
                  </dt>
                  <dd className="mt-1 text-sm">{String(value)}</dd>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-muted-foreground">
                No additional server data available
              </div>
            )}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
