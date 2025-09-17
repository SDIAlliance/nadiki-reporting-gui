import { NextRequest, NextResponse } from 'next/server';
import { getFacilityClient } from 'registrar-api-client/client';
import type { FacilityUpdate } from 'registrar-api-client/types/facility-api';
import { AxiosError } from 'axios';

interface RouteParams {
  params: {
    facilityId: string;
  };
}

// GET /api/facilities/[facilityId] - Get facility by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const client = await getFacilityClient();
    const { facilityId } = await params
    const response = await client.getFacility({ facilityId });
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error getting facility:', error);
    
    // Handle not found errors from the API
    if (error instanceof AxiosError && 'response' in error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 404) {
        return NextResponse.json(
          { error: 'Facility not found' },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to get facility' },
      { status: 500 }
    );
  }
}

// PUT /api/facilities/[facilityId] - Update facility
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const client = await getFacilityClient();
    const body: FacilityUpdate = await request.json();
    const { facilityId } = await params
    
    const response = await client.updateFacility(
      { facilityId },
      body
    );
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error updating facility:', error);
    
    // Handle validation and not found errors from the API
    if (error instanceof AxiosError && 'response' in error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 400) {
        return NextResponse.json(
          { error: 'Invalid facility data', details: axiosError.response.data },
          { status: 400 }
        );
      }
      if (axiosError.response?.status === 404) {
        return NextResponse.json(
          { error: 'Facility not found' },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to update facility' },
      { status: 500 }
    );
  }
}

// DELETE /api/facilities/[facilityId] - Delete facility
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const client = await getFacilityClient();
    await client.deleteFacility({ facilityId: params.facilityId });
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting facility:', error);
    
    // Handle not found errors from the API
    if (error instanceof AxiosError && 'response' in error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 404) {
        return NextResponse.json(
          { error: 'Facility not found' },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to delete facility' },
      { status: 500 }
    );
  }
}