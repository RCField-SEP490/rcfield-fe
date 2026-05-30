export type CafeStatus = "PENDING" | "ACTIVE" | "SUSPENDED"

export type TrackType = "DRIFT" | "OBSTACLE" | "HILL_CLIMB"

export type CafeOperatingHour = {
  open?: string
  close?: string
  is_closed?: boolean
}

export type CafeOperatingHours = Record<string, CafeOperatingHour>

export type BackendCafe = {
  id: string
  providerId: string
  name: string
  slug: string
  description: string | null
  phone: string | null
  status: CafeStatus
  coverImageUrl: string | null
  address: string
  district: string
  city: string
  latitude: number | string | null
  longitude: number | string | null
  operatingHours: CafeOperatingHours
  trackTypes: TrackType[]
  slotDurationMinutes: number
  slotFeeRate: number | string
  maxConcurrentBookings: number
  minBookingNoticeMinutes: number
  byocCapacity: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export type CafeImage = {
  id: string
  cafeId: string
  url: string
  sortOrder: number
  createdAt: string
}

export type CafeListParams = {
  page?: number
  limit?: number
  district?: string
  city?: string
  track_type?: TrackType
  status?: CafeStatus
}

export type CafeListMeta = {
  total: number
  page: number
  limit: number
}

export type ApiEnvelope<T> = {
  success: boolean
  data: T
}

export type CafeListResponse = ApiEnvelope<BackendCafe[]> & {
  meta: CafeListMeta
}
