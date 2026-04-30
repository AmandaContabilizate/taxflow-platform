import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60 // Vercel max for serverless

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { rfc, ciec } = await req.json()
    if (!rfc || !ciec) {
      return NextResponse.json({ error: 'RFC y CIEC son requeridos' }, { status: 400 })
    }

    const rfcUpper = rfc.toUpperCase().trim()

    // Dynamically import puppeteer-core and chromium (serverless-optimized)
    const chromium = (await import('@sparticuz/chromium')).default
    const puppeteer = (await import('puppeteer-core')).default

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: true,
    })

    const page = await browser.newPage()

    try {
      // Step 1: Go to SAT login page
      await page.goto('https://idcsc.sat.gob.mx/', {
        waitUntil: 'networkidle2',
        timeout: 30000,
      })

      // Step 2: Fill RFC
      await page.waitForSelector('#id_usuario', { timeout: 10000 })
      await page.type('#id_usuario', rfcUpper, { delay: 50 })

      // Step 3: Fill CIEC password
      await page.waitForSelector('#usu_contraseña', { timeout: 10000 })
      await page.type('#usu_contraseña', ciec, { delay: 50 })

      // Step 4: Click login button
      await page.click('#submit')
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 })

      // Check for login errors
      const errorMsg = await page.$('.errores, .error-message, #error')
      if (errorMsg) {
        const errText = await page.evaluate(el => el?.textContent, errorMsg)
        await browser.close()
        return NextResponse.json(
          { error: errText?.trim() || 'RFC o CIEC incorrectos. Verifica tus datos.' },
          { status: 400 }
        )
      }

      // Step 5: Navigate to Constancia de Situación Fiscal
      await page.goto(
        'https://servicios.sat.gob.mx/servicio/csf/index.xhtml',
        { waitUntil: 'networkidle2', timeout: 20000 }
      )

      // Step 6: Click "Generar Constancia" / download PDF button
      const downloadBtn = await page.waitForSelector(
        'input[value*="Generar"], button[id*="generar"], input[id*="generar"], a[id*="generar"]',
        { timeout: 10000 }
      )
      if (!downloadBtn) {
        await browser.close()
        return NextResponse.json({ error: 'No se encontró el botón de descarga en el SAT' }, { status: 500 })
      }

      // Intercept PDF response
      const pdfBuffer = await new Promise<Buffer | null>(async (resolve) => {
        page.on('response', async (response) => {
          const contentType = response.headers()['content-type'] ?? ''
          if (contentType.includes('pdf')) {
            const buffer = await response.buffer()
            resolve(buffer)
          }
        })

        await downloadBtn.click()

        // Wait up to 15s for PDF
        setTimeout(() => resolve(null), 15000)
      })

      await browser.close()

      if (!pdfBuffer) {
        return NextResponse.json(
          { error: 'No se pudo descargar el PDF. Intenta subir la constancia manualmente.' },
          { status: 500 }
        )
      }

      // Parse regime from PDF text (basic extraction)
      let regime: string | null = null
      try {
        const pdfParse = (await import('pdf-parse')).default
        const pdfData = await pdfParse(pdfBuffer)
        const text = pdfData.text

        // SAT constancia patterns
        const regimePatterns = [
          /RÉGIMEN DE INCORPORACIÓN FISCAL/i,
          /RÉGIMEN SIMPLIFICADO DE CONFIANZA/i,
          /ACTIVIDADES EMPRESARIALES Y PROFESIONALES/i,
          /SUELDOS Y SALARIOS/i,
          /ARRENDAMIENTO/i,
          /DIVIDENDOS/i,
          /INTERESES/i,
          /PERSONAS MORALES.*GENERAL/i,
          /PERSONAS MORALES.*FINES NO LUCRATIVOS/i,
        ]
        for (const pattern of regimePatterns) {
          const match = text.match(pattern)
          if (match) {
            regime = match[0]
            break
          }
        }
      } catch {
        // If pdf-parse fails, continue without regime detection
      }

      // Store PDF path in Supabase (base64 for now, ideally use Vercel Blob)
      const pdfBase64 = pdfBuffer.toString('base64')
      await supabase.from('user_credentials').upsert({
        user_id: user.id,
        constancia_pdf: pdfBase64.slice(0, 500), // store reference only
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

      return NextResponse.json({
        success: true,
        regime,
        pdfBase64,
      })
    } catch (scrapeError: unknown) {
      await browser.close()
      throw scrapeError
    }
  } catch (err: unknown) {
    console.error('[v0] SAT scraper error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al conectar con el SAT' },
      { status: 500 }
    )
  }
}
