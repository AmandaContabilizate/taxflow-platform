import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getBaseUrl } from '@/lib/api/apiUrls'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

export const maxDuration = 60

async function extractRegimeFromPdf(pdfBuffer: Buffer): Promise<string | null> {
  try {
    const pdfParse = (await import('pdf-parse')).default
    const pdfData = await pdfParse(pdfBuffer)
    const text = pdfData.text
    const patterns = [
      { label: 'Régimen Simplificado de Confianza', regex: /RÉGIMEN SIMPLIFICADO DE CONFIANZA|RESICO/i },
      { label: 'Régimen de Incorporación Fiscal', regex: /RÉGIMEN DE INCORPORACIÓN FISCAL|RIF/i },
      { label: 'Actividades Empresariales y Profesionales', regex: /ACTIVIDADES EMPRESARIALES Y PROFESIONALES/i },
      { label: 'Sueldos y Salarios', regex: /SUELDOS Y SALARIOS/i },
      { label: 'Arrendamiento', regex: /ARRENDAMIENTO/i },
      { label: 'Personas Morales Régimen General', regex: /PERSONAS MORALES.*GENERAL/i },
    ]
    for (const p of patterns) {
      if (p.regex.test(text)) return p.label
    }
  } catch { /* pdf-parse failure is non-fatal */ }
  return null
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const authToken = cookieStore.get('auth_token')?.value
  if (!authToken) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { method, rfc, ciec, cerBase64, keyBase64, keyPassword } = body

  if (!method) return NextResponse.json({ error: 'Método requerido (ciec | fiel)' }, { status: 400 })

  let pdfBuffer: Buffer | null = null

  if (method === 'ciec') {
    // ── CIEC: delegamos al backend Scrappers (.NET) ───────────────────────
    if (!rfc || !ciec) {
      return NextResponse.json({ error: 'RFC y CIEC son requeridos' }, { status: 400 })
    }

    try {
      const params = new URLSearchParams({
        rfc: rfc.toUpperCase().trim(),
        ciec,
      })
      const url = `${getBaseUrl('scrappers')}/api/Download/download-constancy?${params.toString()}`

      const res = await fetch(url, { method: 'GET' })

      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        const friendly =
          res.status === 500 && /ciec/i.test(errText)
            ? 'RFC o CIEC incorrectos. Verifica tus datos.'
            : errText || 'Error al descargar la constancia del SAT.'
        return NextResponse.json({ error: friendly }, { status: res.status })
      }

      const arr = await res.arrayBuffer()
      pdfBuffer = Buffer.from(arr)
    } catch (err: unknown) {
      console.error('[constancia] backend fetch error:', err)
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'No se pudo conectar con el backend' },
        { status: 502 }
      )
    }
  } else if (method === 'fiel') {
    // ── FIEL: el backend aún no expone endpoint, scrapeamos en local ─────
    if (!cerBase64 || !keyBase64 || !keyPassword) {
      return NextResponse.json({ error: 'Certificado, llave privada y contraseña son requeridos' }, { status: 400 })
    }

    const chromium = (await import('@sparticuz/chromium')).default
    const puppeteer = (await import('puppeteer-core')).default

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1280, height: 800 },
      executablePath: await chromium.executablePath(),
      headless: true,
    })

    const page = await browser.newPage()

    await page.setRequestInterception(true)
    page.on('request', (req) => {
      if (['image', 'font', 'stylesheet'].includes(req.resourceType())) req.abort()
      else req.continue()
    })

    page.on('response', async (response) => {
      const ct = response.headers()['content-type'] ?? ''
      if (ct.includes('pdf') || response.url().includes('.pdf')) {
        try { pdfBuffer = await response.buffer() } catch { /* ignore */ }
      }
    })

    const tmpDir = os.tmpdir()
    const cerPath = path.join(tmpDir, `${Date.now()}.cer`)
    const keyPath = path.join(tmpDir, `${Date.now()}.key`)

    try {
      fs.writeFileSync(cerPath, Buffer.from(cerBase64, 'base64'))
      fs.writeFileSync(keyPath, Buffer.from(keyBase64, 'base64'))

      console.log('[v0] Navigating to SAT FIEL login...')
      await page.goto(
        'https://login.siat.sat.gob.mx/nidp/idff/sso?id=fiel_Aviso&sid=0&option=credential&sid=0',
        { waitUntil: 'networkidle2', timeout: 30000 }
      )

      const acceptBtn = await page.$('input[value*="Aceptar"], button[id*="aceptar"], a[id*="aceptar"]')
      if (acceptBtn) {
        await acceptBtn.click()
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {})
      }

      const cerInput = await page.$('input[type="file"][accept*=".cer"], input[type="file"]:first-of-type')
      if (cerInput) await cerInput.uploadFile(cerPath)

      const keyInput = await page.$('input[type="file"][accept*=".key"], input[type="file"]:nth-of-type(2)')
      if (keyInput) await keyInput.uploadFile(keyPath)

      const pwdInput = await page.$('input[type="password"]')
      if (pwdInput) await pwdInput.type(keyPassword, { delay: 40 })

      const submitBtn = await page.$('input[type="submit"], button[type="submit"]')
      if (submitBtn) await submitBtn.click()
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {})

      const pageText = await page.evaluate(() => document.body.innerText)
      if (
        pageText.includes('error') ||
        pageText.includes('incorrecto') ||
        pageText.includes('no válido')
      ) {
        await browser.close()
        return NextResponse.json({ error: 'e.Firma incorrecta o vencida. Verifica tus archivos.' }, { status: 400 })
      }

      console.log('[v0] FIEL authenticated, navigating to constancia...')
      await page.goto('https://servicios.sat.gob.mx/servicio/csf/index.xhtml', {
        waitUntil: 'networkidle2',
        timeout: 20000,
      })

      const btn = await page.$(
        'input[value*="Generar"], input[value*="generar"], button[id*="generar"], ' +
        'a[id*="generar"], input[id*="generar"]'
      )
      if (btn) await btn.click()
      await new Promise(r => setTimeout(r, 8000))

      await browser.close()
    } catch (err: unknown) {
      console.error('[v0] FIEL scraper error:', err)
      await browser.close().catch(() => {})
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Error al conectar con el SAT' },
        { status: 500 }
      )
    } finally {
      try { fs.unlinkSync(cerPath) } catch { /* ignore */ }
      try { fs.unlinkSync(keyPath) } catch { /* ignore */ }
    }
  } else {
    return NextResponse.json({ error: `Método no soportado: ${method}` }, { status: 400 })
  }

  if (!pdfBuffer) {
    return NextResponse.json(
      { error: 'No se pudo descargar el PDF. El portal del SAT puede estar lento, intenta de nuevo.' },
      { status: 500 }
    )
  }

  const regime = await extractRegimeFromPdf(pdfBuffer)
  const pdfBase64 = pdfBuffer.toString('base64')

  // TODO(backend): notificar al backend que la constancia fue verificada para este usuario.
  return NextResponse.json({ success: true, regime, pdfBase64 })
}
