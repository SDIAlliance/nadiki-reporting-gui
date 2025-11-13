import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from 'registrar-api-client/client';
import type { ServerUpdate } from 'registrar-api-client/types/server-api';
import { AxiosError } from 'axios';

interface RouteParams {
  params: Promise<{
    serverId: string;
  }>;
}

// GET /api/servers/[serverId] - Get server by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const client = await getServerClient();
    const { serverId } = await params;
    const response = await client.getServer({ serverId });
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error getting server:', error);
    
    // Handle not found errors from the API
    if (error instanceof AxiosError && 'response' in error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 404) {
        return NextResponse.json(
          { error: 'Server not found' },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to get server' },
      { status: 500 }
    );
  }
}

// PUT /api/servers/[serverId] - Update server
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const client = await getServerClient();
    const body: ServerUpdate = await request.json();
    const { serverId } = await params;

    const response = await client.updateServer(
      { serverId },
      body
    );
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error updating server:', error);
    
    // Handle validation and not found errors from the API
    if (error instanceof AxiosError && 'response' in error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 400) {
        return NextResponse.json(
          { error: 'Invalid server data', details: axiosError.response.data },
          { status: 400 }
        );
      }
      if (axiosError.response?.status === 404) {
        return NextResponse.json(
          { error: 'Server not found' },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to update server' },
      { status: 500 }
    );
  }
}

// DELETE /api/servers/[serverId] - Delete server
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const client = await getServerClient();
    const { serverId } = await params;
    await client.deleteServer({ serverId });
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting server:', error);
    
    // Handle not found errors from the API
    if (error instanceof AxiosError && 'response' in error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 404) {
        return NextResponse.json(
          { error: 'Server not found' },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to delete server' },
      { status: 500 }
    );
  }
}