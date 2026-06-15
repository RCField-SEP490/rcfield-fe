import { api } from "@/shared/lib/axios"

export interface StaffListItem {
  id: string
  email: string
  fullName: string
  phone: string | null
  cafeId: string
  cafeName: string
  status: "PENDING" | "ACTIVE" | "DISABLED"
  createdAt: string
  activatedAt: string | null
  inviteExpiresAt: string | null
}

export interface InviteStaffBody {
  cafe_id: string
  full_name: string
  email: string
  phone?: string
}

export interface InviteStaffResult extends StaffListItem {
  emailSent: boolean
}

export interface TodayBookingItem {
  id: string
  shortCode?: string
  customerName: string
  customerPhone: string | null
  startTime: string
  endTime: string
  status: string
  mode: string
  vehicleName: string | null
  trackTypeName: string | null
  participantCount: number
  vehicleCount: number
  fnbPreorderAmount: number
}

export interface FnbOrderItemDetail {
  name: string
  quantity: number
  unitPrice: number
  subtotal: number
  notes: string | null
}

export interface TodayFnbOrderItem {
  id: string
  bookingId: string
  status: "PENDING" | "CONFIRMED" | "DELIVERED" | "CANCELLED"
  totalAmount: number
  createdAt: string
  slotStart: string
  customerName: string
  items: FnbOrderItemDetail[]
}

export const staffQueryKeys = {
  all: ["staff"] as const,
  list: (cafeId?: string) => [...staffQueryKeys.all, "list", cafeId ?? "all"] as const,
  todayBookings: () => [...staffQueryKeys.all, "today-bookings"] as const,
  fnbOrders: () => [...staffQueryKeys.all, "fnb-orders"] as const,
}

export const staffApi = {
  listStaff: async (cafeId?: string): Promise<StaffListItem[]> => {
    const res = await api.get<{ success: boolean; data: StaffListItem[] }>("/v1/provider/staff", {
      params: cafeId ? { cafe_id: cafeId } : undefined,
    })
    return res.data.data
  },

  inviteStaff: async (body: InviteStaffBody): Promise<InviteStaffResult> => {
    const res = await api.post<{ success: boolean; data: InviteStaffResult }>("/v1/provider/staff", body)
    return res.data.data
  },

  deactivateStaff: async (staffId: string): Promise<void> => {
    await api.patch(`/v1/provider/staff/${staffId}/deactivate`)
  },

  reactivateStaff: async (staffId: string): Promise<void> => {
    await api.patch(`/v1/provider/staff/${staffId}/reactivate`)
  },

  transferStaff: async (staffId: string, cafeId: string): Promise<void> => {
    await api.patch(`/v1/provider/staff/${staffId}/branch`, { cafe_id: cafeId })
  },

  resendInvite: async (staffId: string): Promise<{ emailSent: boolean }> => {
    const res = await api.post<{ success: boolean; data: { emailSent: boolean } }>(
      `/v1/provider/staff/${staffId}/resend-invite`,
    )
    return res.data.data
  },

  getTodayBookings: async (): Promise<TodayBookingItem[]> => {
    const res = await api.get<{ success: boolean; data: TodayBookingItem[] }>("/v1/staff/today-bookings")
    return res.data.data
  },

  getFnbOrders: async (): Promise<TodayFnbOrderItem[]> => {
    const res = await api.get<{ success: boolean; data: TodayFnbOrderItem[] }>("/v1/staff/fnb-orders")
    return res.data.data
  },

  updateFnbOrder: async (orderId: string, status: string): Promise<void> => {
    await api.patch(`/v1/staff/fnb-orders/${orderId}`, { status })
  },

  validateInviteToken: async (token: string): Promise<{ email: string; fullName: string }> => {
    const res = await api.get<{ success: boolean; data: { email: string; fullName: string } }>(
      "/v1/auth/staff-invite/validate",
      { params: { token } },
    )
    return res.data.data
  },

  activateAccount: async (
    token: string,
    password: string,
  ): Promise<{ access_token: string; refresh_token: string; user: { id: string; email: string; fullName: string; role: string; cafeId: string | null } }> => {
    const res = await api.post("/v1/auth/staff-invite/activate", { token, password })
    return res.data.data
  },
}
