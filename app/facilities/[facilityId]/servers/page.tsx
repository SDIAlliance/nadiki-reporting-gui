'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useServers } from '@/lib/hooks/use-servers';
import { useRacks } from '@/lib/hooks/use-racks';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { columns } from './columns';
import { DataTable } from './data-table';

export default function FacilityServersPage() {
  const params = useParams();
  const facilityId = params.facilityId as string;
  const [selectedRackId, setSelectedRackId] = useState<string>('all');

  const { servers, isLoading: serversLoading, isError: serversError } = useServers();
  const { racks, isLoading: racksLoading, isError: racksError } = useRacks();

  // Filter servers by facility and rack
  const filteredServers = useMemo(() => {
    let filtered = servers.filter(server => server.facility_id === facilityId);

    if (selectedRackId !== 'all') {
      filtered = filtered.filter(server => server.rack_id === selectedRackId);
    }

    return filtered;
  }, [servers, facilityId, selectedRackId]);

  // Get rack options for this facility
  const rackOptions = useMemo(() => {
    const filteredRacks = racks.filter(rack => rack.facility_id === facilityId);

    return filteredRacks.map(rack => ({
      value: rack.id,
      label: rack.id
    }));
  }, [racks, facilityId]);

  if (serversLoading || racksLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading servers...</div>
        </div>
      </div>
    );
  }

  if (serversError || racksError) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-red-600">
          Error loading servers. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div>
      {filteredServers.length === 0 && selectedRackId === 'all' ? (
        <div className="text-center py-8 border rounded-lg bg-muted/50">
          <div className="text-muted-foreground mb-4">
            No servers found in this facility
          </div>
          <Button asChild>
            <Link href={`/facilities/${facilityId}/servers/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Create your first server
            </Link>
          </Button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredServers}
          rackOptions={rackOptions}
          onRackFilterChange={setSelectedRackId}
          selectedRackId={selectedRackId}
        />
      )}
    </div>
  );
}
