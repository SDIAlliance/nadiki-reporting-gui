'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { OnsiteRenewableEnergyChart } from '@/components/charts/OnsiteRenewableEnergyChart';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import type { FacilityResponse } from '@/packages/registrar-api-client/types/facility-api';

const fetcher = (url: string) => fetch(url).then(res => res.json());

type TimeRange = 'today' | 'month' | 'year' | 'custom';

export default function OperationalPage() {
  const params = useParams();
  const facilityId = params.facilityId as string;

  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Fetch facility data using SWR
  const { data: facility, error, isLoading } = useSWR<FacilityResponse>(
    `/api/facilities/${facilityId}`,
    fetcher
  );

  // Calculate actual date range based on selected time range
  const getDateRange = () => {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    switch (timeRange) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      case 'custom':
        return startDate && endDate ? { start: startDate, end: endDate } : undefined;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return { start, end };
  };

  // Prepare InfluxDB configuration from facility data
  const influxConfig = facility?.timeSeriesConfig ? {
    url: facility.timeSeriesConfig.endpoint,
    token: facility.timeSeriesConfig.token,
    org: facility.timeSeriesConfig.org,
  } : undefined;

  if (error) {
    return (
      <div className="p-8">
        <div className="text-destructive">Error loading facility data</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-muted-foreground">Loading facility data...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{facility?.id || facilityId}</h1>
        <p className="text-muted-foreground">Operational Metrics Dashboard</p>
      </div>

      <div className="grid gap-6">
        {/* Time Range Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Time Period</CardTitle>
            <CardDescription>Select the time range for operational analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <Button
                  variant={timeRange === 'today' ? 'default' : 'outline'}
                  onClick={() => setTimeRange('today')}
                >
                  Today
                </Button>
                <Button
                  variant={timeRange === 'month' ? 'default' : 'outline'}
                  onClick={() => setTimeRange('month')}
                >
                  This Month
                </Button>
                <Button
                  variant={timeRange === 'year' ? 'default' : 'outline'}
                  onClick={() => setTimeRange('year')}
                >
                  This Year
                </Button>
              </div>

              <div className="flex gap-4 items-center">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Start</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-[240px] justify-start text-left font-normal',
                          !startDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">To</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-[240px] justify-start text-left font-normal',
                          !endDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Onsite Renewable Energy Chart */}
        <OnsiteRenewableEnergyChart
          facilityId={facilityId}
          influxConfig={influxConfig}
          bucket={facility?.timeSeriesConfig?.bucket || 'facility-metrics'}
          timeRange={getDateRange()}
        />

        {/* Additional Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Server Uptime</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">99.8%</div>
              <p className="text-xs text-muted-foreground">+0.2% from last period</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Average Temperature</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">22.5°C</div>
              <p className="text-xs text-muted-foreground">-0.5°C from last period</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Cooling Efficiency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.8 COP</div>
              <p className="text-xs text-muted-foreground">+0.1 from last period</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
