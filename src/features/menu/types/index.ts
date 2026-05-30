export type MenuItem = {
  id: string
  cafeId: string
  name: string
  description: string | null
  price: string | number
  category: string | null
  imageUrl: string | null
  isAvailable: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export type MenuListParams = {
  page?: number
  limit?: number
  category?: string
  available?: boolean
}

export type MenuUpsertBody = {
  name: string
  description?: string | null
  price: number
  category?: string | null
  image_url?: string | null
  is_available?: boolean
}

export type ApiEnvelope<T> = {
  success: boolean
  data: T
}

export type MenuListResponse = ApiEnvelope<MenuItem[]> & {
  meta: {
    total: number
    page: number
    limit: number
  }
}
