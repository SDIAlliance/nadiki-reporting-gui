'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

// Mock data for the chart
const generateMockData = () => {
  const data = [];
  const baseValue = 100;
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    data.push({
      date: format(date, 'MMM dd'),
      power: Math.floor(baseValue + Math.random() * 50 - 25),
      cooling: Math.floor(baseValue * 0.3 + Math.random() * 20 - 10),
    });
  }
  return data;
};

const chartConfig = {
  power: {
    label: 'Power Usage',
    color: 'hsl(var(--chart-1))',
  },
  cooling: {
    label: 'Cooling',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

type TimeRange = 'today' | 'month' | 'year' | 'custom';

export default function ImpactPage() {
  const params = useParams();
  const facilityId = params.facilityId as string;
  
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [chartData] = useState(generateMockData());

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{facilityId}</h1>
        <p className="text-muted-foreground">Environmental Impact Dashboard</p>
      </div>

      <div className="grid gap-6">
        {/* Time Range Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Time Period</CardTitle>
            <CardDescription>Select the time range for impact analysis</CardDescription>
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

        {/* Area Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Power & Cooling Usage</CardTitle>
            <CardDescription>
              Interactive chart showing power and cooling consumption over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <AreaChart
                accessibilityLayer
                data={chartData}
                margin={{
                  left: 12,
                  right: 12,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value.slice(0, 6)}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Area
                  dataKey="cooling"
                  type="natural"
                  fill="var(--color-cooling)"
                  fillOpacity={0.4}
                  stroke="var(--color-cooling)"
                  stackId="a"
                />
                <Area
                  dataKey="power"
                  type="natural"
                  fill="var(--color-power)"
                  fillOpacity={0.4}
                  stroke="var(--color-power)"
                  stackId="a"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Additional Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Total Power Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3,245 kWh</div>
              <p className="text-xs text-muted-foreground">+12% from last period</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Average PUE</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1.58</div>
              <p className="text-xs text-muted-foreground">-0.02 from last period</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">CO2 Emissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234 kg</div>
              <p className="text-xs text-muted-foreground">+8% from last period</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}