import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { readAuthToken } from '@/lib/api/tokenCookie';

if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const BACKEND_IDENTITY_URL = process.env.API_BASE_IDENTITY?.replace(/\/api\/?$/, '') || 'https://localhost:7125';

async function getAuthHeader(request: NextRequest): Promise<Record<string, string>> {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader !== 'Bearer null' && authHeader !== 'Bearer undefined') {
    return { Authorization: authHeader };
  }

  const cookieStore = await cookies();
  const token = readAuthToken((name) => cookieStore.get(name)?.value);
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

export async function POST(request: NextRequest) {
  const targetUrl = `${BACKEND_IDENTITY_URL}/api/Marketing/broadcast-push`;

  try {
    const authHeaders = await getAuthHeader(request);
    const body = await request.json();

    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
    
    const errText = await res.text();
    console.error('[Next.js Marketing Proxy] Backend HTTP Error:', res.status, errText);
    return NextResponse.json({ message: errText || `Backend HTTP ${res.status}` }, { status: res.status });
  } catch (err) {
    console.error('[Next.js Marketing Proxy] Backend exception:', err);
    return NextResponse.json(
      { message: 'Error de conexión con el backend de marketing', error: String(err) },
      { status: 502 }
    );
  }
}
