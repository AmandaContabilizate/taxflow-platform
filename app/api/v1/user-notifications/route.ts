import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_BASE_PROCEDURES?.replace(/\/api\/?$/, '') || 'https://localhost:7165';

// Fallback in-memory store if .NET backend is offline or starting up
const mockNotifications = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    notificationCode: 'PRE_REPORT_NOTIFY_CLIENT',
    category: 'Pre-Reportes',
    title: '📊 Pre-Reporte Contable de Julio 2026 listo',
    summary: 'Estimado cliente, su estimación preliminar de impuestos ISR e IVA para el período de Julio 2026 está lista para su revisión y autorización.',
    detailUrl: '/dashboard?s=declaraciones',
    isRead: false,
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    notificationCode: 'UPLOAD_DECLARATION_WITH_TAX',
    category: 'SAT',
    title: '🏛️ Declaración SAT Presentada (Saldo a Pagar)',
    summary: 'Su declaración mensual de Impuestos Federales ha sido presentada con éxito ante el SAT. Consulte el acuse oficial en PDF.',
    detailUrl: '/dashboard?s=declaraciones',
    isRead: false,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    notificationCode: 'UPLOAD_CAPTURE_LINEA',
    category: 'SAT',
    title: '📄 Nueva Línea de Captura disponible',
    summary: 'Se ha subido la línea de captura para el pago de sus impuestos SAT del período actual. Fecha límite de pago: 28 de Agosto de 2026.',
    detailUrl: '/dashboard?s=declaraciones',
    isRead: false,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    notificationCode: 'PROFILE_UPDATE_SAT_INFO',
    category: 'SAT',
    title: '⚠️ Estatus CIEC SAT: Credencial Inválida',
    summary: 'Detectamos que su contraseña CIEC del SAT no coincide o ha caducado. Actualícela para reanudar la sincronización automática de facturas.',
    detailUrl: '/dashboard?s=estatussat',
    isRead: true,
    readAt: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    notificationCode: 'PROFILE_DIAGNOSTIC_COMPLETE',
    category: 'Sistema',
    title: '📋 Diagnóstico Fiscal Completado',
    summary: 'Su diagnóstico fiscal y verificación de Opinión del Cumplimiento 32-D ha finalizado sin observaciones negativas.',
    detailUrl: '/dashboard?s=diagnostico',
    isRead: true,
    readAt: new Date(Date.now() - 40 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = `${BACKEND_URL}/api/v1/user-notifications?${searchParams.toString()}`;

  try {
    const authHeader = request.headers.get('authorization');
    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      signal: AbortSignal.timeout(600),
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (err) {
    console.warn('[Next.js Notification Proxy] .NET Backend unreachable, using fallback mock data:', err);
  }

  // Fallback if .NET Backend isn't running
  const category = searchParams.get('category');
  const isReadParam = searchParams.get('isRead');

  let filtered = [...mockNotifications];
  if (category && category !== 'Todas') {
    filtered = filtered.filter((n) => n.category.toLowerCase() === category.toLowerCase());
  }
  if (isReadParam !== null && isReadParam !== undefined) {
    const isReadBool = isReadParam === 'true';
    filtered = filtered.filter((n) => n.isRead === isReadBool);
  }

  const unreadCount = mockNotifications.filter((n) => !n.isRead).length;

  return NextResponse.json({
    unreadCount,
    totalCount: filtered.length,
    page: 1,
    pageSize: 20,
    items: filtered,
  });
}
