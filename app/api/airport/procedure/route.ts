import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.AIRPORT_API_URL_PROCEDURE;

// Get allowlist from environment variable
const PROCEDURE_ALLOWLIST = (process.env.PROCEDURE_ALLOWLIST || '')
  .split(',')
  .map(p => p.trim())
  .filter(Boolean);

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.AIRPORT_API_KEY;
    if (!apiKey || !API_URL) {
      return NextResponse.json(
        { error: 'Missing AIRPORT_API_KEY or AIRPORT_API_URL_PROCEDURE environment variable' },
        { status: 500 }
      );
    }

    const body = await request.json();

    // Check if procedure is in allowlist
    const procedureName = body.procedure;
    if (PROCEDURE_ALLOWLIST.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Procedure rejected: PROCEDURE_ALLOWLIST is empty (safety policy).' },
        { status: 403 }
      );
    }
    
    if (!PROCEDURE_ALLOWLIST.includes(procedureName)) {
      return NextResponse.json(
        { success: false, error: `Procedure "${procedureName}" is not in the allowlist.` },
        { status: 403 }
      );
    }

    console.log('[airport/procedure] request:', body);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(body),
    });

    const data = await response.text();

    console.log('[airport/procedure] response status:', response.status);
    console.log('[airport/procedure] response body:', data);

    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
