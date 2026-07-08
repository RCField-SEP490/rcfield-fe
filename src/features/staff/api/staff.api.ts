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
  lastActiveAt: string | null
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

export interface StaffImpersonateResponse {
  token: string
  staff: { id: string; email: string; fullName: string; cafeName: string; cafeId: string }
}

export interface TodayBookingItem {
  id: string
  shortCode?: string
  customerName: string
  customerPhone: string | null
  startTime: string
  endTime: string
  createdAt: string
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

export interface StaffDetailProfile {
  id: string
  fullName: string
  email: string
  phone: string | null
  cafeName: string
  cafeId: string
  status: "PENDING" | "ACTIVE" | "DISABLED"
  createdAt: string
  activatedAt: string | null
  lastActiveAt: string | null
}

export interface StaffKpiSummary {
  staffId: string
  period: "7d" | "30d" | "90d"
  totalCheckIns: number
  totalFnbOrdersHandled: number
  totalExtensionsApproved: number
  onTimeCheckInRate: number | null
  activeDaysCount: number
}

export interface StaffActivityEvent {
  id: string
  type: "CHECK_IN" | "CHECK_OUT" | "FNB_ORDER" | "EXTENSION_APPROVED"
  eventTime: string
  label: string
  bookingId: string
  bookingSource: "APP" | "STAFF_MANUAL"
}

export interface StaffActivityPage {
  events: StaffActivityEvent[]
  total: number
  hasMore: boolean
}

export const staffQueryKeys = {
  all: ["staff"] as const,
  list: (cafeId?: string) => [...staffQueryKeys.all, "list", cafeId ?? "all"] as const,
  todayBookings: () => [...staffQueryKeys.all, "today-bookings"] as const,
  fnbOrders: () => [...staffQueryKeys.all, "fnb-orders"] as const,
  staffDetail: (staffId: string) => [...staffQueryKeys.all, "detail", staffId] as const,
  staffKpi: (staffId: string, period: string) => [...staffQueryKeys.all, "kpi", staffId, period] as const,
  staffActivity: (staffId: string) => [...staffQueryKeys.all, "activity", staffId] as const,
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

  impersonateStaff: async (staffId: string): Promise<StaffImpersonateResponse> => {
    const res = await api.post<StaffImpersonateResponse>(`/v1/provider/staff/${staffId}/impersonate`)
    return res.data
  },

  resendInvite: async (staffId: string): Promise<{ emailSent: boolean }> => {
    const res = await api.post<{ success: boolean; data: { emailSent: boolean } }>(
      `/v1/provider/staff/${staffId}/resend-invite`,
    )
    return res.data.data
  },

  getTodayBookings: async (): Promise<any[]> => {
    const res = await api.get<{ success: boolean; data: any[] }>("/v1/staff/today-bookings")
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

  getStaffDetail: async (staffId: string): Promise<StaffDetailProfile> => {
    const res = await api.get<{ success: boolean; data: StaffDetailProfile }>(`/v1/provider/staff/${staffId}`)
    return res.data.data
  },

  getStaffKpi: async (staffId: string, period: "7d" | "30d" | "90d"): Promise<StaffKpiSummary> => {
    const res = await api.get<{ success: boolean; data: StaffKpiSummary }>(`/v1/provider/staff/${staffId}/kpi`, { params: { period } })
    return res.data.data
  },

  getStaffActivity: async (staffId: string, limit = 20, offset = 0): Promise<StaffActivityPage> => {
    const res = await api.get<{ success: boolean; data: StaffActivityPage }>(`/v1/provider/staff/${staffId}/activity`, { params: { limit, offset } })
    return res.data.data
  },

  checkIn: async (bookingId: string): Promise<any> => {
    const res = await api.post<{ success: boolean; data: any }>(`/v1/staff/bookings/${bookingId}/check-in`)
    return res.data.data
  },

  getSessionDetail: async (sessionId: string): Promise<any> => {
    const res = await api.get<{ success: boolean; data: any }>(`/v1/staff/sessions/${sessionId}`)
    return res.data.data
  },

  submitInspection: async (sessionId: string, data: any): Promise<any> => {
    const res = await api.post<{ success: boolean; data: any }>(`/v1/staff/sessions/${sessionId}/inspections`, data)
    return res.data.data
  },

  proposeExtension: async (sessionId: string, data: { extraMinutes: number; additionalFee: number; direct?: boolean }): Promise<any> => {
    const res = await api.post<{ success: boolean; data: any }>(`/v1/staff/sessions/${sessionId}/extensions`, data)
    return res.data.data
  },

  addSessionFnbOrder: async (sessionId: string, data: { items: { name: string; qty: number; price: number }[] }): Promise<any> => {
    const res = await api.post<{ success: boolean; data: any }>(`/v1/staff/sessions/${sessionId}/fnb-orders`, data)
    return res.data.data
  },

  swapSessionVehicle: async (
    sessionId: string,
    data: { oldVehicleId: string; newVehicleId: string; oldVehicleNewStatus: string }
  ): Promise<any> => {
    const res = await api.post<{ success: boolean; data: any }>(`/v1/staff/sessions/${sessionId}/swap-vehicle`, data)
    return res.data.data
  },

  simulateClientCheckIn: async (sessionId: string): Promise<any> => {
    const res = await api.post<{ success: boolean; data: any }>(`/v1/staff/sessions/${sessionId}/simulate-check-in-response`)
    return res.data.data
  },

  simulateClientCheckOut: async (sessionId: string): Promise<any> => {
    const res = await api.post<{ success: boolean; data: any }>(`/v1/staff/sessions/${sessionId}/simulate-check-out-response`)
    return res.data.data
  },

  simulateClientExtension: async (sessionId: string, data: { approved: boolean }): Promise<any> => {
    const res = await api.post<{ success: boolean; data: any }>(`/v1/staff/sessions/${sessionId}/simulate-extension-response`, data)
    return res.data.data
  },

  settlePendingPayments: async (bookingId: string): Promise<any> => {
    const res = await api.post<{ success: boolean; data: any }>(`/v1/staff/bookings/${bookingId}/settle-pending-payments`)
    return res.data.data
  },

  confirmRefund: async (bookingId: string): Promise<any> => {
    const res = await api.post<{ success: boolean; data: any }>(`/v1/staff/bookings/${bookingId}/confirm-refund`)
    return res.data.data
  },
}
