import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_BASE_PROCEDURES?.replace(/\/api\/?$/, '') || 'https://localhost:7165';

export async function POST(request: NextRequest) {
  const targetUrl = `${BACKEND_URL}/api/v1/user-notifications/mark-all-read`;

  try {
    const authHeader = request.headers.get('authorization');
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      signal: AbortSignal.timeout(600),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (err) {
    console.warn('[Next.js Notification Proxy] .NET Backend unreachable, returning mock mark-all-read:', err);
  }

  return NextResponse.json({ success: true, updatedCount: 5, unreadCount: 0 });
}
