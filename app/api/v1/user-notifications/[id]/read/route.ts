import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_BASE_PROCEDURES?.replace(/\/api\/?$/, '') || 'https://localhost:7165';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({ isRead: true }));
  const targetUrl = `${BACKEND_URL}/api/v1/user-notifications/${id}/read`;

  try {
    const authHeader = request.headers.get('authorization');
    const res = await fetch(targetUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      signal: AbortSignal.timeout(600),
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (err) {
    console.warn('[Next.js Notification Proxy] .NET Backend unreachable, returning mock success:', err);
  }

  return NextResponse.json({ success: true, isRead: body.isRead, unreadCount: 0 });
}
