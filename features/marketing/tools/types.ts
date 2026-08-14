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
  email?: string
  Email?: string
  rfc?: string
  Rfc?: string
  token?: string
  Token?: string
  platform?: string
  Platform?: string
  status?: string
  Status?: string
  messageId?: string
  MessageId?: string
  error?: string
  Error?: string
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
