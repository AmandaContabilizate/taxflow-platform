import { cookies } from 'next/headers'
import { DIAG_MOCK_COOKIE, ESCENARIOS, type DiagnosticoMock } from './escenarios'

/**
 * Escenario simulado activo para la pantalla Diagnóstico (ver escenarios.ts), o null.
 * Doble candado: solo con NODE_ENV=development Y cookie diag_mock con un escenario válido
 * (la escribe /dev/diagnostico). En cualquier build de producción siempre regresa null.
 */
export async function getDiagnosticoMock(): Promise<DiagnosticoMock | null> {
  if (process.env.NODE_ENV !== 'development') return null
  const id = (await cookies()).get(DIAG_MOCK_COOKIE)?.value
  return id ? (ESCENARIOS[id] ?? null) : null
}
