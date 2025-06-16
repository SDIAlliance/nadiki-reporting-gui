import { NextRequest, NextResponse } from 'next/server';
import { getRackClient } from '@/lib/registrar-api/client';
import type { RackCreate } from '@/types/registrar-api/rack-api';

// GET /api/racks - List all racks
export async function GET(request: NextRequest) {
  try {
    const client = await getRackClient();
    const { searchParams } = new URL(request.url);
    
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
    
    const response = await client.listRacks({ limit, offset });
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error listing racks:', error);
    return NextResponse.json(
      { error: 'Failed to list racks' },
      { status: 500 }
    );
  }
}

// POST /api/racks - Create a new rack
export async function POST(request: NextRequest) {
  try {
    const client = await getRackClient();
    const body: RackCreate = await request.json();
    
    console.log('Rack API route received data:', JSON.stringify(body, null, 2));
    
    const response = await client.createRack(body);
    
    return NextResponse.json(response.data, { status: 201 });
  } catch (error) {
    console.error('Error creating rack:', error);
    
    // Handle validation errors from the API
    if (error instanceof Error && 'response' in error) {
      const axiosError = error as any;
      console.error('Axios error details:', {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        config: axiosError.config ? {
          method: axiosError.config.method,
          url: axiosError.config.url,
          baseURL: axiosError.config.baseURL,
          data: axiosError.config.data
        } : 'No config'
      });
      
      if (axiosError.response?.status === 400) {
        return NextResponse.json(
          { 
            error: 'Invalid rack data', 
            details: axiosError.response.data,
            validationErrors: axiosError.response.data?.details || axiosError.response.data?.message || 'Unknown validation error'
          },
          { status: 400 }
        );
      }
      
      if (axiosError.response?.status === 404) {
        return NextResponse.json(
          { error: 'API endpoint not found', details: axiosError.response.data },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create rack',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}