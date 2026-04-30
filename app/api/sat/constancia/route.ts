import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

export const maxDuration = 60

// ─────────────────────────────────────────────────────────────────────────────
// Helper: launch Playwright browser
// ─────────────────────────────────────────────────────────────────────────────
async function launchBrowser() {
  const chromium = (await import('@sparticuz/chromium')).default
  const { chromium: playwrightChromium } = await import('playwright-core')

  return playwrightChromium.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/sat/constancia
// body: { method: 'ciec', rfc, ciec }
//       { method: 'fiel', cerBase64, keyBase64, keyPassword }
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { method, rfc, ciec, cerBase64, keyBase64, keyPassword } = body

  if (!method) {
    return NextResponse.json({ error: 'Método requerido: ciec o fiel' }, { status: 400 })
  }

  const browser = await launchBrowser()
  const context = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 1280, height: 800 },
  })
  const page = await context.newPage()

  // Block images / fonts to speed things up
  await page.route('**/*', (route) => {
    const type = route.request().resourceType()
    if (['image', 'font', 'stylesheet'].includes(type)) {
      route.abort()
    } else {
      route.continue()
    }
  })

  // Capture PDF response
  let pdfBuffer: Buffer | null = null
  page.on('response', async (response) => {
    const ct = response.headers()['content-type'] ?? ''
    if (ct.includes('pdf') || response.url().includes('.pdf')) {
      try {
        pdfBuffer = Buffer.from(await response.body())
      } catch { /* ignore */ }
    }
  })

  try {
    // ── FLUJO CIEC ────────────────────────────────────────────────────────────
    if (method === 'ciec') {
      if (!rfc || !ciec) {
        await browser.close()
        return NextResponse.json({ error: 'RFC y CIEC son requeridos' }, { status: 400 })
      }

      await page.goto('https://idcsc.sat.gob.mx/', { waitUntil: 'networkidle', timeout: 30000 })

      // RFC
      await page.waitForSelector('#id_usuario', { timeout: 10000 })
      await page.fill('#id_usuario', rfc.toUpperCase().trim())

      // Contraseña CIEC
      const pwdSel = '#usu_contraseña, input[type="password"]'
      await page.waitForSelector(pwdSel, { timeout: 10000 })
      await page.fill(pwdSel, ciec)

      // Submit
      await page.click('#submit, button[type="submit"], input[type="submit"]')
      await page.waitForLoadState('networkidle').catch(() => {})

      // Validar credenciales
      const bodyText = await page.innerText('body').catch(() => '')
      if (/RFC o contraseña incorrectos|contraseña no es correcta|datos incorrectos|Error de autenticación/i.test(bodyText)) {
        await browser.close()
        return NextResponse.json({ error: 'RFC o CIEC incorrectos. Verifica tus datos.' }, { status: 400 })
      }

      // Navegar a Constancia de Situación Fiscal
      await page.goto('https://servicios.sat.gob.mx/servicio/csf/index.xhtml', {
        waitUntil: 'networkidle',
        timeout: 20000,
      })

      // Generar / descargar constancia
      const btnSel = 'input[value*="Generar" i], button[id*="generar" i], a[id*="generar" i]'
      const btn = page.locator(btnSel).first()
      if (await btn.count()) await btn.click()

      // Esperar a que llegue el PDF (máx 15 s)
      await page.waitForTimeout(15000)

    // ── FLUJO FIEL ────────────────────────────────────────────────────────────
    } else if (method === 'fiel') {
      if (!cerBase64 || !keyBase64 || !keyPassword) {
        await browser.close()
        return NextResponse.json(
          { error: 'Certificado .cer, llave .key y contraseña son requeridos' },
          { status: 400 }
        )
      }

      // Escribir archivos temporales
      const tmpDir = os.tmpdir()
      const cerPath = path.join(tmpDir, `cer_${Date.now()}.cer`)
      const keyPath = path.join(tmpDir, `key_${Date.now()}.key`)
      fs.writeFileSync(cerPath, Buffer.from(cerBase64, 'base64'))
      fs.writeFileSync(keyPath, Buffer.from(keyBase64, 'base64'))

      await page.goto(
        'https://login.siat.sat.gob.mx/nidp/idff/sso?id=fiel_Aviso&sid=0&option=credential&sid=0',
        { waitUntil: 'networkidle', timeout: 30000 }
      )

      // Aceptar aviso si aparece
      const aceptarBtn = page.locator('input[value*="Aceptar" i], button:has-text("Aceptar"), a:has-text("Aceptar")').first()
      if (await aceptarBtn.count()) {
        await aceptarBtn.click()
        await page.waitForLoadState('networkidle').catch(() => {})
      }

      // Subir certificado .cer
      const cerInputs = page.locator('input[type="file"]')
      if (await cerInputs.count() > 0) {
        await cerInputs.nth(0).setInputFiles(cerPath)
      }

      // Subir llave .key
      if (await cerInputs.count() > 1) {
        await cerInputs.nth(1).setInputFiles(keyPath)
      }

      // Contraseña de clave privada
      await page.fill('input[type="password"]', keyPassword)

      // Submit
      await page.click('input[type="submit"], button[type="submit"]')
      await page.waitForLoadState('networkidle').catch(() => {})

      // Validar autenticación
      const bodyText = await page.innerText('body').catch(() => '')
      if (/error|incorrecto|no válido|vencid/i.test(bodyText)) {
        fs.unlinkSync(cerPath)
        fs.unlinkSync(keyPath)
        await browser.close()
        return NextResponse.json(
          { error: 'e.Firma incorrecta o vencida. Verifica tus archivos.' },
          { status: 400 }
        )
      }

      // Navegar a Constancia de Situación Fiscal
      await page.goto('https://servicios.sat.gob.mx/servicio/csf/index.xhtml', {
        waitUntil: 'networkidle',
        timeout: 20000,
      })

      const btnSel = 'input[value*="Generar" i], button[id*="generar" i], a[id*="generar" i]'
      const btn = page.locator(btnSel).first()
      if (await btn.count()) await btn.click()

      await page.waitForTimeout(15000)

      // Limpiar temporales
      fs.unlinkSync(cerPath)
      fs.unlinkSync(keyPath)

    } else {
      await browser.close()
      return NextResponse.json({ error: 'Método inválido' }, { status: 400 })
    }

    await browser.close()

    if (!pdfBuffer) {
      return NextResponse.json(
        { error: 'No se pudo obtener el PDF. El portal del SAT puede estar lento, intenta de nuevo.' },
        { status: 500 }
      )
    }

    // ── Extraer régimen del texto del PDF ─────────────────────────────────────
    let regime: string | null = null
    try {
      const pdfParse = (await import('pdf-parse')).default
      const pdfData = await pdfParse(pdfBuffer)
      const text = pdfData.text

      const patrones = [
        { label: 'Régimen Simplificado de Confianza',       regex: /RÉGIMEN SIMPLIFICADO DE CONFIANZA|RESICO/i },
        { label: 'Régimen de Incorporación Fiscal',         regex: /RÉGIMEN DE INCORPORACIÓN FISCAL|RIF/i },
        { label: 'Actividades Empresariales y Profesionales', regex: /ACTIVIDADES EMPRESARIALES Y PROFESIONALES/i },
        { label: 'Sueldos y Salarios',                      regex: /SUELDOS Y SALARIOS/i },
        { label: 'Arrendamiento',                           regex: /ARRENDAMIENTO/i },
        { label: 'Personas Morales Régimen General',        regex: /PERSONAS MORALES.*GENERAL/i },
      ]
      for (const p of patrones) {
        if (p.regex.test(text)) { regime = p.label; break }
      }
    } catch { /* no fatal */ }

    // Guardar referencia en Supabase
    await supabase.from('user_credentials').upsert(
      { user_id: user.id, verified_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )

    return NextResponse.json({
      success: true,
      regime,
      pdfBase64: pdfBuffer.toString('base64'),
    })

  } catch (err: unknown) {
    console.error('[v0] SAT Playwright scraper error:', err)
    await browser.close().catch(() => {})
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al conectar con el SAT' },
      { status: 500 }
    )
  }
}
