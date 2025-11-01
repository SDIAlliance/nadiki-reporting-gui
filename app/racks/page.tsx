'use client';

import { useState, useMemo } from 'react';
import { useRacks } from '@/lib/hooks/use-racks';
import { useFacilities } from '@/lib/hooks/use-facilities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';

// Utility function to extract cage ID from rack ID
// Rack ID format: RACK-[FACILITY_ID]-[RACK_ID]
function extractCageId(rackId: string): string {
  const parts = rackId.split('-');
  if (parts.length >= 4) {
    // Return the last part as cage ID
    return parts[parts.length - 1];
  }
  return rackId;
}

// Utility function to get facility name from facility ID
function getFacilityDisplayName(facilityId: string): string {
  // For now, return the facility ID as display name
  // This could be enhanced to show actual facility names
  return facilityId;
}

export default function RacksPage() {
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('all');

  const { racks, total, isLoading: racksLoading, isError: racksError } = useRacks();
  const { isLoading: facilitiesLoading, isError: facilitiesError } = useFacilities();

  // Filter racks by selected facility
  const filteredRacks = useMemo(() => {
    if (selectedFacilityId === 'all') {
      return racks;
    }
    return racks.filter(rack => rack.facility_id === selectedFacilityId);
  }, [racks, selectedFacilityId]);

  // Get unique facility IDs from racks for the filter dropdown
  const facilityOptions = useMemo(() => {
    const uniqueFacilityIds = Array.from(new Set(racks.map(rack => rack.facility_id)));
    return uniqueFacilityIds.map(facilityId => ({
      value: facilityId,
      label: getFacilityDisplayName(facilityId)
    }));
  }, [racks]);

  if (racksLoading || facilitiesLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading racks...</div>
        </div>
      </div>
    );
  }

  if (racksError || facilitiesError) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              Error loading racks. Please try again later.
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
          <h1 className="text-3xl font-bold tracking-tight">Racks</h1>
          <p className="text-muted-foreground">
            Manage your data center racks
          </p>
        </div>
        <Button asChild>
          <Link href="/racks/new">
            <Plus className="mr-2 h-4 w-4" />
            New Rack
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Racks</CardTitle>
              <CardDescription>
                {filteredRacks.length} of {total} {total === 1 ? 'rack' : 'racks'}
                {selectedFacilityId !== 'all' && ' in selected facility'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label htmlFor="facility-filter" className="text-sm font-medium">
                  Filter by Facility:
                </label>
                <Select value={selectedFacilityId} onValueChange={setSelectedFacilityId}>
                  <SelectTrigger className="w-[250px]" id="facility-filter">
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRacks.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-4">
                {selectedFacilityId === 'all' 
                  ? 'No racks found' 
                  : 'No racks found in selected facility'
                }
              </div>
              <Button asChild>
                <Link href="/racks/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create your first rack
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rack ID</TableHead>
                  <TableHead>Data Center ID</TableHead>
                  <TableHead>Cage ID</TableHead>
                  <TableHead>Total Available Power</TableHead>
                  <TableHead>PDUs</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRacks.map((rack) => (
                  <TableRow key={rack.id}>
                    <TableCell className="font-medium">{rack.id}</TableCell>
                    <TableCell>{rack.facility_id}</TableCell>
                    <TableCell>{extractCageId(rack.id)}</TableCell>
                    <TableCell>
                      {rack.total_available_power 
                        ? `${rack.total_available_power} kW`
                        : 'N/A'
                      }
                    </TableCell>
                    <TableCell>
                      {rack.number_of_pdus || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {rack.createdAt 
                        ? new Date(rack.createdAt).toLocaleDateString()
                        : 'N/A'
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/racks/${rack.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/racks/${rack.id}/edit`}>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}