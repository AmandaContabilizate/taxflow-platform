'use client'

import { useRfcStore } from '@/features/taxpayers/stores/rfcStore'
import type { GoFn } from '../types'
import { BlacklistCard } from './blacklist-card'
import { ComplianceCard } from './compliance-card'
import { CredibilityHeader } from './credibility-header'
import { CsfCard } from './csf-card'
import { PdfViewerDialog } from './pdf-viewer-dialog'
import { useFiscalDocuments } from './use-fiscal-documents'

interface Props {
  go: GoFn
}

export function FiscalCredibility({ go }: Props) {
  const { selectedRfc } = useRfcStore()
  const { csf, opinion, blacklist, busy, viewer, runAction, closeViewer } = useFiscalDocuments(selectedRfc)

  const csfMissing = csf.state === 'missing'
  const csfErrored = csf.state === 'error'
  const csfForbidden = csf.state === 'forbidden'
  const rfcNotFound =
    csf.state === 'rfc-not-found' ||
    opinion.state === 'rfc-not-found' ||
    blacklist.state === 'rfc-not-found'
  const allBlocked = csfMissing

  const goToSat = () => go('estatus-sat')

  return (
    <div>
      <CredibilityHeader
        csfMissing={csfMissing}
        csfErrored={csfErrored}
        csfForbidden={csfForbidden}
        rfcNotFound={rfcNotFound}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <CsfCard
          state={csf.state}
          downloadDate={csf.downloadDate}
          busy={busy}
          onConnect={goToSat}
          onUpload={() => go('documentos')}
          onView={() => runAction('csf', 'view')}
          onDownload={() => runAction('csf', 'download')}
        />
        <ComplianceCard
          state={opinion.state}
          blocked={allBlocked}
          downloadDate={opinion.downloadDate}
          statusText={opinion.statusText}
          busy={busy}
          onView={() => runAction('opinion', 'view')}
          onDownload={() => runAction('opinion', 'download')}
          onConnect={goToSat}
        />
        <BlacklistCard
          state={blacklist.state}
          statusText={blacklist.statusText}
          blocked={allBlocked}
          onConnect={goToSat}
        />
      </div>

      <PdfViewerDialog viewer={viewer} onClose={closeViewer} />
    </div>
  )
}
