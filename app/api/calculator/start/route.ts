import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { facilityClient } from 'registrar-api-client/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { facilityId: string; startingPoint?: number };
    const { facilityId, startingPoint } = body;

    if (!facilityId) {
      return NextResponse.json(
        { error: 'Facility ID is required' },
        { status: 400 }
      );
    }

    // Get Cloudflare context
    const ctx = await getCloudflareContext({ async: true });

    // Fetch facility data using the existing client
    const facilityResponse = await facilityClient.getFacility({
      facilityId: facilityId,
    });

    if (!facilityResponse.data) {
      return NextResponse.json(
        { error: 'Facility not found' },
        { status: 404 }
      );
    }

    const facility = facilityResponse.data;

    // Call the Cloudflare RPC service to start the calculator
    await ctx.env.IMPACT_CALCULATOR_RPC_SERVICE.createFacilityCalculator(
      facilityId,
      facility,
      startingPoint || 0
    );

    return NextResponse.json({
      success: true,
      message: 'Environmental impact calculator started successfully',
      facilityId,
      startingPoint: startingPoint || 0,
    });

  } catch (error) {
    console.error('Error starting calculator:', error);
    return NextResponse.json(
      { error: 'Failed to start calculator', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}