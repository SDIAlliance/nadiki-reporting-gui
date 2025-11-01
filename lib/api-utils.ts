// Helper functions for API CRUD operations

interface FacilityData {
  location: { latitude: number; longitude: number };
  description?: string;
  [key: string]: unknown;
}

// Create a new facility
export async function createFacility(facilityData: FacilityData) {
  const response = await fetch('/api/facilities', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(facilityData),
  });

  if (!response.ok) {
    const error = await response.json() as { error?: string };
    throw new Error(error.error || 'Failed to create facility');
  }

  return response.json();
}

// Update a facility
export async function updateFacility(facilityId: string, facilityData: Partial<FacilityData>) {
  const response = await fetch(`/api/facilities/${facilityId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(facilityData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update facility');
  }

  return response.json();
}

// Delete a facility
export async function deleteFacility(facilityId: string) {
  const response = await fetch(`/api/facilities/${facilityId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete facility');
  }
}

interface RackData {
  facility_id: string;
  total_available_power?: number;
  total_available_cooling_capacity?: number;
  number_of_pdus?: number;
  power_redundancy?: number;
  description?: string;
}

// Create a new rack
export async function createRack(rackData: RackData) {
  console.log('API utils createRack called with:', JSON.stringify(rackData, null, 2));
  
  const response = await fetch('/api/racks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(rackData),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('API utils createRack error response:', {
      status: response.status,
      statusText: response.statusText,
      error: error
    });
    
    // Create a more detailed error
    const errorMessage = error.validationErrors 
      ? `Validation Error: ${error.validationErrors}`
      : error.details 
        ? `API Error: ${JSON.stringify(error.details, null, 2)}`
        : error.error || 'Failed to create rack';
    
    const detailedError = new Error(errorMessage) as Error & { response?: { data: unknown } };
    detailedError.response = { data: error };
    throw detailedError;
  }

  return response.json();
}

// Update a rack
export async function updateRack(rackId: string, rackData: Partial<RackData>) {
  const response = await fetch(`/api/racks/${rackId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(rackData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update rack');
  }

  return response.json();
}

// Delete a rack
export async function deleteRack(rackId: string) {
  const response = await fetch(`/api/racks/${rackId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete rack');
  }
}