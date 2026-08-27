export interface BroadcastPushRequest {
  title: string
  body: string
  actionUrl?: string
  imageUrl?: string
  iconUrl?: string
  sound?: string
  dbOrigin?: number
  targetAudience: 'All' | 'Role' | 'SpecificUsers'
  roleName?: string
  userIds?: string[]
}

export interface BroadcastPushDetail {
  userId?: string
  UserId?: string
  email?: string | null
  Email?: string | null
  rfc?: string | null
  Rfc?: string | null
  token?: string
  Token?: string
  platform?: string
  Platform?: string
  status?: string
  Status?: string
  messageId?: string | null
  MessageId?: string | null
  error?: string | null
  Error?: string | null
}

export interface BroadcastPushResponse {
  success?: boolean
  Success?: boolean
  message?: string
  Message?: string
  targetAudience?: string
  TargetAudience?: string
  totalUsersTargeted?: number
  TotalUsersTargeted?: number
  totalTokensFound?: number
  TotalTokensFound?: number
  sentCount?: number
  SentCount?: number
  failedCount?: number
  FailedCount?: number
  details?: BroadcastPushDetail[]
  Details?: BroadcastPushDetail[]
}
