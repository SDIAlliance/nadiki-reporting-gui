import axios from 'axios';
import type { 
  FacilityResponse, 
  FacilityCreate, 
  FacilityUpdate 
} from '@/types/registrar-api/facility-api';
import type { 
  RackResponse, 
  RackCreate, 
  RackUpdate 
} from '@/types/registrar-api/rack-api';
import type { 
  ServerResponse, 
  ServerCreate, 
  ServerUpdate 
} from '@/types/registrar-api/server-api';

const BASE_URL = process.env.REGISTRAR_API_BASE_URL || 'https://registrar.svc.nadiki.work';

// Create axios instance
const apiClient = axios.create({
  baseURL: `${BASE_URL}/v1`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Facility API Client
export const facilityClient = {
  async listFacilities(params?: { limit?: number; offset?: number }) {
    const response = await apiClient.get('/facilities', { params });
    return { data: response.data };
  },

  async createFacility(data: FacilityCreate) {
    const response = await apiClient.post('/facilities', data);
    return { data: response.data };
  },

  async getFacility(params: { facilityId: string }) {
    const response = await apiClient.get(`/facilities/${params.facilityId}`);
    return { data: response.data };
  },

  async updateFacility(params: { facilityId: string }, data: FacilityUpdate) {
    const response = await apiClient.put(`/facilities/${params.facilityId}`, data);
    return { data: response.data };
  },

  async deleteFacility(params: { facilityId: string }) {
    const response = await apiClient.delete(`/facilities/${params.facilityId}`);
    return { data: response.data };
  },
};

// Rack API Client
export const rackClient = {
  async listRacks(params?: { limit?: number; offset?: number }) {
    try {
      const response = await apiClient.get('/racks', { params });
      return { data: response.data };
    } catch (error: any) {
      console.error('List racks error:', error.response?.data || error.message);
      throw error;
    }
  },

  async createRack(data: RackCreate) {
    try {
      console.log('Creating rack with data:', JSON.stringify(data, null, 2));
      const response = await apiClient.post('/racks', data);
      return { data: response.data };
    } catch (error: any) {
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
    try {
      const response = await apiClient.get(`/racks/${params.rackId}`);
      return { data: response.data };
    } catch (error: any) {
      console.error('Get rack error:', error.response?.data || error.message);
      throw error;
    }
  },

  async updateRack(params: { rackId: string }, data: RackUpdate) {
    try {
      const response = await apiClient.put(`/racks/${params.rackId}`, data);
      return { data: response.data };
    } catch (error: any) {
      console.error('Update rack error:', error.response?.data || error.message);
      throw error;
    }
  },

  async deleteRack(params: { rackId: string }) {
    try {
      const response = await apiClient.delete(`/racks/${params.rackId}`);
      return { data: response.data };
    } catch (error: any) {
      console.error('Delete rack error:', error.response?.data || error.message);
      throw error;
    }
  },
};

// Server API Client
export const serverClient = {
  async listServers(params?: { limit?: number; offset?: number }) {
    const response = await apiClient.get('/servers', { params });
    return { data: response.data };
  },

  async createServer(data: ServerCreate) {
    const response = await apiClient.post('/servers', data);
    return { data: response.data };
  },

  async getServer(params: { serverId: string }) {
    const response = await apiClient.get(`/servers/${params.serverId}`);
    return { data: response.data };
  },

  async updateServer(params: { serverId: string }, data: ServerUpdate) {
    const response = await apiClient.put(`/servers/${params.serverId}`, data);
    return { data: response.data };
  },

  async deleteServer(params: { serverId: string }) {
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

