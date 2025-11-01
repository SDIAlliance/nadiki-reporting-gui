'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

export type TimeRange = 'today' | 'month' | 'lastMonth' | 'year' | 'custom';

export interface TimeRangeValue {
  start: Date;
  end: Date;
}

export interface TimeRangePickerProps {
  title?: string;
  description?: string;
  defaultTimeRange?: TimeRange;
  onChange?: (timeRange: TimeRangeValue | undefined) => void;
}

export function TimeRangePicker({
  title = 'Time Period',
  description = 'Select the time range for analysis',
  defaultTimeRange = 'month',
  onChange,
}: TimeRangePickerProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>(defaultTimeRange);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Handle time range button clicks
  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
    // Trigger onChange callback
    if (onChange) {
      const now = new Date();
      let start: Date;
      let end: Date;

      switch (range) {
        case 'today':
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
          break;
        case 'month':
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          break;
        case 'lastMonth':
          start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
          break;
        case 'year':
          start = new Date(now.getFullYear(), 0, 1);
          end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
          break;
        case 'custom':
          if (startDate && endDate) {
            onChange({ start: startDate, end: endDate });
          }
          return;
        default:
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      }

      onChange({ start, end });
    }
  };

  // Handle custom date changes
  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date);
    setTimeRange('custom');
    if (onChange && date && endDate) {
      onChange({ start: date, end: endDate });
    }
  };

  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date);
    setTimeRange('custom');
    if (onChange && startDate && date) {
      onChange({ start: startDate, end: date });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 items-center">
          {/* Preset buttons */}
          <Button
            variant={timeRange === 'today' ? 'default' : 'outline'}
            onClick={() => handleTimeRangeChange('today')}
            size="sm"
          >
            Today
          </Button>
          <Button
            variant={timeRange === 'month' ? 'default' : 'outline'}
            onClick={() => handleTimeRangeChange('month')}
            size="sm"
          >
            This Month
          </Button>
          <Button
            variant={timeRange === 'lastMonth' ? 'default' : 'outline'}
            onClick={() => handleTimeRangeChange('lastMonth')}
            size="sm"
          >
            Last Month
          </Button>
          <Button
            variant={timeRange === 'year' ? 'default' : 'outline'}
            onClick={() => handleTimeRangeChange('year')}
            size="sm"
          >
            This Year
          </Button>

          {/* Divider */}
          <div className="h-8 w-px bg-border mx-2" />

          {/* Custom date pickers */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Start:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'w-[160px] justify-start text-left font-normal',
                    !startDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'MMM dd, yyyy') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={handleStartDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">To:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'w-[160px] justify-start text-left font-normal',
                    !endDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'MMM dd, yyyy') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={handleEndDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Hook to use the time range picker functionality without the UI
export function useTimeRange(defaultRange: TimeRange = 'month') {
  const [timeRange, setTimeRange] = useState<TimeRange>(defaultRange);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const getDateRange = (): TimeRangeValue | undefined => {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (timeRange) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      case 'custom':
        return startDate && endDate ? { start: startDate, end: endDate } : undefined;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    return { start, end };
  };

  return {
    timeRange,
    setTimeRange,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    getDateRange,
  };
}
