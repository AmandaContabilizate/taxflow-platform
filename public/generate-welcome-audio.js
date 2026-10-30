// Script para generar audio con gTTS
// Este script se ejecuta una sola vez para generar el audio

const gTTS = require('google-tts-api');
const fs = require('fs');
const path = require('path');

const script = `
Bienvenido a Contabilízate.

Te presentamos las principales funciones de nuestro servicio:

Llevar tu contabilidad de forma mensual y calcular tus declaraciones ante el SAT.

Optimizar tus deducciones fiscales para pagar únicamente lo que corresponde conforme a la ley.

Emitir facturas electrónicas, recibos y notas de crédito.

Administrar cuentas por cobrar, cuentas por pagar y complementos de pago.

Descargar y organizar automáticamente tus comprobantes fiscales.

Brindarte asesoría personalizada por contadores especializados.

Generar reportes financieros y estados contables para conocer la situación de tu negocio.

Apoyar a contribuyentes de distintos regímenes, como RESICO, Actividad Empresarial, Honorarios, Arrendamiento y Plataformas Tecnológicas.

Todo en una plataforma fácil de usar. Comienza hoy mismo.
`;

(async () => {
  try {
    const url = await gTTS.getAudioUrl({
      text: script,
      lang: 'es',
      slow: false,
      host: 'https://translate.google.com',
    });

    console.log('Audio URL:', url);
    console.log('Guarda esta URL en una variable de entorno o úsala en el video.');
  } catch (error) {
    console.error('Error generating audio:', error);
  }
})();
