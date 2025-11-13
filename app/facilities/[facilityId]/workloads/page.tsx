'use client';

import { useState, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { useServers } from '@/lib/hooks/use-servers';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { createColumns, type Workload } from './columns';
import { DataTable } from './data-table';
import { useToast } from '@/hooks/use-toast';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function FacilityWorkloadsPage() {
  const params = useParams();
  const facilityId = params.facilityId as string;
  const [selectedServerId, setSelectedServerId] = useState<string>('all');
  const { toast } = useToast();

  // Fetch workloads from Supabase API
  const { data: workloads = [], error: workloadsError, isLoading: workloadsLoading, mutate } = useSWR<Workload[]>(
    `/api/workloads?facility_id=${facilityId}`,
    fetcher
  );

  // Delete handler
  const handleDelete = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/workloads/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to delete workload');
      }

      // Refresh the workloads list
      mutate();

      toast({
        title: 'Workload deleted',
        description: 'The workload has been successfully deleted.',
      });
    } catch (error) {
      console.error('Error deleting workload:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete workload',
        variant: 'destructive',
      });
      throw error;
    }
  }, [mutate, toast]);

  // Fetch servers for this facility
  const { servers, isLoading: serversLoading, isError: serversError } = useServers({ facilityId });

  // Filter workloads by server if selected
  const filteredWorkloads = useMemo(() => {
    if (selectedServerId === 'all') {
      return workloads;
    }
    return workloads.filter(workload => workload.server_id === selectedServerId);
  }, [workloads, selectedServerId]);

  // Get server options for this facility
  const serverOptions = useMemo(() => {
    return servers.map(server => ({
      value: server.id,
      label: server.id
    }));
  }, [servers]);

  // Create columns with delete handler
  const columns = useMemo(() => createColumns(handleDelete), [handleDelete]);

  if (workloadsLoading || serversLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading workloads...</div>
        </div>
      </div>
    );
  }

  if (workloadsError || serversError) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-red-600">
          Error loading workloads. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div>
      {workloads.length === 0 ? (
        <div className="text-center py-8 border rounded-lg bg-muted/50">
          <div className="text-muted-foreground mb-4">
            No workloads found in this facility
          </div>
          <Button asChild>
            <Link href={`/facilities/${facilityId}/workloads/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Create your first workload
            </Link>
          </Button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredWorkloads}
          serverOptions={serverOptions}
          onServerFilterChange={setSelectedServerId}
          selectedServerId={selectedServerId}
        />
      )}
    </div>
  );
}
