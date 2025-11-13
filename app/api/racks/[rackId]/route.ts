import { NextRequest, NextResponse } from 'next/server';
import { getRackClient } from 'registrar-api-client/client';
import type { RackUpdate } from 'registrar-api-client/types/rack-api';
import { AxiosError } from 'axios';

interface RouteParams {
  params: Promise<{
    rackId: string;
  }>;
}

// GET /api/racks/[rackId] - Get rack by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const client = await getRackClient();
    const { rackId } = await params;
    const response = await client.getRack({ rackId });
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error getting rack:', error);
    
    // Handle not found errors from the API
    if (error instanceof AxiosError && 'response' in error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 404) {
        return NextResponse.json(
          { error: 'Rack not found' },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to get rack' },
      { status: 500 }
    );
  }
}

// PUT /api/racks/[rackId] - Update rack
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const client = await getRackClient();
    const body: RackUpdate = await request.json();
    const { rackId } = await params;

    const response = await client.updateRack(
      { rackId },
      body
    );
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error updating rack:', error);
    
    // Handle validation and not found errors from the API
    if (error instanceof AxiosError && 'response' in error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 400) {
        return NextResponse.json(
          { error: 'Invalid rack data', details: axiosError.response.data },
          { status: 400 }
        );
      }
      if (axiosError.response?.status === 404) {
        return NextResponse.json(
          { error: 'Rack not found' },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to update rack' },
      { status: 500 }
    );
  }
}

// DELETE /api/racks/[rackId] - Delete rack
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const client = await getRackClient();
    const { rackId } = await params;
    await client.deleteRack({ rackId });
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting rack:', error);
    
    // Handle not found errors from the API
    if (error instanceof AxiosError && 'response' in error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 404) {
        return NextResponse.json(
          { error: 'Rack not found' },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to delete rack' },
      { status: 500 }
    );
  }
}