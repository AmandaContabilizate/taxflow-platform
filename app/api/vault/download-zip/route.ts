import JSZip from 'jszip'
import { type NextRequest, NextResponse } from 'next/server'
import { ApiError, fetchGetBlob } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'

type DocType = 'invoice' | 'expense'

interface DocFiles {
  pdf: { data: ArrayBuffer; filename: string }
  xml: { data: ArrayBuffer; filename: string }
}

/**
 * Descarga PDF + XML de un CFDI desde el backend Procedures (cfdi/*).
 * invoice → IdInvoice (emitidas) · expense → IdExpense (gastos/recibidas).
 */
async function fetchDocFiles(id: string, type: DocType): Promise<DocFiles> {
  const [pdfRoute, xmlRoute] =
    type === 'invoice'
      ? [API_ROUTES.CFDI.INVOICE_PDF(id), API_ROUTES.CFDI.INVOICE_XML(id)]
      : [API_ROUTES.CFDI.EXPENSE_PDF(id), API_ROUTES.CFDI.EXPENSE_XML(id)]

  const [pdf, xml] = await Promise.all([
    fetchGetBlob(pdfRoute, 'cfdi'),
    fetchGetBlob(xmlRoute, 'cfdi'),
  ])

  return {
    pdf: { data: await pdf.blob.arrayBuffer(), filename: pdf.filename || `documento-${id}.pdf` },
    xml: { data: await xml.blob.arrayBuffer(), filename: xml.filename || `documento-${id}.xml` },
  }
}

function toZipResponse(buffer: Uint8Array, filename: string): NextResponse {
  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Length': String(buffer.byteLength),
      'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  })
}

function errorResponse(e: unknown): NextResponse {
  const message = e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Error al generar el ZIP.'
  console.error('[vault/download-zip] Error:', e)
  return NextResponse.json({ error: message }, { status: 500 })
}

// ── Descarga individual ──────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const type = searchParams.get('type') as DocType | null

  if (!id || (type !== 'invoice' && type !== 'expense')) {
    return NextResponse.json({ error: 'Missing id or type' }, { status: 400 })
  }

  try {
    const { pdf, xml } = await fetchDocFiles(id, type)
    const zip = new JSZip()
    zip.file(pdf.filename, pdf.data)
    zip.file(xml.filename, xml.data)
    const buffer = await zip.generateAsync({ type: 'uint8array' })

    // Nombre del ZIP = el del XML con extensión .zip (fallback document-{id}.zip).
    const zipName = xml.filename
      ? xml.filename.replace(/\.[^.]+$/, '') + '.zip'
      : `document-${id}.zip`
    return toZipResponse(buffer, zipName)
  } catch (e) {
    return errorResponse(e)
  }
}

// ── Descarga múltiple ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let body: { ids?: unknown; type?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Missing ids or type' }, { status: 400 })
  }

  const type = body.type as DocType | null
  const ids = Array.isArray(body.ids)
    ? body.ids.map(v => String(v)).filter(Boolean)
    : []

  if (ids.length === 0 || (type !== 'invoice' && type !== 'expense')) {
    return NextResponse.json({ error: 'Missing ids or type' }, { status: 400 })
  }

  try {
    const zip = new JSZip()
    const docs = await Promise.all(ids.map(id => fetchDocFiles(id, type)))
    docs.forEach(({ pdf, xml }) => {
      zip.file(pdf.filename, pdf.data)
      zip.file(xml.filename, xml.data)
    })
    const buffer = await zip.generateAsync({ type: 'uint8array' })
    return toZipResponse(buffer, 'documents.zip')
  } catch (e) {
    return errorResponse(e)
  }
}
