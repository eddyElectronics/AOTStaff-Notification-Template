const DEFAULT_DATABASE = process.env.NEXT_PUBLIC_AIRPORT_DATABASE || 'Notification';

type AirportApiResponse<T = unknown> = {
  data?: T;
  error?: string;
  [key: string]: unknown;
};

export async function callAirportQuery<T = unknown>(
  query: string,
  parameters: Record<string, unknown> = {},
  database = DEFAULT_DATABASE
): Promise<AirportApiResponse<T>> {
  const response = await fetch('/api/airport/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      database,
      query,
      parameters,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Query request failed');
  }

  return response.json();
}

export async function callAirportProcedure<T = unknown>(
  procedure: string,
  parameters: Record<string, unknown> = {},
  database = DEFAULT_DATABASE
): Promise<AirportApiResponse<T>> {
  const response = await fetch('/api/airport/procedure', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      database,
      procedure,
      parameters,
    }),
  });

  const text = await response.text();
  
  // Try to parse response as JSON first
  try {
    const json = JSON.parse(text);
    
    // Check if API returned success: false
    if (json.success === false) {
      console.error(`Procedure ${procedure} failed:`, json.error);
      return { data: undefined, error: json.error || 'Procedure failed' };
    }
    
    if (!response.ok) {
      return { data: undefined, error: json.error || text || 'Procedure request failed' };
    }
    
    return json;
  } catch {
    if (!response.ok) {
      console.error(`Procedure ${procedure} failed with status ${response.status}:`, text);
      return { data: undefined, error: text || 'Procedure request failed' };
    }
    console.error('Failed to parse procedure response:', text);
    return { data: undefined, error: 'Invalid JSON response' };
  }
}
