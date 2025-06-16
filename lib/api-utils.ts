// Helper functions for API CRUD operations

// Create a new facility
export async function createFacility(facilityData: any) {
  const response = await fetch('/api/facilities', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(facilityData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create facility');
  }

  return response.json();
}

// Update a facility
export async function updateFacility(facilityId: string, facilityData: any) {
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

// Create a new rack
export async function createRack(rackData: any) {
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
    
    const detailedError = new Error(errorMessage);
    (detailedError as any).response = { data: error };
    throw detailedError;
  }

  return response.json();
}

// Update a rack
export async function updateRack(rackId: string, rackData: any) {
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