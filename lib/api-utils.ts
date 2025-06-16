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