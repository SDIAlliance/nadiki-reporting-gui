import { NextRequest, NextResponse } from 'next/server';
import { getFacilityClient } from 'registrar-api-client/client';
import type { FacilityCreate } from 'registrar-api-client/types/facility-api';
import { AxiosError } from 'axios';

// GET /api/facilities - List all facilities
export async function GET(request: NextRequest) {
  try {
    const client = await getFacilityClient();
    const { searchParams } = new URL(request.url);
    
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
    
    const response = await client.listFacilities({ limit, offset });
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error listing facilities:', error);
    return NextResponse.json(
      { error: 'Failed to list facilities' },
      { status: 500 }
    );
  }
}

// POST /api/facilities - Create a new facility
export async function POST(request: NextRequest) {
  try {
    const client = await getFacilityClient();
    const body: FacilityCreate = await request.json();
    
    const response = await client.createFacility(body);
    
    return NextResponse.json(response.data, { status: 201 });
  } catch (error) {
    console.error('Error creating facility:', error);
    
    // Handle validation errors from the API
    if (error instanceof AxiosError && 'response' in error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 400) {
        return NextResponse.json(
          { error: 'Invalid facility data', details: axiosError.response.data },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create facility' },
      { status: 500 }
    );
  }
}