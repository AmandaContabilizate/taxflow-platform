import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

export const maxDuration = 60

async function launchBrowser() {
  const chromium = (await import('@sparticuz/chromium')).default
  const { chromium: playwrightChromium } = await import('playwright-core')

  return playwrightChromium.launch({
    args: [...chromium.args, '--disable-blink-features=AutomationControlled'],
    executablePath: await chromium.executablePath(),
    headless: true,
  })
}

async function createContextWithUserAgent(browser: any) {
  return browser.newContext({
    acceptDownloads: true,
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    extraHTTPHeaders: {
      'Accept-Language': 'es-MX,es;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
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
  const context = await createContextWithUserAgent(browser)
  const page = await context.newPage()

  // Evasión anti-bot
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined })
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] })
  })

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

      await page.goto('https://idcsc.sat.gob.mx/', { waitUntil: 'domcontentloaded', timeout: 30000 })
      await page.waitForTimeout(1000) // Pequeño delay para que cargue todo

      // RFC
      await page.waitForSelector('#id_usuario', { timeout: 10000 })
      await page.fill('#id_usuario', rfc.toUpperCase().trim())
      await page.waitForTimeout(500)

      // Contraseña CIEC
      const pwdSel = '#usu_contraseña, input[type="password"]'
      await page.waitForSelector(pwdSel, { timeout: 10000 })
      await page.fill(pwdSel, ciec)
      await page.waitForTimeout(500)

      // Submit
      await page.click('#submit, button[type="submit"], input[type="submit"]')
      await page.waitForLoadState('load').catch(() => {})
      await page.waitForTimeout(2000)

      // Validar credenciales y contenido bloqueado
      const bodyText = await page.innerText('body').catch(() => '')
      if (/contenido está bloqueado|Este sitio no está disponible|acceso denegado/i.test(bodyText)) {
        await browser.close()
        return NextResponse.json(
          { error: 'El portal del SAT bloqueó el acceso. Por favor, intenta desde la web del SAT directamente o contacta soporte.' },
          { status: 403 }
        )
      }
      if (/RFC o contraseña incorrectos|contraseña no es correcta|datos incorrectos|Error de autenticación/i.test(bodyText)) {
        await browser.close()
        return NextResponse.json({ error: 'RFC o CIEC incorrectos. Verifica tus datos.' }, { status: 400 })
      }

      // Navegar a Constancia — usar la URL del portal correcto (wwwmat.sat.gob.mx después de FIEL)
      // Para CIEC, la constancia es directa en servicios.sat.gob.mx
      await page.goto('https://www.sat.gob.mx/fichas/16614/constancia-de-situacion-fiscal', {
        waitUntil: 'domcontentloaded',
        timeout: 20000,
      })
      await page.waitForTimeout(1500)

      // Buscar botón "Generar" o descargar directamente
      const btnSel = 'input[value*="Generar" i], button:has-text("Generar"), a:has-text("Generar"), input[value*="Descargar" i]'
      const btn = page.locator(btnSel).first()
      if (await btn.count()) {
        await btn.click()
        await page.waitForTimeout(3000)
      }

      // Esperar a que llegue el PDF (máx 15 s)
      await page.waitForTimeout(8000)

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
        { waitUntil: 'domcontentloaded', timeout: 30000 }
      )
      await page.waitForTimeout(1500)

      // Detectar bloqueo de contenido
      const blockedText = await page.innerText('body').catch(() => '')
      if (/contenido está bloqueado|Este sitio no está disponible|acceso denegado/i.test(blockedText)) {
        fs.unlinkSync(cerPath)
        fs.unlinkSync(keyPath)
        await browser.close()
        return NextResponse.json(
          { error: 'El portal del SAT bloqueó el acceso. Por favor, intenta desde la web del SAT directamente.' },
          { status: 403 }
        )
      }

      // Aceptar aviso si aparece
      const aceptarBtn = page.locator('input[value*="Aceptar" i], button:has-text("Aceptar")').first()
      if (await aceptarBtn.count()) {
        await aceptarBtn.click()
        await page.waitForLoadState('load').catch(() => {})
        await page.waitForTimeout(1500)
      }

      // Subir certificado .cer
      const cerInputs = page.locator('input[type="file"]')
      const inputCount = await cerInputs.count()
      
      if (inputCount > 0) {
        await cerInputs.nth(0).setInputFiles(cerPath)
        await page.waitForTimeout(500)
      }

      // Subir llave .key
      if (inputCount > 1) {
        await cerInputs.nth(1).setInputFiles(keyPath)
        await page.waitForTimeout(500)
      }

      // Contraseña de clave privada
      await page.fill('input[type="password"]', keyPassword)
      await page.waitForTimeout(500)

      // Submit
      await page.click('input[type="submit"], button[type="submit"]')
      await page.waitForLoadState('load').catch(() => {})
      await page.waitForTimeout(2500)

      // Validar autenticación y bloqueos
      const bodyText = await page.innerText('body').catch(() => '')
      if (/contenido está bloqueado|Este sitio no está disponible/i.test(bodyText)) {
        fs.unlinkSync(cerPath)
        fs.unlinkSync(keyPath)
        await browser.close()
        return NextResponse.json(
          { error: 'El portal del SAT bloqueó el acceso con e.Firma. Intenta de nuevo más tarde.' },
          { status: 403 }
        )
      }
      if (/error|incorrecto|no válido|vencid|rechazad/i.test(bodyText)) {
        fs.unlinkSync(cerPath)
        fs.unlinkSync(keyPath)
        await browser.close()
        return NextResponse.json(
          { error: 'e.Firma incorrecta, vencida o rechazada. Verifica tus certificados.' },
          { status: 400 }
        )
      }

      // Navegar a Constancia — el flujo FIEL redirige a wwwmat.sat.gob.mx
      await page.goto('https://wwwmat.sat.gob.mx/operacion/43824/reimprime-tus-acuses-del-rfc', {
        waitUntil: 'domcontentloaded',
        timeout: 20000,
      })
      await page.waitForTimeout(1500)

      // Buscar y clickear el botón "Generar Constancia"
      const genBtn = page.locator('button:has-text("Generar Constancia"), input[value*="Generar" i]').first()
      if (await genBtn.count()) {
        await genBtn.click()
        await page.waitForTimeout(3000)
      }

      // Esperar PDF
      await page.waitForTimeout(8000)

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
