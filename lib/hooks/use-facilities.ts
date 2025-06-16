import useSWR from 'swr';
import type { FacilityResponse } from '@/types/registrar-api/facility-api';

interface FacilitiesListResponse {
  items?: FacilityResponse[];
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

// Hook to fetch list of facilities
export function useFacilities(limit?: number, offset?: number) {
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit.toString());
  if (offset) params.append('offset', offset.toString());
  
  const url = `/api/facilities${params.toString() ? `?${params.toString()}` : ''}`;
  
  const { data, error, isLoading } = useSWR<FacilitiesListResponse>(url, fetcher);

  return {
    facilities: data?.items || [],
    total: data?.total || 0,
    limit: data?.limit,
    offset: data?.offset,
    isLoading,
    isError: error
  };
}

// Hook to fetch a single facility by ID
export function useFacility(facilityId: string | null) {
  const { data, error, isLoading } = useSWR<FacilityResponse>(
    facilityId ? `/api/facilities/${facilityId}` : null,
    fetcher
  );

  return {
    facility: data,
    isLoading,
    isError: error
  };
}