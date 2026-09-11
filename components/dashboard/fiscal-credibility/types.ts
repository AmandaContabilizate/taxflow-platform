export type DocState = 'loading' | 'available' | 'missing' | 'rfc-not-found' | 'forbidden' | 'error'
export type DocKind = 'csf' | 'opinion'
export type DocAction = 'view' | 'download'

export interface DocInfo {
  state: DocState
  errorMessage?: string
  downloadDate?: string | null
  statusText?: string | null
  hasFile?: boolean
  isStale?: boolean
  // null = el backend no mando datos suficientes para decidir.
  inBlacklist?: boolean | null
}

export interface Viewer {
  url: string
  title: string
}
