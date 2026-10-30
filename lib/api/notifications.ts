import { UserNotification, UserNotificationsPagedResponse } from '@/types/notification';

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return '/api/v1/user-notifications';
  }
  const baseProc = process.env.API_BASE_PROCEDURES || 'https://localhost:7165/api';
  return `${baseProc.replace(/\/api\/?$/, '')}/api/v1/user-notifications`;
};

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.title || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

function getHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('auth_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchNotifications(
  page = 1,
  pageSize = 20,
  isRead?: boolean,
  category?: string
): Promise<UserNotificationsPagedResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });

  if (isRead !== undefined) {
    params.append('isRead', isRead.toString());
  }

  if (category && category !== 'Todas') {
    params.append('category', category);
  }

  const url = `${getApiBaseUrl()}?${params.toString()}`;
  const response = await fetch(url, { method: 'GET', headers: getHeaders() });
  return handleResponse<UserNotificationsPagedResponse>(response);
}

export async function fetchUnreadCount(): Promise<{ unreadCount: number }> {
  const url = `${getApiBaseUrl()}/unread-count`;
  const response = await fetch(url, { method: 'GET', headers: getHeaders() });
  return handleResponse<{ unreadCount: number }>(response);
}

export async function markNotificationAsRead(
  id: string,
  isRead = true
): Promise<{ success: boolean; isRead: boolean; unreadCount: number }> {
  const url = `${getApiBaseUrl()}/${id}/read`;
  const response = await fetch(url, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ isRead }),
  });
  return handleResponse<{ success: boolean; isRead: boolean; unreadCount: number }>(response);
}

export async function markAllNotificationsAsRead(): Promise<{ success: boolean; updatedCount: number; unreadCount: number }> {
  const url = `${getApiBaseUrl()}/mark-all-read`;
  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
  });
  return handleResponse<{ success: boolean; updatedCount: number; unreadCount: number }>(response);
}

export async function deleteNotification(id: string): Promise<{ success: boolean; unreadCount: number }> {
  const url = `${getApiBaseUrl()}/${id}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return handleResponse<{ success: boolean; unreadCount: number }>(response);
}

export async function seedTestNotification(customData?: Partial<UserNotification>): Promise<{ notification: UserNotification; unreadCount: number }> {
  const url = `${getApiBaseUrl()}/seed-test`;
  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(customData || {}),
  });
  return handleResponse<{ notification: UserNotification; unreadCount: number }>(response);
}