export const FNB_CATEGORIES = [
  { value: 'FOOD', label: 'Đồ ăn' },
  { value: 'DRINK', label: 'Đồ uống' },
  { value: 'SNACK', label: 'Ăn vặt' },
  { value: 'DESSERT', label: 'Tráng miệng' },
  { value: 'OTHER', label: 'Khác' },
] as const

export type FnbCategory = (typeof FNB_CATEGORIES)[number]['value']

export const FNB_CATEGORY_LABEL: Record<string, string> = {
  FOOD: 'Đồ ăn',
  DRINK: 'Đồ uống',
  SNACK: 'Ăn vặt',
  DESSERT: 'Tráng miệng',
  COMBO: 'Combo',
  OTHER: 'Khác',
}

export type MenuComponent = {
  itemId: string
  name: string
  quantity: number
}

export type MenuItem = {
  id: string
  cafeId: string
  name: string
  description: string | null
  price: string | number
  category: string | null
  isCombo: boolean
  components?: MenuComponent[]
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

export type ComboUpsertBody = {
  name: string
  description?: string | null
  price: number
  image_url?: string | null
  is_available?: boolean
  components: Array<{ item_id: string; quantity: number }>
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
