import { api } from "@/shared/lib/axios"

export type ShiftPosition = {
  id: string
  name: string
}

export type StaffShift = {
  id: string
  positionId: string
  staffId: string
  staffName: string
  staffEmail: string
  shiftDate: string
  shiftLabel: string | null
  startTime: string | null
  endTime: string | null
}

export type WeekScheduleResponse = {
  weekStart: string
  weekEnd: string
  positions: ShiftPosition[]
  shifts: StaffShift[]
}

export const scheduleQueryKeys = {
  all: ["schedule"] as const,
  week: (startDate: string) => [...scheduleQueryKeys.all, "week", startDate] as const,
}

export const scheduleApi = {
  getWeek: async (startDate: string): Promise<WeekScheduleResponse> => {
    const res = await api.get<{ success: boolean; data: WeekScheduleResponse }>("/v1/provider/shifts/week", {
      params: { start_date: startDate },
    })
    return res.data.data
  },

  createPosition: async (name: string): Promise<ShiftPosition> => {
    const res = await api.post<{ success: boolean; data: ShiftPosition }>("/v1/provider/positions", { name })
    return res.data.data
  },

  assignShift: async (body: {
    position_id: string
    staff_id: string
    shift_date: string
  }): Promise<StaffShift> => {
    const res = await api.post<{ success: boolean; data: StaffShift }>("/v1/provider/shifts/assign", body)
    return res.data.data
  },

  updateShiftTime: async (body: {
    shift_id: string
    shift_label: string
    start_time: string
    end_time: string
  }): Promise<StaffShift> => {
    const res = await api.put<{ success: boolean; data: StaffShift }>("/v1/provider/shifts/update-time", body)
    return res.data.data
  },
}
