'use client';

import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Server } from 'lucide-react';
import Link from 'next/link';
import { WorkloadAnalysis } from '@/components/workload/WorkloadAnalysis';
import { useFacility } from '@/lib/hooks/use-facilities';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface Workload {
  id: string;
  server_id: string;
  facility_id: string;
  pod_name: string;
  created_at: string;
  updated_at: string;
}

export default function WorkloadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const facilityId = params.facilityId as string;
  const workloadId = params.id as string;

  // Fetch workload data
  const { data: workload, error: workloadError, isLoading: workloadLoading } = useSWR<Workload>(
    `/api/workloads/${workloadId}`,
    fetcher
  );

  // Fetch facility data
  const { facility, isLoading: facilityLoading, isError: facilityError } = useFacility(facilityId);

  if (workloadLoading || facilityLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading workload...</div>
        </div>
      </div>
    );
  }

  if (workloadError || !workload) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            {workloadError ? 'Error loading workload' : 'Workload not found'}
          </div>
          <Button asChild>
            <Link href={`/facilities/${facilityId}/workloads`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Workloads
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (facilityError || !facility) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-red-600">
          Error loading facility data. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/facilities/${facilityId}/workloads`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Workloads
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold">Workload Details</h1>
          <p className="text-muted-foreground mt-1">
            Analysis for pod <span className="font-mono font-semibold">{workload.pod_name}</span>
          </p>
        </div>
      </div>

      {/* Workload Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Workload Information</CardTitle>
          <CardDescription>Basic information about this workload configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="border rounded-lg p-4 bg-muted/50">
              <dt className="text-sm font-medium text-muted-foreground">Pod Name</dt>
              <dd className="mt-1 text-lg font-mono font-semibold">{workload.pod_name}</dd>
            </div>

            <div className="border rounded-lg p-4 bg-muted/50">
              <dt className="text-sm font-medium text-muted-foreground">Server ID</dt>
              <dd className="mt-1 text-lg font-medium">
                <Link
                  href={`/facilities/${facilityId}/servers/${workload.server_id}`}
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Server className="h-4 w-4" />
                  {workload.server_id}
                </Link>
              </dd>
            </div>

            <div className="border rounded-lg p-4 bg-muted/50">
              <dt className="text-sm font-medium text-muted-foreground">Facility ID</dt>
              <dd className="mt-1 text-lg font-medium">{workload.facility_id}</dd>
            </div>

            <div className="border rounded-lg p-4 bg-muted/50">
              <dt className="text-sm font-medium text-muted-foreground">Created</dt>
              <dd className="mt-1 text-sm">
                {new Date(workload.created_at).toLocaleString()}
              </dd>
            </div>

            <div className="border rounded-lg p-4 bg-muted/50">
              <dt className="text-sm font-medium text-muted-foreground">Last Updated</dt>
              <dd className="mt-1 text-sm">
                {new Date(workload.updated_at).toLocaleString()}
              </dd>
            </div>

            <div className="border rounded-lg p-4 bg-muted/50">
              <dt className="text-sm font-medium text-muted-foreground">Workload ID</dt>
              <dd className="mt-1 text-xs font-mono text-muted-foreground">{workload.id}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Workload Analysis Component */}
      <WorkloadAnalysis
        facilityId={facilityId}
        serverId={workload.server_id}
        podName={workload.pod_name}
        facility={{
          totalNumberOfServers: facility.totalNumberOfServers,
        }}
      />
    </div>
  );
}
