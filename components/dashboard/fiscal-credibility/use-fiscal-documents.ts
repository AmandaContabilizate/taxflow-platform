'use client'

import { useCallback, useEffect, useState } from 'react'
import { getComplianceOpinion } from '@/features/taxpayers/actions/getComplianceOpinion.action'
import {
  getComplianceOpinionMetadata,
  getTaxCertificateMetadata,
} from '@/features/taxpayers/actions/getDocumentMetadata.action'
import { getRfcStatus } from '@/features/taxpayers/actions/getRfcStatus.action'
import { getTaxCertificate } from '@/features/taxpayers/actions/getTaxCertificate.action'
import {
  classifyError,
  downloadPdf,
  pdfToBlobUrl,
  readComplianceStatus,
  readDownloadDate,
} from './helpers'
import type { DocAction, DocInfo, DocKind, Viewer } from './types'

const initial: DocInfo = { state: 'loading' }

export function useFiscalDocuments(selectedRfc: string | null) {
  const [csf, setCsf] = useState<DocInfo>(initial)
  const [opinion, setOpinion] = useState<DocInfo>(initial)
  const [blacklist, setBlacklist] = useState<DocInfo>(initial)
  const [busy, setBusy] = useState<string | null>(null)
  const [viewer, setViewer] = useState<Viewer | null>(null)

  useEffect(() => {
    if (!selectedRfc) return
    let cancelled = false

    setCsf(initial)
    setOpinion(initial)
    setBlacklist(initial)

    void (async () => {
      const [csfRes, opRes, statusRes] = await Promise.all([
        getTaxCertificateMetadata(selectedRfc),
        getComplianceOpinionMetadata(selectedRfc),
        getRfcStatus(selectedRfc),
      ])
      if (cancelled) return

      setCsf(
        csfRes.success
          ? { state: 'available', downloadDate: readDownloadDate(csfRes.value) }
          : { state: classifyError(csfRes.error.statusCode, csfRes.error.message), errorMessage: csfRes.error.message },
      )
      setOpinion(
        opRes.success
          ? {
            state: 'available',
            downloadDate: readDownloadDate(opRes.value),
            statusText: readComplianceStatus(opRes.value),
          }
          : { state: classifyError(opRes.error.statusCode, opRes.error.message), errorMessage: opRes.error.message },
      )
      setBlacklist(
        statusRes.success
          ? { state: 'available', statusText: statusRes.value.status69B ?? '' }
          : { state: classifyError(statusRes.error.statusCode, statusRes.error.message), errorMessage: statusRes.error.message },
      )
    })()

    return () => {
      cancelled = true
    }
  }, [selectedRfc])

  const closeViewer = useCallback(() => {
    setViewer((prev) => {
      if (prev) URL.revokeObjectURL(prev.url)
      return null
    })
  }, [])

  const runAction = useCallback(
    async (kind: DocKind, action: DocAction) => {
      if (!selectedRfc) return
      setBusy(`${kind}:${action}`)
      const res =
        kind === 'csf'
          ? await getTaxCertificate(selectedRfc)
          : await getComplianceOpinion(selectedRfc)
      setBusy(null)
      if (!res.success) return

      if (action === 'download') downloadPdf(res.value)
      else setViewer({ url: pdfToBlobUrl(res.value), title: res.value.filename })
    },
    [selectedRfc],
  )

  return { csf, opinion, blacklist, busy, viewer, runAction, closeViewer }
}
