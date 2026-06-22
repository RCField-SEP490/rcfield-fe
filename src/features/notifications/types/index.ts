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
  | 'SESSION_CHECKIN_INSPECTION'
  | 'SESSION_CHECKOUT_INSPECTION'
  | 'SESSION_EXTENSION_PROPOSED'
  | 'SESSION_FNB_ORDER_ADDED'
  | 'CUSTOMER_CHECKIN_CONFIRMED'
  | 'CUSTOMER_CHECKOUT_CONFIRMED'
  | 'CUSTOMER_INSPECTION_DISPUTED'
  | 'CUSTOMER_EXTENSION_APPROVED'
  | 'CUSTOMER_EXTENSION_REJECTED'
  | 'CUSTOMER_PAYMENT_CONFIRMED'

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
