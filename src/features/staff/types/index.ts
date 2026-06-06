import type { ApiEnvelope } from "@/features/cafes/types"

export type StaffRole = "STAFF"

export type StaffUser = {
  id: string
  email: string
  fullName: string
  phone: string | null
  role: StaffRole
  isActive: boolean
  cafeId: string
  cafeName: string
}

export type StaffListParams = {
  page?: number
  limit?: number
  cafe_id?: string
  is_active?: boolean
}

export type StaffListMeta = {
  total: number
  page: number
  limit: number
}

export type StaffListResponse = ApiEnvelope<StaffUser[]> & {
  meta: StaffListMeta
}

export type StaffCreateBody = {
  cafe_id: string
  full_name: string
  email: string
  phone?: string | null
  password?: string
}

export type StaffCreateResponse = ApiEnvelope<{
  id: string
  email: string
  fullName: string
  phone: string | null
  role: StaffRole
  isActive: boolean
  cafeId: string
  assignedBy: string
}>

export type StaffUpdateBody = {
  full_name: string
  phone: string | null
  email: string
}

export type StaffAssignBody = {
  cafe_id: string
}

export type StaffStatusBody = {
  is_active: boolean
}

export type StaffResetPasswordResponse = ApiEnvelope<{
  staff: {
    id: string
    email: string
    isActive: boolean
  }
  temporaryPassword: string
}>
