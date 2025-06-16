'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { createFacility } from '@/lib/api-utils';

interface CoolingFluid {
  type: string;
  amount: number;
  gwpFactor?: number;
}

export default function NewFacilityPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coolingFluids, setCoolingFluids] = useState<CoolingFluid[]>([]);

  const addCoolingFluid = () => {
    setCoolingFluids([...coolingFluids, { type: '', amount: 0 }]);
  };

  const removeCoolingFluid = (index: number) => {
    setCoolingFluids(coolingFluids.filter((_, i) => i !== index));
  };

  const updateCoolingFluid = (index: number, field: keyof CoolingFluid, value: string | number) => {
    const updated = [...coolingFluids];
    updated[index] = { ...updated[index], [field]: value };
    setCoolingFluids(updated);
  };

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
      
      // Power and Infrastructure
      installedCapacity: formData.get('installedCapacity') 
        ? parseFloat(formData.get('installedCapacity') as string)
        : undefined,
      gridPowerFeeds: formData.get('gridPowerFeeds')
        ? parseInt(formData.get('gridPowerFeeds') as string)
        : undefined,
      designPue: formData.get('designPue')
        ? parseFloat(formData.get('designPue') as string)
        : undefined,
      tierLevel: formData.get('tierLevel')
        ? parseInt(formData.get('tierLevel') as string) as 1 | 2 | 3 | 4
        : undefined,
      maintenanceHoursGenerator: formData.get('maintenanceHoursGenerator')
        ? parseFloat(formData.get('maintenanceHoursGenerator') as string)
        : undefined,

      // Space Information
      totalSpace: formData.get('totalSpace')
        ? parseFloat(formData.get('totalSpace') as string)
        : undefined,
      whiteSpace: formData.get('whiteSpace')
        ? parseFloat(formData.get('whiteSpace') as string)
        : undefined,
      whiteSpaceFloors: formData.get('whiteSpaceFloors')
        ? parseInt(formData.get('whiteSpaceFloors') as string)
        : undefined,

      // Environmental Data
      embeddedGhgEmissionsFacility: formData.get('embeddedGhgEmissionsFacility')
        ? parseFloat(formData.get('embeddedGhgEmissionsFacility') as string)
        : undefined,
      lifetimeFacility: formData.get('lifetimeFacility')
        ? parseInt(formData.get('lifetimeFacility') as string)
        : undefined,
      embeddedGhgEmissionsAssets: formData.get('embeddedGhgEmissionsAssets')
        ? parseFloat(formData.get('embeddedGhgEmissionsAssets') as string)
        : undefined,
      lifetimeAssets: formData.get('lifetimeAssets')
        ? parseInt(formData.get('lifetimeAssets') as string)
        : undefined,

      // Cooling Fluids
      coolingFluids: coolingFluids.length > 0 ? coolingFluids.filter(fluid => 
        fluid.type.trim() !== '' && fluid.amount > 0
      ) : undefined,
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

      <div className="max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          {/* Location Information */}
          <Card>
            <CardHeader>
              <CardTitle>Location Information</CardTitle>
              <CardDescription>
                Basic location data for the facility
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Data center facility description"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Power and Infrastructure */}
          <Card>
            <CardHeader>
              <CardTitle>Power & Infrastructure</CardTitle>
              <CardDescription>
                Power capacity, efficiency, and infrastructure details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="installedCapacity">Installed Capacity (kW)</Label>
                  <Input
                    id="installedCapacity"
                    name="installedCapacity"
                    type="number"
                    placeholder="1000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gridPowerFeeds">Grid Power Feeds</Label>
                  <Input
                    id="gridPowerFeeds"
                    name="gridPowerFeeds"
                    type="number"
                    placeholder="2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="designPue">Design PUE</Label>
                  <Input
                    id="designPue"
                    name="designPue"
                    type="number"
                    step="0.01"
                    placeholder="1.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tierLevel">Tier Level</Label>
                  <Select name="tierLevel">
                    <SelectTrigger>
                      <SelectValue placeholder="Select tier level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Tier 1</SelectItem>
                      <SelectItem value="2">Tier 2</SelectItem>
                      <SelectItem value="3">Tier 3</SelectItem>
                      <SelectItem value="4">Tier 4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maintenanceHoursGenerator">Annual Generator Maintenance Hours</Label>
                <Input
                  id="maintenanceHoursGenerator"
                  name="maintenanceHoursGenerator"
                  type="number"
                  step="0.1"
                  placeholder="200"
                />
              </div>
            </CardContent>
          </Card>

          {/* Space Information */}
          <Card>
            <CardHeader>
              <CardTitle>Space Information</CardTitle>
              <CardDescription>
                Physical space allocation and layout details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalSpace">Total Space (m²)</Label>
                  <Input
                    id="totalSpace"
                    name="totalSpace"
                    type="number"
                    step="0.1"
                    placeholder="1000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whiteSpace">White Space (m²)</Label>
                  <Input
                    id="whiteSpace"
                    name="whiteSpace"
                    type="number"
                    step="0.1"
                    placeholder="600"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="whiteSpaceFloors">White Space Floors</Label>
                <Input
                  id="whiteSpaceFloors"
                  name="whiteSpaceFloors"
                  type="number"
                  placeholder="1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Environmental Data */}
          <Card>
            <CardHeader>
              <CardTitle>Environmental Data</CardTitle>
              <CardDescription>
                Carbon emissions and lifecycle information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="embeddedGhgEmissionsFacility">Facility GHG Emissions (kg CO2-eq)</Label>
                  <Input
                    id="embeddedGhgEmissionsFacility"
                    name="embeddedGhgEmissionsFacility"
                    type="number"
                    step="0.1"
                    placeholder="1000000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lifetimeFacility">Facility Lifetime (years)</Label>
                  <Input
                    id="lifetimeFacility"
                    name="lifetimeFacility"
                    type="number"
                    placeholder="25"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="embeddedGhgEmissionsAssets">Assets GHG Emissions (kg CO2-eq)</Label>
                  <Input
                    id="embeddedGhgEmissionsAssets"
                    name="embeddedGhgEmissionsAssets"
                    type="number"
                    step="0.1"
                    placeholder="500000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lifetimeAssets">Assets Lifetime (years)</Label>
                  <Input
                    id="lifetimeAssets"
                    name="lifetimeAssets"
                    type="number"
                    placeholder="10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cooling Fluids */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Cooling Fluids</CardTitle>
                  <CardDescription>
                    Types and amounts of cooling fluids used
                  </CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addCoolingFluid}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Cooling Fluid
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {coolingFluids.length === 0 ? (
                <p className="text-muted-foreground text-sm">No cooling fluids added yet.</p>
              ) : (
                <div className="space-y-4">
                  {coolingFluids.map((fluid, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Cooling Fluid {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCoolingFluid(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Type</Label>
                          <Input
                            value={fluid.type}
                            onChange={(e) => updateCoolingFluid(index, 'type', e.target.value)}
                            placeholder="e.g., Water, Glycol"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Amount (kg or m³)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={fluid.amount}
                            onChange={(e) => updateCoolingFluid(index, 'amount', parseFloat(e.target.value) || 0)}
                            placeholder="1000"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>GWP Factor (optional)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={fluid.gwpFactor || ''}
                            onChange={(e) => updateCoolingFluid(index, 'gwpFactor', parseFloat(e.target.value) || undefined)}
                            placeholder="1.0"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Facility'}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/facilities">Cancel</Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}