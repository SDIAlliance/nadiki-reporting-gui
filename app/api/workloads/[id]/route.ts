import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/utils/supabase/server-client';

export const runtime = 'nodejs';

// DELETE /api/workloads/[id] - Delete a workload by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          error: 'Invalid workload ID',
          details: 'The provided ID is not a valid UUID format'
        },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createSupabaseServerClient();

    // Check if workload exists before attempting to delete
    const { data: existingWorkload, error: checkError } = await supabase
      .from('workloads')
      .select('id, server_id, facility_id, pod_name')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        // No rows found
        return NextResponse.json(
          {
            error: 'Workload not found',
            details: `No workload found with ID: ${id}`
          },
          { status: 404 }
        );
      }

      console.error('Error checking for workload:', checkError);
      return NextResponse.json(
        {
          error: 'Database error while checking for workload',
          details: checkError.message
        },
        { status: 500 }
      );
    }

    // Delete the workload
    const { error: deleteError } = await supabase
      .from('workloads')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting workload:', deleteError);
      return NextResponse.json(
        {
          error: 'Failed to delete workload',
          details: deleteError.message,
          code: deleteError.code
        },
        { status: 500 }
      );
    }

    console.log('Successfully deleted workload:', id);
    return NextResponse.json(
      {
        message: 'Workload deleted successfully',
        deleted_workload: existingWorkload
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Unexpected error deleting workload:', error);
    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/workloads/[id] - Get a single workload by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          error: 'Invalid workload ID',
          details: 'The provided ID is not a valid UUID format'
        },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createSupabaseServerClient();

    // Get the workload
    const { data: workload, error } = await supabase
      .from('workloads')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return NextResponse.json(
          {
            error: 'Workload not found',
            details: `No workload found with ID: ${id}`
          },
          { status: 404 }
        );
      }

      console.error('Error fetching workload:', error);
      return NextResponse.json(
        {
          error: 'Failed to fetch workload',
          details: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json(workload);
  } catch (error) {
    console.error('Unexpected error fetching workload:', error);
    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
