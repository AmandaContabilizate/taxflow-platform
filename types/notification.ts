export type NotificationCategory = 'Todas' | 'Pre-Reportes' | 'Contable' | 'SAT' | 'Sistema' | 'Renovacion' | 'Alertas';

export interface UserNotification {
  id: string;
  notificationCode: string;
  category: string;
  title: string;
  summary: string;
  imageUrl?: string | null;
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

export interface UserNotificationUnreadCountResponse {
  unreadCount: number;
}

export interface MarkNotificationReadDto {
  isRead: boolean;
}

export interface SeedTestNotificationDto {
  userId?: string;
  notificationCode?: string;
  category?: string;
  title?: string;
  summary?: string;
  detailUrl?: string;
}
