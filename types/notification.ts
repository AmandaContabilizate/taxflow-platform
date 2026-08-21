export type NotificationCategory = 'Todas' | 'Pre-Reportes' | 'SAT' | 'Sistema' | 'Renovacion';

export interface UserNotification {
  id: string;
  notificationCode: string;
  category: string;
  title: string;
  summary: string;
  detailUrl?: string | null;
  payloadJson?: string | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface UserNotificationsPagedResponse {
  unreadCount: number;
  totalCount: number;
  page: number;
  pageSize: number;
  items: UserNotification[];
}
