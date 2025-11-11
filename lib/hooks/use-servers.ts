import useSWR from 'swr';
import type { ServerResponse } from 'registrar-api-client/types/server-api';

interface ServersListResponse {
  items?: ServerResponse[];
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

// Hook to fetch list of servers with optional filters
export function useServers(options?: {
  facilityId?: string;
  rackId?: string;
  limit?: number;
  offset?: number;
}) {
  const params = new URLSearchParams();
  if (options?.facilityId) params.append('facility_id', options.facilityId);
  if (options?.rackId) params.append('rack_id', options.rackId);
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.offset) params.append('offset', options.offset.toString());

  const url = `/api/servers${params.toString() ? `?${params.toString()}` : ''}`;

  const { data, error, isLoading } = useSWR<ServersListResponse>(url, fetcher);

  return {
    servers: data?.items || [],
    total: data?.total || 0,
    limit: data?.limit,
    offset: data?.offset,
    isLoading,
    isError: error
  };
}

// Hook to fetch a single server by ID
export function useServer(serverId: string | null) {
  const { data, error, isLoading } = useSWR<ServerResponse>(
    serverId ? `/api/servers/${serverId}` : null,
    fetcher
  );

  return {
    server: data,
    isLoading,
    isError: error
  };
}