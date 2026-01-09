import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase';
import {
  getAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
} from '@/lib/db';
import type { AlertInsert } from '@/lib/types';

export const runtime = 'edge';

/**
 * GET /api/alerts
 * Fetch user's active alerts
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth();

    // Fetch user's alerts
    const alerts = await getAlerts(user.id);

    return NextResponse.json({
      success: true,
      alerts,
      count: alerts.length,
    });

  } catch (error) {
    console.error('Error fetching alerts:', error);

    // Check if it's an authentication error
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch alerts',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/alerts
 * Create a new alert subscription
 *
 * Body:
 * {
 *   name: string (required)
 *   min_score?: number
 *   max_price?: number
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth();

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        { error: 'Alert name is required' },
        { status: 400 }
      );
    }

    // Validate optional fields
    if (body.min_score !== undefined) {
      const score = parseInt(body.min_score, 10);
      if (isNaN(score) || score < 0 || score > 100) {
        return NextResponse.json(
          { error: 'min_score must be between 0 and 100' },
          { status: 400 }
        );
      }
    }

    if (body.max_price !== undefined) {
      const price = parseFloat(body.max_price);
      if (isNaN(price) || price <= 0) {
        return NextResponse.json(
          { error: 'max_price must be a positive number' },
          { status: 400 }
        );
      }
    }

    // Create alert data
    const alertData: Omit<AlertInsert, 'user_id'> = {
      name: body.name,
      min_score: body.min_score || null,
      max_price: body.max_price || null,
      is_active: true,
    };

    // Create alert
    const alert = await createAlert(user.id, alertData);

    return NextResponse.json({
      success: true,
      alert,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating alert:', error);

    // Check if it's an authentication error
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create alert',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/alerts
 * Update an existing alert
 *
 * Body:
 * {
 *   id: string (required)
 *   name?: string
 *   min_score?: number
 *   max_price?: number
 *   is_active?: boolean
 * }
 */
export async function PATCH(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth();

    // Parse request body
    const body = await request.json();

    // Validate alert ID
    if (!body.id || typeof body.id !== 'string') {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      );
    }

    // Build update object
    const updates: Partial<AlertInsert> = {};

    if (body.name !== undefined) {
      updates.name = body.name;
    }

    if (body.min_score !== undefined) {
      const score = parseInt(body.min_score, 10);
      if (isNaN(score) || score < 0 || score > 100) {
        return NextResponse.json(
          { error: 'min_score must be between 0 and 100' },
          { status: 400 }
        );
      }
      updates.min_score = score;
    }

    if (body.max_price !== undefined) {
      const price = parseFloat(body.max_price);
      if (isNaN(price) || price <= 0) {
        return NextResponse.json(
          { error: 'max_price must be a positive number' },
          { status: 400 }
        );
      }
      updates.max_price = price;
    }

    if (body.is_active !== undefined) {
      updates.is_active = Boolean(body.is_active);
    }

    // Update alert
    const alert = await updateAlert(body.id, updates);

    return NextResponse.json({
      success: true,
      alert,
    });

  } catch (error) {
    console.error('Error updating alert:', error);

    // Check if it's an authentication error
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to update alert',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/alerts
 * Delete (deactivate) an alert
 *
 * Query Parameters:
 * - id: string (required)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth();

    // Get alert ID from query params
    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get('id');

    if (!alertId) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      );
    }

    // Delete alert
    await deleteAlert(alertId);

    return NextResponse.json({
      success: true,
      message: 'Alert deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting alert:', error);

    // Check if it's an authentication error
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to delete alert',
      },
      { status: 500 }
    );
  }
}
