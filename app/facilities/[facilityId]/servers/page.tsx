'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useServers } from '@/lib/hooks/use-servers';
import { useRacks } from '@/lib/hooks/use-racks';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';

// Utility function to format cooling type for display
function formatCoolingType(coolingType: string): string {
  return coolingType.split('-').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

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
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <label htmlFor="rack-filter" className="text-sm font-medium">
            Rack:
          </label>
          <Select value={selectedRackId} onValueChange={setSelectedRackId}>
            <SelectTrigger className="w-[250px]" id="rack-filter">
              <SelectValue placeholder="Select rack" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Racks</SelectItem>
              {rackOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button asChild>
          <Link href={`/facilities/${facilityId}/servers/new`}>
            <Plus className="mr-2 h-4 w-4" />
            New Server
          </Link>
        </Button>
      </div>

      {filteredServers.length === 0 ? (
        <div className="text-center py-8 border rounded-lg bg-muted/50">
          <div className="text-muted-foreground mb-4">
            {selectedRackId === 'all'
              ? 'No servers found in this facility'
              : 'No servers found matching the selected rack'
            }
          </div>
          <Button asChild>
            <Link href={`/facilities/${facilityId}/servers/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Create your first server
            </Link>
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Server ID</TableHead>
                <TableHead>Datacenter ID</TableHead>
                <TableHead>Rack ID</TableHead>
                <TableHead>Rated Power</TableHead>
                <TableHead>CPU Sockets</TableHead>
                <TableHead>Memory</TableHead>
                <TableHead>GPUs</TableHead>
                <TableHead>Storage Devices</TableHead>
                <TableHead>Cooling Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServers.map((server) => (
                <TableRow key={server.id}>
                  <TableCell className="font-medium">{server.id}</TableCell>
                  <TableCell>{server.facility_id}</TableCell>
                  <TableCell>{server.rack_id}</TableCell>
                  <TableCell>
                    {server.rated_power
                      ? `${server.rated_power} kW`
                      : 'N/A'
                    }
                  </TableCell>
                  <TableCell>
                    {server.total_cpu_sockets || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {server.total_installed_memory
                      ? `${server.total_installed_memory} GB`
                      : 'N/A'
                    }
                  </TableCell>
                  <TableCell>
                    {server.installed_gpus?.length || '0'}
                  </TableCell>
                  <TableCell>
                    {server.storage_devices?.length || '0'}
                  </TableCell>
                  <TableCell>
                    {formatCoolingType(server.cooling_type)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/facilities/${facilityId}/servers/${server.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/facilities/${facilityId}/servers/${server.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
