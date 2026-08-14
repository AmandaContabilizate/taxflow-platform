import type { ReactNode } from 'react'

// Marcadores estilo WhatsApp: *bold*, _italic_, ~strike~, ```mono```.
// Sin anidamiento (igual que WhatsApp) — el primero en matchear gana.
const TOKEN_RE = /```([^`\n]+?)```|\*([^*\n]+?)\*|_([^_\n]+?)_|~([^~\n]+?)~/g

function parseLine(line: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let i = 0

  TOKEN_RE.lastIndex = 0
  while ((match = TOKEN_RE.exec(line))) {
    if (match.index > lastIndex) {
      nodes.push(line.slice(lastIndex, match.index))
    }
    const [, mono, bold, italic, strike] = match
    const key = `${keyPrefix}-${i++}`
    if (mono !== undefined) {
      nodes.push(
        <code key={key} className="px-1 py-0.5 rounded" style={{ background: 'var(--muted)', fontFamily: 'var(--font-mono, monospace)' }}>
          {mono}
        </code>,
      )
    } else if (bold !== undefined) {
      nodes.push(<strong key={key}>{bold}</strong>)
    } else if (italic !== undefined) {
      nodes.push(<em key={key}>{italic}</em>)
    } else if (strike !== undefined) {
      nodes.push(<span key={key} style={{ textDecoration: 'line-through' }}>{strike}</span>)
    }
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < line.length) {
    nodes.push(line.slice(lastIndex))
  }
  return nodes
}

/** Convierte texto con formato estilo WhatsApp (*bold*, _italic_, ~strike~, ```mono```) a nodos React. */
export function formatWhatsappText(text: string): ReactNode {
  const lines = text.split('\n')
  return lines.map((line, idx) => (
    <span key={idx}>
      {parseLine(line, String(idx))}
      {idx < lines.length - 1 && <br />}
    </span>
  ))
}
