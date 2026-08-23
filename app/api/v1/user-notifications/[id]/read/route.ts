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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({ isRead: true }));
  const targetUrl = `${BACKEND_URL}/api/v1/user-notifications/${id}/read`;

  try {
    const authHeaders = await getAuthHeader(request);

    const res = await fetch(targetUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      signal: AbortSignal.timeout(5000),
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    const errText = await res.text();
    return NextResponse.json({ message: errText }, { status: res.status });
  } catch (err) {
    return NextResponse.json({ message: 'Error al marcar como leída', error: String(err) }, { status: 502 });
  }
}
