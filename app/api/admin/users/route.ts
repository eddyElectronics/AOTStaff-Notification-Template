import { NextRequest, NextResponse } from 'next/server';

const AIRPORT_API_URL = process.env.AIRPORT_API_URL_PROCEDURE;
const AIRPORT_API_KEY = process.env.AIRPORT_API_KEY;
const AIRPORT_DATABASE = process.env.NEXT_PUBLIC_AIRPORT_DATABASE || 'Notification';

// GET - Get all users
export async function GET() {
  if (!AIRPORT_API_URL || !AIRPORT_API_KEY) {
    return NextResponse.json({ error: 'API not configured' }, { status: 500 });
  }

  try {
    const response = await fetch(AIRPORT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': AIRPORT_API_KEY,
      },
      body: JSON.stringify({
        database: AIRPORT_DATABASE,
        procedure: 'sp_GetAllAuthorizedUsers',
        parameters: {},
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: response.status });
    }

    const data = await response.json();
    const users = data.data || data;
    
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add new user
export async function POST(request: NextRequest) {
  if (!AIRPORT_API_URL || !AIRPORT_API_KEY) {
    return NextResponse.json({ error: 'API not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { employeeId, isAdmin = false } = body;

    if (!employeeId) {
      return NextResponse.json({ error: 'EmployeeId is required' }, { status: 400 });
    }

    const response = await fetch(AIRPORT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': AIRPORT_API_KEY,
      },
      body: JSON.stringify({
        database: AIRPORT_DATABASE,
        procedure: 'sp_AddAuthorizedUser',
        parameters: {
          EmployeeId: employeeId,
          IsAdmin: isAdmin ? 1 : 0,
        },
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to add user' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error adding user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove user
export async function DELETE(request: NextRequest) {
  if (!AIRPORT_API_URL || !AIRPORT_API_KEY) {
    return NextResponse.json({ error: 'API not configured' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');

    if (!employeeId) {
      return NextResponse.json({ error: 'EmployeeId is required' }, { status: 400 });
    }

    const response = await fetch(AIRPORT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': AIRPORT_API_KEY,
      },
      body: JSON.stringify({
        database: AIRPORT_DATABASE,
        procedure: 'sp_RemoveAuthorizedUser',
        parameters: {
          EmployeeId: employeeId,
        },
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to remove user' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error removing user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update user admin status
export async function PATCH(request: NextRequest) {
  if (!AIRPORT_API_URL || !AIRPORT_API_KEY) {
    return NextResponse.json({ error: 'API not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { employeeId, isAdmin } = body;

    if (!employeeId || isAdmin === undefined) {
      return NextResponse.json({ error: 'EmployeeId and isAdmin are required' }, { status: 400 });
    }

    const response = await fetch(AIRPORT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': AIRPORT_API_KEY,
      },
      body: JSON.stringify({
        database: AIRPORT_DATABASE,
        procedure: 'sp_UpdateUserAdmin',
        parameters: {
          EmployeeId: employeeId,
          IsAdmin: isAdmin ? 1 : 0,
        },
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to update user' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
