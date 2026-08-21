import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_BASE_PROCEDURES?.replace(/\/api\/?$/, '') || 'https://localhost:7165';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const targetUrl = `${BACKEND_URL}/api/v1/user-notifications/seed-test`;

  try {
    const authHeader = request.headers.get('authorization');
    const res = await fetch(targetUrl, {
      method: 'POST',
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
    console.warn('[Next.js Notification Proxy] .NET Backend unreachable, generating mock test notification:', err);
  }

  const mockNewItem = {
    id: `test-${Date.now()}`,
    notificationCode: 'TEST_NOTIFICATION',
    category: body.category || 'Sistema',
    title: body.title || '🔔 Notificación de Prueba Simulada',
    summary: body.summary || 'Esta es una notificación generada dinámicamente para probar el refresco del frontend.',
    detailUrl: body.detailUrl || '/dashboard',
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  return NextResponse.json({ notification: mockNewItem, unreadCount: 1 });
}
