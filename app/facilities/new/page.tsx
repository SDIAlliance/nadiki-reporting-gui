'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { createFacility } from '@/lib/api-utils';

export default function NewFacilityPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    
    const facilityData = {
      location: {
        latitude: parseFloat(formData.get('latitude') as string),
        longitude: parseFloat(formData.get('longitude') as string),
      },
      description: formData.get('description') as string || undefined,
      installedCapacity: formData.get('installedCapacity') 
        ? parseFloat(formData.get('installedCapacity') as string)
        : undefined,
      designPue: formData.get('designPue')
        ? parseFloat(formData.get('designPue') as string)
        : undefined,
      tierLevel: formData.get('tierLevel')
        ? parseInt(formData.get('tierLevel') as string) as 1 | 2 | 3 | 4
        : undefined,
    };

    try {
      const newFacility = await createFacility(facilityData);
      router.push(`/facilities/${newFacility.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create facility');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/facilities">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Facility</h1>
          <p className="text-muted-foreground">Create a new data center facility</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Facility Information</CardTitle>
          <CardDescription>
            Enter the basic information for your new facility
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude *</Label>
                <Input
                  id="latitude"
                  name="latitude"
                  type="number"
                  step="any"
                  required
                  placeholder="52.3676"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude *</Label>
                <Input
                  id="longitude"
                  name="longitude"
                  type="number"
                  step="any"
                  required
                  placeholder="4.9041"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                placeholder="Data center facility description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="installedCapacity">Installed Capacity (W)</Label>
                <Input
                  id="installedCapacity"
                  name="installedCapacity"
                  type="number"
                  placeholder="1000000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="designPue">Design PUE</Label>
                <Input
                  id="designPue"
                  name="designPue"
                  type="number"
                  step="0.1"
                  placeholder="1.5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tierLevel">Tier Level</Label>
              <select
                id="tierLevel"
                name="tierLevel"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select tier level</option>
                <option value="1">Tier 1</option>
                <option value="2">Tier 2</option>
                <option value="3">Tier 3</option>
                <option value="4">Tier 4</option>
              </select>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Facility'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/facilities">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}