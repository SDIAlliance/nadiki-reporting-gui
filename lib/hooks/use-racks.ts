import useSWR from 'swr';
import type { RackResponse } from '@/types/registrar-api/rack-api';

interface RacksListResponse {
  items?: RackResponse[];
  total?: number;
  limit?: number;
  offset?: number;
}

// Generic fetcher function for API calls
const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch data');
  }
  return response.json();
};

// Hook to fetch list of racks
export function useRacks(limit?: number, offset?: number) {
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit.toString());
  if (offset) params.append('offset', offset.toString());
  
  const url = `/api/racks${params.toString() ? `?${params.toString()}` : ''}`;
  
  const { data, error, isLoading } = useSWR<RacksListResponse>(url, fetcher);

  return {
    racks: data?.items || [],
    total: data?.total || 0,
    limit: data?.limit,
    offset: data?.offset,
    isLoading,
    isError: error
  };
}

// Hook to fetch a single rack by ID
export function useRack(rackId: string | null) {
  const { data, error, isLoading } = useSWR<RackResponse>(
    rackId ? `/api/racks/${rackId}` : null,
    fetcher
  );

  return {
    rack: data,
    isLoading,
    isError: error
  };
}