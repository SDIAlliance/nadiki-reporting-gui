'use client';

import { useState, useMemo } from 'react';
import { useServers } from '@/lib/hooks/use-servers';
import { useFacilities } from '@/lib/hooks/use-facilities';
import { useRacks } from '@/lib/hooks/use-racks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';

// Utility function to get facility name from facility ID
function getFacilityDisplayName(facilityId: string): string {
  return facilityId;
}

// Utility function to format cooling type for display
function formatCoolingType(coolingType: string): string {
  return coolingType.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

export default function ServersPage() {
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('all');
  const [selectedRackId, setSelectedRackId] = useState<string>('all');
  
  const { servers, total, isLoading: serversLoading, isError: serversError } = useServers();
  const { isLoading: facilitiesLoading, isError: facilitiesError } = useFacilities();
  const { racks, isLoading: racksLoading, isError: racksError } = useRacks();

  // Filter servers by selected facility and rack
  const filteredServers = useMemo(() => {
    let filtered = servers;
    
    if (selectedFacilityId !== 'all') {
      filtered = filtered.filter(server => server.facility_id === selectedFacilityId);
    }
    
    if (selectedRackId !== 'all') {
      filtered = filtered.filter(server => server.rack_id === selectedRackId);
    }
    
    return filtered;
  }, [servers, selectedFacilityId, selectedRackId]);

  // Get unique facility IDs from servers for the filter dropdown
  const facilityOptions = useMemo(() => {
    const uniqueFacilityIds = Array.from(new Set(servers.map(server => server.facility_id)));
    return uniqueFacilityIds.map(facilityId => ({
      value: facilityId,
      label: getFacilityDisplayName(facilityId)
    }));
  }, [servers]);

  // Get rack options filtered by selected facility
  const rackOptions = useMemo(() => {
    let filteredRacks = racks;
    
    if (selectedFacilityId !== 'all') {
      filteredRacks = racks.filter(rack => rack.facility_id === selectedFacilityId);
    }
    
    return filteredRacks.map(rack => ({
      value: rack.id,
      label: rack.id
    }));
  }, [racks, selectedFacilityId]);

  // Reset rack selection when facility changes
  const handleFacilityChange = (facilityId: string) => {
    setSelectedFacilityId(facilityId);
    setSelectedRackId('all'); // Reset rack filter when facility changes
  };

  if (serversLoading || facilitiesLoading || racksLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading servers...</div>
        </div>
      </div>
    );
  }

  if (serversError || facilitiesError || racksError) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              Error loading servers. Please try again later.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Servers</h1>
          <p className="text-muted-foreground">
            Manage your data center servers
          </p>
        </div>
        <Button asChild>
          <Link href="/servers/new">
            <Plus className="mr-2 h-4 w-4" />
            New Server
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Servers</CardTitle>
              <CardDescription>
                {filteredServers.length} of {total} {total === 1 ? 'server' : 'servers'}
                {(selectedFacilityId !== 'all' || selectedRackId !== 'all') && ' matching filters'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label htmlFor="facility-filter" className="text-sm font-medium">
                  Facility:
                </label>
                <Select value={selectedFacilityId} onValueChange={handleFacilityChange}>
                  <SelectTrigger className="w-[200px]" id="facility-filter">
                    <SelectValue placeholder="Select facility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Facilities</SelectItem>
                    {facilityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredServers.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-4">
                {(selectedFacilityId === 'all' && selectedRackId === 'all')
                  ? 'No servers found' 
                  : 'No servers found matching the selected filters'
                }
              </div>
              <Button asChild>
                <Link href="/servers/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create your first server
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                            <Link href={`/servers/${server.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/servers/${server.id}/edit`}>
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
        </CardContent>
      </Card>
    </div>
  );
}