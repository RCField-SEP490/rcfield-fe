export type NotificationType =
  | 'ACCOUNT_APPROVED'
  | 'ACCOUNT_REJECTED'
  | 'ACCOUNT_SUSPENDED'
  | 'ACCOUNT_UNSUSPENDED'
  | 'TRIAL_EXPIRING_SOON'
  | 'GRACE_PERIOD_STARTED'
  | 'SUBSCRIPTION_EXPIRED'
  | 'SUBSCRIPTION_ACTIVATED'
  | 'PAYMENT_REQUEST_CONFIRMED'
  | 'PAYMENT_REQUEST_REJECTED'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  readAt: string | null
  createdAt: string
}

export interface NotificationListResponse {
  data: Notification[]
  total: number
  unreadCount: number
}
