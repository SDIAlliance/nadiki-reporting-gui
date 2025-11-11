import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/utils/supabase/server-client';

export const runtime = 'nodejs';

interface WorkloadCreateRequest {
  server_id: string;
  facility_id: string;
  pod_name: string;
}

interface WorkloadValidationError {
  field: string;
  message: string;
}

// Validation function for workload creation
function validateWorkloadRequest(body: unknown): { valid: boolean; errors: WorkloadValidationError[] } {
  const errors: WorkloadValidationError[] = [];

  if (!body || typeof body !== 'object') {
    return { valid: false, errors: [{ field: 'body', message: 'Request body must be a JSON object' }] };
  }

  const data = body as Partial<WorkloadCreateRequest>;

  // Validate server_id
  if (!data.server_id) {
    errors.push({ field: 'server_id', message: 'server_id is required' });
  } else if (typeof data.server_id !== 'string') {
    errors.push({ field: 'server_id', message: 'server_id must be a string' });
  } else if (data.server_id.trim().length === 0) {
    errors.push({ field: 'server_id', message: 'server_id cannot be empty' });
  }

  // Validate facility_id
  if (!data.facility_id) {
    errors.push({ field: 'facility_id', message: 'facility_id is required' });
  } else if (typeof data.facility_id !== 'string') {
    errors.push({ field: 'facility_id', message: 'facility_id must be a string' });
  } else if (data.facility_id.trim().length === 0) {
    errors.push({ field: 'facility_id', message: 'facility_id cannot be empty' });
  }

  // Validate pod_name
  if (!data.pod_name) {
    errors.push({ field: 'pod_name', message: 'pod_name is required' });
  } else if (typeof data.pod_name !== 'string') {
    errors.push({ field: 'pod_name', message: 'pod_name must be a string' });
  } else if (data.pod_name.trim().length === 0) {
    errors.push({ field: 'pod_name', message: 'pod_name cannot be empty' });
  }

  return { valid: errors.length === 0, errors };
}

// POST /api/workloads - Create a new workload
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json(
        {
          error: 'Invalid JSON in request body',
          details: parseError instanceof Error ? parseError.message : 'Failed to parse JSON'
        },
        { status: 400 }
      );
    }

    // Validate request data
    const validation = validateWorkloadRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.errors
        },
        { status: 400 }
      );
    }

    const workloadData = body as WorkloadCreateRequest;

    // Create Supabase client
    const supabase = await createSupabaseServerClient();

    // Check for duplicate workload (same server_id, facility_id, and pod_name)
    const { data: existingWorkload, error: checkError } = await supabase
      .from('workloads')
      .select('id, server_id, facility_id, pod_name')
      .eq('server_id', workloadData.server_id)
      .eq('facility_id', workloadData.facility_id)
      .eq('pod_name', workloadData.pod_name)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is what we want
      console.error('Error checking for existing workload:', checkError);
      return NextResponse.json(
        {
          error: 'Database error while checking for duplicates',
          details: checkError.message
        },
        { status: 500 }
      );
    }

    if (existingWorkload) {
      return NextResponse.json(
        {
          error: 'Workload already exists',
          details: `A workload with server_id "${workloadData.server_id}", facility_id "${workloadData.facility_id}", and pod_name "${workloadData.pod_name}" already exists`,
          existing_workload: existingWorkload
        },
        { status: 409 }
      );
    }

    // Insert the workload
    const { data: newWorkload, error: insertError } = await supabase
      .from('workloads')
      .insert({
        server_id: workloadData.server_id,
        facility_id: workloadData.facility_id,
        pod_name: workloadData.pod_name,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating workload:', insertError);
      return NextResponse.json(
        {
          error: 'Failed to create workload',
          details: insertError.message,
          code: insertError.code
        },
        { status: 500 }
      );
    }

    console.log('Successfully created workload:', newWorkload);
    return NextResponse.json(newWorkload, { status: 201 });

  } catch (error) {
    console.error('Unexpected error creating workload:', error);
    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/workloads - List all workloads
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(request.url);

    // Build query with optional filters
    let query = supabase.from('workloads').select('*');

    const server_id = searchParams.get('server_id');
    const facility_id = searchParams.get('facility_id');
    const pod_name = searchParams.get('pod_name');

    if (server_id) {
      query = query.eq('server_id', server_id);
    }
    if (facility_id) {
      query = query.eq('facility_id', facility_id);
    }
    if (pod_name) {
      query = query.eq('pod_name', pod_name);
    }

    // Order by created_at descending
    query = query.order('created_at', { ascending: false });

    const { data: workloads, error } = await query;

    if (error) {
      console.error('Error listing workloads:', error);
      return NextResponse.json(
        {
          error: 'Failed to list workloads',
          details: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json(workloads);
  } catch (error) {
    console.error('Unexpected error listing workloads:', error);
    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
