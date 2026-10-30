from gtts import gTTS

texto = """Contabilízate Por Ti es tu contador digital. Nosotros nos encargamos de tu contabilidad, declaraciones ante el SAT, facturas electrónicas y toda tu obligación fiscal. Mientras tú te enfocas en crecer tu negocio, nuestro equipo de contadores y nuestra plataforma administran tu información financiera. Genera reportes, optimiza deducciones y recibe asesoría personalizada. Apoyamos a personas físicas, emprendedores y pequeños negocios. Tú enfócate en crecer, nosotros en tu contabilidad."""

tts = gTTS(text=texto, lang='es', slow=False)
tts.save('public/welcome-voice.mp3')
print("Audio generado: public/welcome-voice.mp3")
