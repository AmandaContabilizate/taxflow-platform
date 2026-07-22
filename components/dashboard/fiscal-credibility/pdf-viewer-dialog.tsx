import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Viewer } from './types'

interface PdfViewerDialogProps {
  viewer: Viewer | null
  onClose: () => void
}

export function PdfViewerDialog({ viewer, onClose }: PdfViewerDialogProps) {
  return (
    <Dialog
      open={!!viewer}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="flex flex-col p-0 gap-0 max-w-4xl sm:max-w-4xl w-[calc(100%-2rem)] h-[85vh] overflow-hidden">
        <DialogHeader className="px-5 py-3.5 border-b text-left" style={{ borderColor: 'var(--border)' }}>
          <DialogTitle className="text-[15px] truncate pr-8" style={{ color: 'var(--ink-900)' }}>
            {viewer?.title ?? 'Documento'}
          </DialogTitle>
          <DialogDescription className="sr-only">Vista previa del documento en PDF</DialogDescription>
        </DialogHeader>
        {viewer && (
          <iframe
            src={viewer.url}
            title={viewer.title}
            className="flex-1 w-full"
            style={{ border: 'none', background: 'var(--muted)' }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
