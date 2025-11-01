'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFacilities } from '@/lib/hooks/use-facilities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { createRack } from '@/lib/api-utils';

export default function NewRackPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('');

  const { facilities, isLoading: facilitiesLoading, isError: facilitiesError } = useFacilities();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!selectedFacilityId) {
      setError('Please select a facility');
      setIsLoading(false);
      return;
    }

    const formData = new FormData(event.currentTarget);
    
    const rackData = {
      facility_id: selectedFacilityId,
      total_available_power: formData.get('total_available_power') 
        ? parseFloat(formData.get('total_available_power') as string)
        : undefined,
      total_available_cooling_capacity: formData.get('total_available_cooling_capacity')
        ? parseFloat(formData.get('total_available_cooling_capacity') as string)
        : undefined,
      number_of_pdus: formData.get('number_of_pdus')
        ? parseInt(formData.get('number_of_pdus') as string)
        : undefined,
      power_redundancy: formData.get('power_redundancy')
        ? parseInt(formData.get('power_redundancy') as string)
        : undefined,
      description: formData.get('description') as string || undefined,
    };

    try {
      console.log('Submitting rack data:', JSON.stringify(rackData, null, 2));
      const newRack = await createRack(rackData);
      router.push(`/racks/${newRack.id}`);
    } catch (err: unknown) {
      console.error('Frontend error creating rack:', err);
      
      // Try to extract detailed error information
      let errorMessage = 'Failed to create rack';

      if (err && typeof err === 'object' && 'response' in err) {
        const errWithResponse = err as { response?: { data?: { validationErrors?: string; details?: unknown; error?: string } } };
        const errorData = errWithResponse.response?.data;
        if (errorData?.validationErrors) {
          errorMessage = `Validation Error: ${errorData.validationErrors}`;
        } else if (errorData?.details) {
          errorMessage = `Error: ${JSON.stringify(errorData.details, null, 2)}`;
        } else if (errorData?.error) {
          errorMessage = errorData.error;
        }
      } else if (err instanceof Error && err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (facilitiesLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading facilities...</div>
        </div>
      </div>
    );
  }

  if (facilitiesError) {
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
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/racks">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Rack</h1>
          <p className="text-muted-foreground">Create a new data center rack</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Location and identification details for the rack
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="facility_id">Facility *</Label>
                <Select value={selectedFacilityId} onValueChange={setSelectedFacilityId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a facility" />
                  </SelectTrigger>
                  <SelectContent>
                    {facilities.map((facility) => (
                      <SelectItem key={facility.id} value={facility.id}>
                        {facility.id} - {facility.countryCode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Rack description or location within facility"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Power & Cooling */}
          <Card>
            <CardHeader>
              <CardTitle>Power & Cooling</CardTitle>
              <CardDescription>
                Power and cooling capacity specifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="total_available_power">Total Available Power (kW)</Label>
                  <Input
                    id="total_available_power"
                    name="total_available_power"
                    type="number"
                    step="0.1"
                    placeholder="10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total_available_cooling_capacity">Total Available Cooling Capacity (kW)</Label>
                  <Input
                    id="total_available_cooling_capacity"
                    name="total_available_cooling_capacity"
                    type="number"
                    step="0.1"
                    placeholder="12"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Infrastructure */}
          <Card>
            <CardHeader>
              <CardTitle>Infrastructure</CardTitle>
              <CardDescription>
                Power distribution and redundancy configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="number_of_pdus">Number of PDUs</Label>
                  <Input
                    id="number_of_pdus"
                    name="number_of_pdus"
                    type="number"
                    placeholder="2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="power_redundancy">Power Redundancy</Label>
                  <Input
                    id="power_redundancy"
                    name="power_redundancy"
                    type="number"
                    placeholder="2"
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of power feeds for redundancy
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Rack'}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/racks">Cancel</Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}