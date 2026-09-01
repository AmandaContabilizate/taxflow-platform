/** Archivo binario cruzando el boundary de server action como base64 (PDF, XLSX, …). */
export interface DownloadableFile {
  base64: string
  filename: string
  contentType: string
}

export function toBlob(doc: DownloadableFile): Blob {
  const byteChars = atob(doc.base64)
  const bytes = new Uint8Array(byteChars.length)
  for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i)
  return new Blob([bytes], { type: doc.contentType })
}

/** base64 -> Blob -> `<a download>`: dispara la descarga del navegador sin dejar rastro en el DOM. */
export function downloadFile(doc: DownloadableFile) {
  const url = URL.createObjectURL(toBlob(doc))
  const a = document.createElement('a')
  a.href = url
  a.download = doc.filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
