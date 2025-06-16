'use client';

import { useFacilities } from '@/lib/hooks/use-facilities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';

function MetricsStatusBadge({ facilityId }: { facilityId: string }) {
  // Mock metrics status for now - can be replaced with real data later
  const isReceivingMetrics = Math.random() > 0.5; // Random for demo
  
  return (
    <Badge variant={isReceivingMetrics ? 'default' : 'secondary'}>
      {isReceivingMetrics ? 'Active' : 'Inactive'}
    </Badge>
  );
}

export default function FacilitiesPage() {
  const { facilities, total, isLoading, isError } = useFacilities();

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading facilities...</div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              Error loading facilities. Please try again later.
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
          <h1 className="text-3xl font-bold tracking-tight">Facilities</h1>
          <p className="text-muted-foreground">
            Manage your data center facilities
          </p>
        </div>
        <Button asChild>
          <Link href="/facilities/new">
            <Plus className="mr-2 h-4 w-4" />
            New Facility
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Facilities</CardTitle>
          <CardDescription>
            {total} {total === 1 ? 'facility' : 'facilities'} registered
          </CardDescription>
        </CardHeader>
        <CardContent>
          {facilities.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-4">No facilities found</div>
              <Button asChild>
                <Link href="/facilities/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create your first facility
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Facility ID</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Metrics Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facilities.map((facility) => (
                  <TableRow key={facility.id}>
                    <TableCell className="font-medium">{facility.id}</TableCell>
                    <TableCell>
                      {facility.location.latitude.toFixed(4)}, {facility.location.longitude.toFixed(4)}
                    </TableCell>
                    <TableCell>{facility.countryCode}</TableCell>
                    <TableCell>
                      <MetricsStatusBadge facilityId={facility.id} />
                    </TableCell>
                    <TableCell>
                      {facility.createdAt 
                        ? new Date(facility.createdAt).toLocaleDateString()
                        : 'N/A'
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/facilities/${facility.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/facilities/${facility.id}/edit`}>
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