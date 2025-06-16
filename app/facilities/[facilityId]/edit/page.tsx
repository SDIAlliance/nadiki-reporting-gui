'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useFacility } from '@/lib/hooks/use-facilities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { updateFacility } from '@/lib/api-utils';

interface CoolingFluid {
  type: string;
  amount: number;
  gwpFactor?: number;
}

export default function EditFacilityPage() {
  const router = useRouter();
  const params = useParams();
  const facilityId = params.facilityId as string;
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coolingFluids, setCoolingFluids] = useState<CoolingFluid[]>([]);
  const [formData, setFormData] = useState({
    latitude: '',
    longitude: '',
    description: '',
    installedCapacity: '',
    gridPowerFeeds: '',
    designPue: '',
    tierLevel: '',
    maintenanceHoursGenerator: '',
    totalSpace: '',
    whiteSpace: '',
    whiteSpaceFloors: '',
    embeddedGhgEmissionsFacility: '',
    lifetimeFacility: '',
    embeddedGhgEmissionsAssets: '',
    lifetimeAssets: '',
  });

  const { facility, isLoading: facilityLoading, isError: facilityError } = useFacility(facilityId);

  // Populate form data when facility loads
  useEffect(() => {
    if (facility) {
      setFormData({
        latitude: facility.location.latitude.toString(),
        longitude: facility.location.longitude.toString(),
        description: facility.description || '',
        installedCapacity: facility.installedCapacity?.toString() || '',
        gridPowerFeeds: facility.gridPowerFeeds?.toString() || '',
        designPue: facility.designPue?.toString() || '',
        tierLevel: facility.tierLevel?.toString() || '',
        maintenanceHoursGenerator: facility.maintenanceHoursGenerator?.toString() || '',
        totalSpace: facility.totalSpace?.toString() || '',
        whiteSpace: facility.whiteSpace?.toString() || '',
        whiteSpaceFloors: facility.whiteSpaceFloors?.toString() || '',
        embeddedGhgEmissionsFacility: facility.embeddedGhgEmissionsFacility?.toString() || '',
        lifetimeFacility: facility.lifetimeFacility?.toString() || '',
        embeddedGhgEmissionsAssets: facility.embeddedGhgEmissionsAssets?.toString() || '',
        lifetimeAssets: facility.lifetimeAssets?.toString() || '',
      });

      // Set cooling fluids if they exist
      if (facility.coolingFluids && facility.coolingFluids.length > 0) {
        setCoolingFluids(facility.coolingFluids);
      }
    }
  }, [facility]);

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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const facilityUpdateData = {
      location: {
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
      },
      description: formData.description || undefined,
      
      // Power and Infrastructure
      installedCapacity: formData.installedCapacity 
        ? parseFloat(formData.installedCapacity)
        : undefined,
      gridPowerFeeds: formData.gridPowerFeeds
        ? parseInt(formData.gridPowerFeeds)
        : undefined,
      designPue: formData.designPue
        ? parseFloat(formData.designPue)
        : undefined,
      tierLevel: formData.tierLevel
        ? parseInt(formData.tierLevel) as 1 | 2 | 3 | 4
        : undefined,
      maintenanceHoursGenerator: formData.maintenanceHoursGenerator
        ? parseFloat(formData.maintenanceHoursGenerator)
        : undefined,

      // Space Information
      totalSpace: formData.totalSpace
        ? parseFloat(formData.totalSpace)
        : undefined,
      whiteSpace: formData.whiteSpace
        ? parseFloat(formData.whiteSpace)
        : undefined,
      whiteSpaceFloors: formData.whiteSpaceFloors
        ? parseInt(formData.whiteSpaceFloors)
        : undefined,

      // Environmental Data
      embeddedGhgEmissionsFacility: formData.embeddedGhgEmissionsFacility
        ? parseFloat(formData.embeddedGhgEmissionsFacility)
        : undefined,
      lifetimeFacility: formData.lifetimeFacility
        ? parseInt(formData.lifetimeFacility)
        : undefined,
      embeddedGhgEmissionsAssets: formData.embeddedGhgEmissionsAssets
        ? parseFloat(formData.embeddedGhgEmissionsAssets)
        : undefined,
      lifetimeAssets: formData.lifetimeAssets
        ? parseInt(formData.lifetimeAssets)
        : undefined,

      // Cooling Fluids
      coolingFluids: coolingFluids.length > 0 ? coolingFluids.filter(fluid => 
        fluid.type.trim() !== '' && fluid.amount > 0
      ) : undefined,
    };

    try {
      await updateFacility(facilityId, facilityUpdateData);
      router.push(`/facilities/${facilityId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update facility');
    } finally {
      setIsLoading(false);
    }
  };

  if (facilityLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading facility...</div>
        </div>
      </div>
    );
  }

  if (facilityError || !facility) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              Error loading facility. Please try again later.
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
          <Link href={`/facilities/${facilityId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Facility</h1>
          <p className="text-muted-foreground">Update facility information for {facility.id}</p>
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
                    value={formData.latitude}
                    onChange={(e) => handleInputChange('latitude', e.target.value)}
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
                    value={formData.longitude}
                    onChange={(e) => handleInputChange('longitude', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
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
                    value={formData.installedCapacity}
                    onChange={(e) => handleInputChange('installedCapacity', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gridPowerFeeds">Grid Power Feeds</Label>
                  <Input
                    id="gridPowerFeeds"
                    name="gridPowerFeeds"
                    type="number"
                    value={formData.gridPowerFeeds}
                    onChange={(e) => handleInputChange('gridPowerFeeds', e.target.value)}
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
                    value={formData.designPue}
                    onChange={(e) => handleInputChange('designPue', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tierLevel">Tier Level</Label>
                  <Select value={formData.tierLevel || undefined} onValueChange={(value) => handleInputChange('tierLevel', value)}>
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
                  {formData.tierLevel && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleInputChange('tierLevel', '')}
                      className="text-xs"
                    >
                      Clear selection
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maintenanceHoursGenerator">Annual Generator Maintenance Hours</Label>
                <Input
                  id="maintenanceHoursGenerator"
                  name="maintenanceHoursGenerator"
                  type="number"
                  step="0.1"
                  value={formData.maintenanceHoursGenerator}
                  onChange={(e) => handleInputChange('maintenanceHoursGenerator', e.target.value)}
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
                    value={formData.totalSpace}
                    onChange={(e) => handleInputChange('totalSpace', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whiteSpace">White Space (m²)</Label>
                  <Input
                    id="whiteSpace"
                    name="whiteSpace"
                    type="number"
                    step="0.1"
                    value={formData.whiteSpace}
                    onChange={(e) => handleInputChange('whiteSpace', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="whiteSpaceFloors">White Space Floors</Label>
                <Input
                  id="whiteSpaceFloors"
                  name="whiteSpaceFloors"
                  type="number"
                  value={formData.whiteSpaceFloors}
                  onChange={(e) => handleInputChange('whiteSpaceFloors', e.target.value)}
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
                    value={formData.embeddedGhgEmissionsFacility}
                    onChange={(e) => handleInputChange('embeddedGhgEmissionsFacility', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lifetimeFacility">Facility Lifetime (years)</Label>
                  <Input
                    id="lifetimeFacility"
                    name="lifetimeFacility"
                    type="number"
                    value={formData.lifetimeFacility}
                    onChange={(e) => handleInputChange('lifetimeFacility', e.target.value)}
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
                    value={formData.embeddedGhgEmissionsAssets}
                    onChange={(e) => handleInputChange('embeddedGhgEmissionsAssets', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lifetimeAssets">Assets Lifetime (years)</Label>
                  <Input
                    id="lifetimeAssets"
                    name="lifetimeAssets"
                    type="number"
                    value={formData.lifetimeAssets}
                    onChange={(e) => handleInputChange('lifetimeAssets', e.target.value)}
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
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>GWP Factor (optional)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={fluid.gwpFactor || ''}
                            onChange={(e) => updateCoolingFluid(index, 'gwpFactor', parseFloat(e.target.value) || undefined)}
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
              {isLoading ? 'Updating...' : 'Update Facility'}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href={`/facilities/${facilityId}`}>Cancel</Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}