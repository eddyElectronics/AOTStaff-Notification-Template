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

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Procedure request failed');
  }

  return response.json();
}
