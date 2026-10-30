import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { readAuthToken } from '@/lib/api/tokenCookie';

if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const BACKEND_URL = process.env.API_BASE_PROCEDURES?.replace(/\/api\/?$/, '') || 'https://localhost:7165';

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = `${BACKEND_URL}/api/v1/user-notifications?${searchParams.toString()}`;

  try {
    const authHeaders = await getAuthHeader(request);

    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      signal: AbortSignal.timeout(5000),
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
    
    const errText = await res.text();
    console.error('[Next.js Notification Proxy] Backend HTTP Error:', res.status, errText);
    return NextResponse.json({ message: errText || `Backend HTTP ${res.status}` }, { status: res.status });
  } catch (err) {
    console.error('[Next.js Notification Proxy] Backend exception:', err);
    return NextResponse.json(
      { message: 'Error de conexión con el backend de notificaciones', error: String(err) },
      { status: 502 }
    );
  }
}
