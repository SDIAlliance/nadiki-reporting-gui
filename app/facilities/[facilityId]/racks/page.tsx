'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useRacks } from '@/lib/hooks/use-racks';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { columns } from './columns';
import { DataTable } from './data-table';

export default function FacilityRacksPage() {
  const params = useParams();
  const facilityId = params.facilityId as string;

  const { racks, isLoading, isError } = useRacks();

  // Filter racks by facility
  const filteredRacks = useMemo(() => {
    return racks.filter(rack => rack.facility_id === facilityId);
  }, [racks, facilityId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading racks...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center text-red-600">
        Error loading racks. Please try again later.
      </div>
    );
  }

  return (
    <div>
      {filteredRacks.length === 0 ? (
        <div className="text-center py-8 border rounded-lg bg-muted/50">
          <div className="text-muted-foreground mb-4">
            No racks found in this facility
          </div>
          <Button asChild>
            <Link href={`/facilities/${facilityId}/racks/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Create your first rack
            </Link>
          </Button>
        </div>
      ) : (
        <DataTable columns={columns} data={filteredRacks} />
      )}
    </div>
  );
}
