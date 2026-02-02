import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.AIRPORT_API_URL_QUERY;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.AIRPORT_API_KEY;
    if (!apiKey || !API_URL) {
      return NextResponse.json(
        { error: 'Missing AIRPORT_API_KEY or AIRPORT_API_URL_QUERY environment variable' },
        { status: 500 }
      );
    }

    const body = await request.json();

    console.log('[airport/query] request:', body);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(body),
    });

    const data = await response.text();

    console.log('[airport/query] response status:', response.status);
    console.log('[airport/query] response body:', data);

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
