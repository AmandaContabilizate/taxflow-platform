'use client'

import { Bold, Code, Italic, Loader2, Send, Strikethrough } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { getDeclarationComments } from '@/features/declarations/actions/getDeclarationComments.action'
import { postDeclarationComment } from '@/features/declarations/actions/postDeclarationComment.action'
import type { DeclarationComment } from '@/features/declarations/types'
import { formatWhatsappText } from '@/lib/format/whatsappText'
import { fmtDate } from './parts'

interface CurrentUser {
  userId: string
  fullName: string
}

interface Props {
  declarationId: number
  currentUser: CurrentUser
}

type State =
  | { status: 'loading' }
  | { status: 'ready'; comments: DeclarationComment[] }
  | { status: 'error'; message: string }

const WRAP: Record<'bold' | 'italic' | 'strike' | 'mono', [string, string]> = {
  bold: ['*', '*'],
  italic: ['_', '_'],
  strike: ['~', '~'],
  mono: ['```', '```'],
}

export function DeclarationComments({ declarationId, currentUser }: Props) {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const load = async () => {
    setState({ status: 'loading' })
    const res = await getDeclarationComments(declarationId)
    setState(
      res.success
        ? { status: 'ready', comments: res.value }
        : { status: 'error', message: res.error.message },
    )
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [declarationId])

  function applyWrap(kind: keyof typeof WRAP) {
    const el = textareaRef.current
    if (!el) return
    const [open, close] = WRAP[kind]
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = draft.slice(start, end)
    const next = `${draft.slice(0, start)}${open}${selected}${close}${draft.slice(end)}`
    setDraft(next)
    requestAnimationFrame(() => {
      el.focus()
      const cursor = start + open.length + selected.length + close.length
      el.setSelectionRange(cursor, cursor)
    })
  }

  async function handleSend() {
    const text = draft.trim()
    if (!text || sending) return
    setSending(true)
    const res = await postDeclarationComment(declarationId, text)
    setSending(false)
    if (res.success) {
      setDraft('')
      await load()
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        className="rounded-2xl flex flex-col gap-3 p-4 max-h-[480px] overflow-y-auto"
        style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
      >
        {state.status === 'loading' && (
          <div className="flex items-center justify-center gap-2 py-8" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={16} className="animate-spin" /> Cargando comentarios…
          </div>
        )}
        {state.status === 'error' && (
          <div className="text-center py-6 text-[13px]" style={{ color: 'var(--ink-700)' }}>
            {state.message}
          </div>
        )}
        {state.status === 'ready' && state.comments.length === 0 && (
          <div className="text-center py-6 text-[13px]" style={{ color: 'var(--ink-500)' }}>
            Todavía no hay comentarios. Sé el primero en escribir.
          </div>
        )}
        {state.status === 'ready' &&
          state.comments.map((c) => {
            const own = c.authorUserId === currentUser.userId
            return (
              <div key={c.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[80%] rounded-2xl px-3.5 py-2.5"
                  style={
                    own
                      ? { background: 'var(--nav-active-bg)', color: 'var(--nav-active-fg)' }
                      : { background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)' }
                  }
                >
                  <div
                    className="text-[11.5px] font-bold mb-0.5 flex items-center gap-1.5"
                    style={{ color: own ? 'var(--nav-active-fg)' : 'var(--ink-700)', opacity: 0.85 }}
                  >
                    {c.authorName}
                    <span className="font-normal" style={{ opacity: 0.75 }}>
                      · {fmtDate(c.createdAt)}
                    </span>
                  </div>
                  <div className="text-[13.5px] leading-snug whitespace-pre-wrap break-words">
                    {formatWhatsappText(c.body)}
                  </div>
                </div>
              </div>
            )
          })}
      </div>

      <div
        className="rounded-2xl p-3 flex flex-col gap-2"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-1">
          <ToolbarBtn icon={<Bold size={14} />} title="Negrita" onClick={() => applyWrap('bold')} />
          <ToolbarBtn icon={<Italic size={14} />} title="Cursiva" onClick={() => applyWrap('italic')} />
          <ToolbarBtn icon={<Strikethrough size={14} />} title="Tachado" onClick={() => applyWrap('strike')} />
          <ToolbarBtn icon={<Code size={14} />} title="Monoespaciado" onClick={() => applyWrap('mono')} />
        </div>
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void handleSend()
            }
          }}
          placeholder="Escribe un comentario…"
          rows={2}
          className="w-full resize-none rounded-xl px-3 py-2 text-[13.5px] outline-none"
          style={{ background: 'var(--muted)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
        />
        <div className="flex justify-end">
          <button
            onClick={() => void handleSend()}
            disabled={!draft.trim() || sending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[12.5px] font-bold transition disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#10DA92 0%,#00B073 100%)', color: '#fff' }}
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Comentar
          </button>
        </div>
      </div>
    </div>
  )
}

function ToolbarBtn({ icon, title, onClick }: { icon: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="inline-flex items-center justify-center w-7 h-7 rounded-lg transition hover:opacity-80"
      style={{ background: 'var(--muted)', color: 'var(--ink-700)' }}
    >
      {icon}
    </button>
  )
}
