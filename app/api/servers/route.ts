import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/registrar-api/client';
import type { ServerCreate } from '@/types/registrar-api/server-api';

// GET /api/servers - List all servers
export async function GET(request: NextRequest) {
  try {
    const client = await getServerClient();
    const { searchParams } = new URL(request.url);
    
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
    
    const response = await client.listServers({ limit, offset });
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error listing servers:', error);
    return NextResponse.json(
      { error: 'Failed to list servers' },
      { status: 500 }
    );
  }
}

// POST /api/servers - Create a new server
export async function POST(request: NextRequest) {
  try {
    const client = await getServerClient();
    const body: ServerCreate = await request.json();
    
    const response = await client.createServer(body);
    
    return NextResponse.json(response.data, { status: 201 });
  } catch (error) {
    console.error('Error creating server:', error);
    
    // Handle validation errors from the API
    if (error instanceof Error && 'response' in error) {
      const axiosError = error as any;
      if (axiosError.response?.status === 400) {
        return NextResponse.json(
          { error: 'Invalid server data', details: axiosError.response.data },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create server' },
      { status: 500 }
    );
  }
}