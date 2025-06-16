import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/registrar-api/client';
import type { ServerUpdate } from '@/types/registrar-api/server-api';

interface RouteParams {
  params: {
    serverId: string;
  };
}

// GET /api/servers/[serverId] - Get server by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const client = await getServerClient();
    const response = await client.getServer({ serverId: params.serverId });
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error getting server:', error);
    
    // Handle not found errors from the API
    if (error instanceof Error && 'response' in error) {
      const axiosError = error as any;
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
    
    const response = await client.updateServer(
      { serverId: params.serverId },
      body
    );
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error updating server:', error);
    
    // Handle validation and not found errors from the API
    if (error instanceof Error && 'response' in error) {
      const axiosError = error as any;
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
    await client.deleteServer({ serverId: params.serverId });
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting server:', error);
    
    // Handle not found errors from the API
    if (error instanceof Error && 'response' in error) {
      const axiosError = error as any;
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