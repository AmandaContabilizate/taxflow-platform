import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { method, rfc, ciec, cerBase64, keyBase64, keyPassword } = body

  if (!method) return NextResponse.json({ error: 'Método requerido (ciec | fiel)' }, { status: 400 })

  const chromium = (await import('@sparticuz/chromium')).default
  const puppeteer = (await import('puppeteer-core')).default

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: 1280, height: 800 },
    executablePath: await chromium.executablePath(),
    headless: true,
  })

  const page = await browser.newPage()

  // Block images/fonts to speed up scraping
  await page.setRequestInterception(true)
  page.on('request', (req) => {
    if (['image', 'font', 'stylesheet'].includes(req.resourceType())) req.abort()
    else req.continue()
  })

  let pdfBuffer: Buffer | null = null

  // Capture PDF from network responses
  page.on('response', async (response) => {
    const ct = response.headers()['content-type'] ?? ''
    if (ct.includes('pdf') || response.url().includes('.pdf')) {
      try {
        pdfBuffer = await response.buffer()
      } catch { /* ignore */ }
    }
  })

  try {
    if (method === 'ciec') {
      // ── CIEC FLOW ──────────────────────────────────────────────────────────
      if (!rfc || !ciec) {
        await browser.close()
        return NextResponse.json({ error: 'RFC y CIEC son requeridos' }, { status: 400 })
      }

      console.log('[v0] Navigating to SAT CIEC login...')
      await page.goto('https://idcsc.sat.gob.mx/', {
        waitUntil: 'networkidle2',
        timeout: 30000,
      })

      // Fill RFC
      await page.waitForSelector('#id_usuario, input[name="id_usuario"]', { timeout: 10000 })
      await page.type('#id_usuario', rfc.toUpperCase().trim(), { delay: 40 })

      // Fill CIEC
      await page.waitForSelector('#usu_contraseña, input[name="usu_contraseña"], input[type="password"]', { timeout: 10000 })
      const pwdSelector = await page.$('#usu_contraseña') ?? await page.$('input[type="password"]')
      await pwdSelector?.type(ciec, { delay: 40 })

      // Submit
      const submitBtn = await page.$('#submit, button[type="submit"], input[type="submit"]')
      await submitBtn?.click()
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {})

      // Check login error
      const pageText = await page.evaluate(() => document.body.innerText)
      if (
        pageText.includes('RFC o contraseña incorrectos') ||
        pageText.includes('contraseña no es correcta') ||
        pageText.includes('datos incorrectos') ||
        pageText.includes('Error de autenticación')
      ) {
        await browser.close()
        return NextResponse.json({ error: 'RFC o CIEC incorrectos. Verifica tus datos.' }, { status: 400 })
      }

      // Navigate to Constancia de Situación Fiscal
      console.log('[v0] Navigating to constancia page...')
      await page.goto('https://servicios.sat.gob.mx/servicio/csf/index.xhtml', {
        waitUntil: 'networkidle2',
        timeout: 20000,
      })

      // Click generate button
      const btn = await page.$(
        'input[value*="Generar"], input[value*="generar"], button[id*="generar"], ' +
        'a[id*="generar"], input[id*="generar"], button[id*="Generar"]'
      )
      if (btn) await btn.click()
      await new Promise(r => setTimeout(r, 8000))

    } else if (method === 'fiel') {
      // ── FIEL FLOW ──────────────────────────────────────────────────────────
      if (!cerBase64 || !keyBase64 || !keyPassword) {
        await browser.close()
        return NextResponse.json({ error: 'Certificado, llave privada y contraseña son requeridos' }, { status: 400 })
      }

      // Write temp files for .cer and .key
      const tmpDir = os.tmpdir()
      const cerPath = path.join(tmpDir, `${Date.now()}.cer`)
      const keyPath = path.join(tmpDir, `${Date.now()}.key`)
      fs.writeFileSync(cerPath, Buffer.from(cerBase64, 'base64'))
      fs.writeFileSync(keyPath, Buffer.from(keyBase64, 'base64'))

      console.log('[v0] Navigating to SAT FIEL login...')
      await page.goto(
        'https://login.siat.sat.gob.mx/nidp/idff/sso?id=fiel_Aviso&sid=0&option=credential&sid=0',
        { waitUntil: 'networkidle2', timeout: 30000 }
      )

      // Accept notice if present
      const acceptBtn = await page.$('input[value*="Aceptar"], button[id*="aceptar"], a[id*="aceptar"]')
      if (acceptBtn) {
        await acceptBtn.click()
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {})
      }

      // Upload .cer file
      const cerInput = await page.$('input[type="file"][accept*=".cer"], input[type="file"]:first-of-type')
      if (cerInput) await cerInput.uploadFile(cerPath)

      // Upload .key file
      const keyInput = await page.$('input[type="file"][accept*=".key"], input[type="file"]:nth-of-type(2)')
      if (keyInput) await keyInput.uploadFile(keyPath)

      // Fill key password
      const pwdInput = await page.$('input[type="password"]')
      if (pwdInput) await pwdInput.type(keyPassword, { delay: 40 })

      // Submit FIEL form
      const submitBtn = await page.$('input[type="submit"], button[type="submit"]')
      if (submitBtn) await submitBtn.click()
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {})

      // Check for errors
      const pageText = await page.evaluate(() => document.body.innerText)
      if (
        pageText.includes('error') ||
        pageText.includes('incorrecto') ||
        pageText.includes('no válido')
      ) {
        fs.unlinkSync(cerPath)
        fs.unlinkSync(keyPath)
        await browser.close()
        return NextResponse.json({ error: 'e.Firma incorrecta o vencida. Verifica tus archivos.' }, { status: 400 })
      }

      // Navigate to Constancia de Situación Fiscal
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

      // Cleanup temp files
      fs.unlinkSync(cerPath)
      fs.unlinkSync(keyPath)
    }

    await browser.close()

    if (!pdfBuffer) {
      return NextResponse.json(
        { error: 'No se pudo descargar el PDF. El portal del SAT puede estar lento, intenta de nuevo.' },
        { status: 500 }
      )
    }

    // Extract regime from PDF text
    let regime: string | null = null
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
        if (p.regex.test(text)) { regime = p.label; break }
      }
    } catch { /* pdf-parse failure is non-fatal */ }

    const pdfBase64 = pdfBuffer.toString('base64')

    // Save reference in DB
    await supabase.from('user_credentials').upsert({
      user_id: user.id,
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    return NextResponse.json({ success: true, regime, pdfBase64 })

  } catch (err: unknown) {
    console.error('[v0] SAT scraper error:', err)
    await browser.close().catch(() => {})
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al conectar con el SAT' },
      { status: 500 }
    )
  }
}
