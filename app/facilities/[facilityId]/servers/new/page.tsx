'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import type { ServerCreate } from 'registrar-api-client/types/server-api';
import type { RackResponse } from 'registrar-api-client/types/rack-api';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Zod schema for server creation
const serverFormSchema = z.object({
  facility_id: z.string().min(1, 'Facility ID is required'),
  rack_id: z.string().min(1, 'Rack ID is required'),
  exptected_lifetime: z.coerce.number().min(1, 'Expected lifetime must be at least 1 year'),
  cooling_type: z.enum(['direct-to-chip', 'immersion', 'back-door-liquid', 'back-door-fan', 'air'], {
    errorMap: () => ({ message: 'Please select a cooling type' }),
  }),
  description: z.string().optional(),
  rated_power: z.coerce.number().positive().optional().or(z.literal('')),
  total_cpu_sockets: z.coerce.number().int().positive().optional().or(z.literal('')),
  number_of_psus: z.coerce.number().int().positive().optional().or(z.literal('')),
  total_installed_memory: z.coerce.number().positive().optional().or(z.literal('')),
  number_of_memory_units: z.coerce.number().int().positive().optional().or(z.literal('')),

  // Environmental impact assessment fields (all optional)
  climate_change: z.coerce.number().positive().optional().or(z.literal('')),
  primary_energy_use: z.coerce.number().positive().optional().or(z.literal('')),
  ozone_depletion: z.coerce.number().positive().optional().or(z.literal('')),
  human_toxicity: z.coerce.number().positive().optional().or(z.literal('')),
  photochemical_oxidant_formation: z.coerce.number().positive().optional().or(z.literal('')),
  particulate_matter_formation: z.coerce.number().positive().optional().or(z.literal('')),
  ionizing_radiation: z.coerce.number().positive().optional().or(z.literal('')),
  terrestrial_acidification: z.coerce.number().positive().optional().or(z.literal('')),
  freshwater_eutrophication: z.coerce.number().positive().optional().or(z.literal('')),
  marine_eutrophication: z.coerce.number().positive().optional().or(z.literal('')),
  terrestrial_ecotoxicity: z.coerce.number().positive().optional().or(z.literal('')),
  freshwater_ecotoxicity: z.coerce.number().positive().optional().or(z.literal('')),
  marine_ecotoxicity: z.coerce.number().positive().optional().or(z.literal('')),
  agricultural_land_occupation: z.coerce.number().positive().optional().or(z.literal('')),
  urban_land_occupation: z.coerce.number().positive().optional().or(z.literal('')),
  natural_land_transformation: z.coerce.number().positive().optional().or(z.literal('')),
  abiotic_depletion_potential: z.coerce.number().positive().optional().or(z.literal('')),
});

type ServerFormValues = z.infer<typeof serverFormSchema>;

export default function NewServerPage() {
  const params = useParams();
  const router = useRouter();
  const facilityId = params.facilityId as string;
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch racks for the facility
  const { data: racksData } = useSWR(
    `/api/racks?facility_id=${facilityId}`,
    fetcher
  );

  const form = useForm<ServerFormValues>({
    resolver: zodResolver(serverFormSchema),
    defaultValues: {
      facility_id: facilityId,
      rack_id: '',
      exptected_lifetime: '',
      cooling_type: 'air',
      description: '',
      rated_power: '',
      total_cpu_sockets: '',
      number_of_psus: '',
      total_installed_memory: '',
      number_of_memory_units: '',
      climate_change: '',
      primary_energy_use: '',
      ozone_depletion: '',
      human_toxicity: '',
      photochemical_oxidant_formation: '',
      particulate_matter_formation: '',
      ionizing_radiation: '',
      terrestrial_acidification: '',
      freshwater_eutrophication: '',
      marine_eutrophication: '',
      terrestrial_ecotoxicity: '',
      freshwater_ecotoxicity: '',
      marine_ecotoxicity: '',
      agricultural_land_occupation: '',
      urban_land_occupation: '',
      natural_land_transformation: '',
      abiotic_depletion_potential: '',
    },
  });

  const onSubmit = async (values: ServerFormValues) => {
    setIsSubmitting(true);
    try {
      // Build the impact assessment object only if at least one field is filled
      const impactAssessment: Record<string, number> = {};
      const impactFields = [
        'climate_change',
        'primary_energy_use',
        'ozone_depletion',
        'human_toxicity',
        'photochemical_oxidant_formation',
        'particulate_matter_formation',
        'ionizing_radiation',
        'terrestrial_acidification',
        'freshwater_eutrophication',
        'marine_eutrophication',
        'terrestrial_ecotoxicity',
        'freshwater_ecotoxicity',
        'marine_ecotoxicity',
        'agricultural_land_occupation',
        'urban_land_occupation',
        'natural_land_transformation',
        'abiotic_depletion_potential',
      ];

      impactFields.forEach((field) => {
        const value = values[field as keyof ServerFormValues];
        if (value && value !== '') {
          impactAssessment[field] = Number(value);
        }
      });

      // Build the request body
      const requestBody: ServerCreate = {
        facility_id: values.facility_id,
        rack_id: values.rack_id,
        exptected_lifetime: Number(values.exptected_lifetime),
        cooling_type: values.cooling_type,
      };

      // Add optional fields only if they have values
      if (values.description) requestBody.description = values.description;
      if (values.rated_power) requestBody.rated_power = Number(values.rated_power);
      if (values.total_cpu_sockets) requestBody.total_cpu_sockets = Number(values.total_cpu_sockets);
      if (values.number_of_psus) requestBody.number_of_psus = Number(values.number_of_psus);
      if (values.total_installed_memory) requestBody.total_installed_memory = Number(values.total_installed_memory);
      if (values.number_of_memory_units) requestBody.number_of_memory_units = Number(values.number_of_memory_units);

      if (Object.keys(impactAssessment).length > 0) {
        requestBody.impactAssessment = impactAssessment;
      }

      const response = await fetch('/api/servers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create server');
      }

      const newServer = await response.json();
      toast.success('Server created successfully');
      router.push(`/facilities/${facilityId}/servers/${newServer.id}`);
    } catch (error) {
      console.error('Error creating server:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create server');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create New Server</h1>
        <p className="text-muted-foreground">Add a new server to the facility</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Essential server details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="rack_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rack</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a rack" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {racksData?.items?.map((rack: RackResponse) => (
                          <SelectItem key={rack.id} value={rack.id}>
                            {rack.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="exptected_lifetime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Lifetime (years)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="5" {...field} />
                    </FormControl>
                    <FormDescription>Expected operational lifetime of the server</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cooling_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cooling Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select cooling type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="air">Air</SelectItem>
                        <SelectItem value="direct-to-chip">Direct to Chip</SelectItem>
                        <SelectItem value="immersion">Immersion</SelectItem>
                        <SelectItem value="back-door-liquid">Back Door Liquid</SelectItem>
                        <SelectItem value="back-door-fan">Back Door Fan</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Optional description of the server"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Hardware Specifications */}
          <Card>
            <CardHeader>
              <CardTitle>Hardware Specifications</CardTitle>
              <CardDescription>Server hardware details (all optional)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="rated_power"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rated Power (kW)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="2.5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="total_cpu_sockets"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPU Sockets</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="2" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="number_of_psus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Power Supply Units</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="2" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="total_installed_memory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Memory (GB)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="256" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="number_of_memory_units"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Memory Units</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="8" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Environmental Impact Assessment */}
          <Card>
            <CardHeader>
              <CardTitle>Environmental Impact Assessment</CardTitle>
              <CardDescription>
                All fields are optional. If left blank, values will be automatically retrieved from the Boavizta API based on server specifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="climate_change"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Climate Change (kg CO₂ eq)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="primary_energy_use"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Energy Use (kWh)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ozone_depletion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ozone Depletion (kg CFC-11 eq)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.000001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="human_toxicity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Human Toxicity (kg 1,4-DB eq)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="photochemical_oxidant_formation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Photochemical Oxidant Formation (kg NMVOC)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="particulate_matter_formation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Particulate Matter Formation (kg PM10 eq)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ionizing_radiation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ionizing Radiation (kg U235 eq)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="terrestrial_acidification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Terrestrial Acidification (kg SO₂ eq)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="freshwater_eutrophication"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Freshwater Eutrophication (kg P eq)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="marine_eutrophication"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marine Eutrophication (kg N eq)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="terrestrial_ecotoxicity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Terrestrial Ecotoxicity (kg 1,4-DB eq)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="freshwater_ecotoxicity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Freshwater Ecotoxicity (kg 1,4-DB eq)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="marine_ecotoxicity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marine Ecotoxicity (kg 1,4-DB eq)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="agricultural_land_occupation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Agricultural Land Occupation (m²a)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="urban_land_occupation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Urban Land Occupation (m²a)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="natural_land_transformation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Natural Land Transformation (m²)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="abiotic_depletion_potential"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Abiotic Depletion Potential (kgSbeq)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Server'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
