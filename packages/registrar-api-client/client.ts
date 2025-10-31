import axios, { AxiosError } from 'axios';
import https from 'https';
import type {
  FacilityResponse,
  FacilityCreate,
  FacilityUpdate
} from './types/facility-api';
import type {
  RackResponse,
  RackCreate,
  RackUpdate
} from './types/rack-api';
import type {
  ServerResponse,
  ServerCreate,
  ServerUpdate
} from './types/server-api';
import { getCloudflareContext  } from '@opennextjs/cloudflare';

const createApiClient = async () => {
  const ctx = await getCloudflareContext({ async: true })
  const BASE_URL = ctx.env.REGISTRAR_API_BASE_URL || 'https://registrar.svc.nadiki.work';

  // Create HTTPS agent that ignores certificate validation
  // WARNING: This disables SSL/TLS certificate verification and should only be used
  // in development/testing environments with self-signed or expired certificates.
  // DO NOT use in production as it makes the connection vulnerable to MITM attacks.
  const httpsAgent = new https.Agent({
    rejectUnauthorized: false
  });

  // Create axios instance
  const apiClient = axios.create({
    baseURL: `${BASE_URL}/v1`,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
    auth: {
      username: ctx.env.REGISTRAR_API_USERNAME || '',
      password: ctx.env.REGISTRAR_API_PASSWORD || ''
    },
    httpsAgent: httpsAgent
  });

  return apiClient;
}


// Facility API Client
export const facilityClient = {
  async listFacilities(params?: { limit?: number; offset?: number }) {
    const apiClient = await createApiClient();
    const response = await apiClient.get('/facilities', { params });
    return { data: response.data };
  },

  async createFacility(data: FacilityCreate) {
    const apiClient = await createApiClient();
    const response = await apiClient.post('/facilities', data);
    return { data: response.data };
  },

  async getFacility(params: { facilityId: string }) {
    const apiClient = await createApiClient();
    const response = await apiClient.get(`/facilities/${params.facilityId}`);
    return { data: response.data as FacilityResponse };
  },

  async updateFacility(params: { facilityId: string }, data: FacilityUpdate) {
    const apiClient = await createApiClient();
    const response = await apiClient.put(`/facilities/${params.facilityId}`, data);
    return { data: response.data };
  },

  async deleteFacility(params: { facilityId: string }) {
    const apiClient = await createApiClient();
    const response = await apiClient.delete(`/facilities/${params.facilityId}`);
    return { data: response.data };
  },
};

// Rack API Client
export const rackClient = {
  async listRacks(params?: { limit?: number; offset?: number }) {
    const apiClient = await createApiClient();
    try {
      const response = await apiClient.get('/racks', { params });
      return { data: response.data };
    } catch (err: unknown) {
      const error = err as AxiosError;
      console.error('List racks error:', error.response?.data || error.message);
      throw error;
    }
  },

  async createRack(data: RackCreate) {
    const apiClient = await createApiClient();
    try {
      console.log('Creating rack with data:', JSON.stringify(data, null, 2));
      const response = await apiClient.post('/racks', data);
      return { data: response.data };
    } catch (err: unknown) {
      const error = err as AxiosError;
      console.error('Create rack error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        requestData: data
      });
      throw error;
    }
  },

  async getRack(params: { rackId: string }) {
    const apiClient = await createApiClient();
    try {
      const response = await apiClient.get(`/racks/${params.rackId}`);
      return { data: response.data as RackResponse };
    } catch (err: unknown) {
      const error = err as AxiosError
      console.error('Get rack error:', error.response?.data || error.message);
      throw error;
    }
  },

  async updateRack(params: { rackId: string }, data: RackUpdate) {
    const apiClient = await createApiClient();
    try {
      const response = await apiClient.put(`/racks/${params.rackId}`, data);
      return { data: response.data };
    } catch (err: unknown) {
      const error = err as AxiosError;
      console.error('Update rack error:', error.response?.data || error.message);
      throw error;
    }
  },

  async deleteRack(params: { rackId: string }) {
    const apiClient = await createApiClient();
    try {
      const response = await apiClient.delete(`/racks/${params.rackId}`);
      return { data: response.data };
    } catch (err: unknown) {
      const error = err as AxiosError;
      console.error('Delete rack error:', error.response?.data || error.message);
      throw error;
    }
  },
};

// Server API Client
export const serverClient = {
  async listServers(params?: { limit?: number; offset?: number }) {
    const apiClient = await createApiClient();
    const response = await apiClient.get('/servers', { params });
    return { data: response.data };
  },

  async createServer(data: ServerCreate) {
    const apiClient = await createApiClient();
    const response = await apiClient.post('/servers', data);
    return { data: response.data };
  },

  async getServer(params: { serverId: string }) {
    const apiClient = await createApiClient();
    const response = await apiClient.get(`/servers/${params.serverId}`);
    return { data: response.data as ServerResponse };
  },

  async updateServer(params: { serverId: string }, data: ServerUpdate) {
    const apiClient = await createApiClient();
    const response = await apiClient.put(`/servers/${params.serverId}`, data);
    return { data: response.data };
  },

  async deleteServer(params: { serverId: string }) {
    const apiClient = await createApiClient();
    const response = await apiClient.delete(`/servers/${params.serverId}`);
    return { data: response.data };
  },
};

// Legacy function exports for backward compatibility
export async function getFacilityClient() {
  return facilityClient;
}

export async function getRackClient() {
  return rackClient;
}

export async function getServerClient() {
  return serverClient;
}

