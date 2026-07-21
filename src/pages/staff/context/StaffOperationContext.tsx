/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/set-state-in-effect */
import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useAuthStore } from "@/features/auth/stores/auth.store"
import { useWebSocket, type WsMessage } from "@/features/notifications/hooks/useWebSocket"
import { staffApi, staffQueryKeys, type DamageLineItemInput } from "@/features/staff/api/staff.api"
import {
  type CustomerBookingDetail,
  type MockSessionDetail,
  type InspectionPhoto,
  type ChecklistItem,
} from "@/shared/data/customer-operational-mock-data"
import {
  initialMockBookings,
  initialMockIncidents,
  initialMockMaintenanceLogs,
  initialMockByocRegistry,
  initialMockPackages,
  type StaffIncident,
  type StaffMaintenanceLog,
  type StaffByocVehicle,
  type StaffCustomerPackage,
} from "@/shared/data/staff-seed-data"
import { VehicleStatus } from "@/features/vehicles/types"

export interface FnbOrder {
  orderId: string
  sessionId: string
  tableName: string
  items: { name: string; qty: number; price: number }[]
  total: number
  status: "PENDING" | "PREPARING" | "DELIVERED" | "CANCELLED"
  createdAt: string
}

export interface StaffOperationContextType {
  assignedCafeId: string | null
  setAssignedCafeId: (cafeId: string | null) => void
  bookings: CustomerBookingDetail[]
  sessions: MockSessionDetail[]
  fnbOrders: FnbOrder[]
  incidents: StaffIncident[]
  maintenanceLogs: StaffMaintenanceLog[]
  byocRegistry: StaffByocVehicle[]
  customerPackages: StaffCustomerPackage[]
  
  resetDemoData: () => void
  createWalkInBooking: (data: {
    playMode: "RENTAL" | "BYOC"
    trackTypeId: string
    slotStart: string
    slotEnd: string
    paymentMethod: "CASH" | "BANK_TRANSFER"
    vehicleIds: string[]
    participants: { guest_name: string; guest_phone: string; participant_type: string }[]
  }) => Promise<boolean>
  refreshData: () => Promise<void>
  startCheckIn: (bookingId: string) => Promise<any | null>
  submitInspection: (
    sessionId: string,
    type: "CHECK_IN" | "CHECK_OUT",
    photos: InspectionPhoto[],
    checklist: ChecklistItem[],
    staffNotes: string,
    damageFlagged: boolean,
    damageLineItems?: DamageLineItemInput[]
  ) => Promise<boolean>
  proposeExtension: (sessionId: string, extraMinutes: number, additionalFee: number, direct?: boolean) => void
  addFnbOrder: (sessionId: string, items: { name: string; qty: number; price: number }[]) => void
  updateFnbOrderStatus: (orderId: string, status: FnbOrder["status"]) => void
  swapSessionVehicle: (
    sessionId: string,
    oldVehicleId: string,
    newVehicleId: string,
    oldVehicleNewStatus: keyof typeof VehicleStatus,
    newVehicleData: { name: string; imageUrl?: string }
  ) => void
  fleetStates: Record<string, keyof typeof VehicleStatus>
  updateFleetVehicleStatus: (vehicleId: string, status: keyof typeof VehicleStatus) => void

  // Operational spec helpers
  logIncident: (incident: Omit<StaffIncident, "incidentId" | "createdAt">) => void
  resolveIncident: (incidentId: string) => void
  logMaintenance: (log: Omit<StaffMaintenanceLog, "logId" | "createdAt">) => void
  updateMaintenanceStatus: (logId: string, status: StaffMaintenanceLog["status"], notes: string) => void
  registerByoc: (byoc: Omit<StaffByocVehicle, "id" | "lastCheckedAt">) => void
  updateByocSafety: (id: string, safetyChecked: boolean) => void
  headerProps: { title: string; subtitle?: string; action?: React.ReactNode } | null
  setHeaderProps: (props: { title: string; subtitle?: string; action?: React.ReactNode } | null) => void
}

const StaffOperationContext = createContext<StaffOperationContextType | undefined>(undefined)

export function useStaffOperations() {
  const context = useContext(StaffOperationContext)
  if (!context) {
    throw new Error("useStaffOperations must be used within a StaffOperationContextProvider")
  }
  return context
}

export const StaffOperationContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const role = useAuthStore((state) => state.role)
  const userId = user?.id || "anonymous"

  const bookingsKey = `rcfield:staff_operations:bookings:${userId}`
  const fnbOrdersKey = `rcfield:staff_operations:fnb_orders:${userId}`
  const fleetKey = `rcfield:staff_operations:fleet_states:${userId}`
  const incidentsKey = `rcfield:staff_operations:incidents:${userId}`
  const maintenanceKey = `rcfield:staff_operations:maintenance:${userId}`
  const byocKey = `rcfield:staff_operations:byoc:${userId}`

  const [assignedCafeId, setAssignedCafeIdState] = useState<string | null>(null)
  const [headerProps, setHeaderProps] = useState<{ title: string; subtitle?: string; action?: React.ReactNode } | null>(null)

  useEffect(() => {
    if (role === "staff") {
      setAssignedCafeIdState(user?.assignedCafeId ?? null)
    } else {
      setAssignedCafeIdState(null)
    }
  }, [user, role])

  const [bookings, setBookings] = useState<CustomerBookingDetail[]>([])
  const [fnbOrders, setFnbOrders] = useState<FnbOrder[]>([])
  const [fleetStates, setFleetStates] = useState<Record<string, keyof typeof VehicleStatus>>({})
  
  const [incidents, setIncidents] = useState<StaffIncident[]>([])
  const [maintenanceLogs, setMaintenanceLogs] = useState<StaffMaintenanceLog[]>([])
  const [byocRegistry, setByocRegistry] = useState<StaffByocVehicle[]>([])
  const [customerPackages] = useState<StaffCustomerPackage[]>(initialMockPackages)

  // Compute all sessions across bookings
  const sessions = bookings.flatMap((b) => b.sessions || [])

  const fetchData = useCallback(async () => {
    try {
      const todayBookings = await staffApi.getTodayBookings()
      setBookings(todayBookings)
      queryClient.setQueryData(staffQueryKeys.todayBookings(), todayBookings)

      // Sync active F&B orders
      const extractedFnb: FnbOrder[] = []
      todayBookings.forEach((b: any) => {
        b.sessions?.forEach((s: any) => {
          s.fnbOrders?.forEach((order: any) => {
            extractedFnb.push({
              orderId: order.orderId,
              sessionId: s.sessionId,
              tableName: b.trackName,
              items: order.items,
              total: order.total,
              status: "PENDING",
              createdAt: new Date().toISOString(),
            })
          })
        })
      })
      setFnbOrders(extractedFnb)
    } catch (err: any) {
      console.error("Failed to load today bookings:", err)
    }
  }, [queryClient])

  useEffect(() => {
    if (role === "staff") {
      fetchData()
    }
  }, [role, fetchData])

  const handleRealtimeMessage = useCallback(
    (msg: WsMessage) => {
      // Invalidate notifications query so the notification count/list updates immediately
      void queryClient.invalidateQueries({ queryKey: ["notifications"] })

      const data = msg.data as { sessionId?: string; type?: string; note?: string } | undefined

      if (msg.event === "CUSTOMER_CHECKIN_CONFIRMED") {
        void fetchData()
        return
      }

      if (msg.event === "CUSTOMER_CHECKOUT_CONFIRMED") {
        toast.success("Khách đã xác nhận trả xe", {
          description: data?.sessionId ? `Phiên ${data.sessionId} đã hoàn tất.` : undefined,
        })
        void fetchData()
        return
      }

      if (msg.event === "CUSTOMER_EXTENSION_APPROVED" || msg.event === "CUSTOMER_EXTENSION_REJECTED") {
        if (msg.event === "CUSTOMER_EXTENSION_APPROVED") {
          toast.success("Khách đã đồng ý gia hạn", {
            description: data?.sessionId ? `Phiên ${data.sessionId} đã được cập nhật.` : undefined,
          })
        } else {
          toast.warning("Khách đã từ chối gia hạn", {
            description: data?.sessionId ? `Phiên ${data.sessionId} đã được cập nhật.` : undefined,
          })
        }
        void fetchData()
        return
      }

      if (msg.event === "CUSTOMER_INSPECTION_DISPUTED") {
        toast.warning("Khách phản hồi sai lệch biên bản", {
          description: data?.note || "Cần kiểm tra lại xe và lập biên bản mới.",
        })
        void fetchData()
        return
      }

      if (msg.event === "CUSTOMER_PAYMENT_CONFIRMED") {
        toast.success("Khách đã thanh toán phí phát sinh tại quầy", {
          description: "Ca chơi đã cập nhật trạng thái quyết toán thành công.",
        })
        void fetchData()
        return
      }

      if (msg.event === "NEW_BOOKING") {
        const bookingData = msg.data as { bookingId?: string; cafeName?: string; slotStart?: string } | undefined
        toast.info("Có đặt lịch mới!", {
          description: bookingData?.slotStart
            ? `Khung giờ ${new Date(bookingData.slotStart).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`
            : undefined,
        })
        void fetchData()
        void queryClient.invalidateQueries({ queryKey: staffQueryKeys.bookingLists() })
        void queryClient.invalidateQueries({ queryKey: staffQueryKeys.todayBookings() })
        return
      }
    },
    [fetchData, queryClient],
  )

  useWebSocket(handleRealtimeMessage)

  // Sync state with localStorage for other metrics (incidents, maintenance, byoc)
  useEffect(() => {
    const storedFleet = localStorage.getItem(fleetKey)
    const storedIncidents = localStorage.getItem(incidentsKey)
    const storedMaintenance = localStorage.getItem(maintenanceKey)
    const storedByoc = localStorage.getItem(byocKey)

    if (storedFleet) {
      setFleetStates(JSON.parse(storedFleet))
    } else {
      const initialFleet: Record<string, keyof typeof VehicleStatus> = {
        "V-MAZDA-RX7": "IN_USE",
        "V-NISSAN-GTR": "IN_USE",
        "V-SUBARU-BRZ": "IN_USE",
        "V-MAZDA-RX7-OUT": "IN_USE",
      }
      setFleetStates(initialFleet)
      localStorage.setItem(fleetKey, JSON.stringify(initialFleet))
    }

    if (storedIncidents) {
      setIncidents(JSON.parse(storedIncidents))
    } else {
      setIncidents(initialMockIncidents)
      localStorage.setItem(incidentsKey, JSON.stringify(initialMockIncidents))
    }

    if (storedMaintenance) {
      const parsed: StaffMaintenanceLog[] = JSON.parse(storedMaintenance)
      const enriched = parsed.map((item) => {
        const defaultMock = initialMockMaintenanceLogs.find((m) => m.logId === item.logId)
        return {
          ...item,
          cafeName: item.cafeName || defaultMock?.cafeName || "RC Field Quận 4",
          categoryName: item.categoryName || defaultMock?.categoryName || "Drift Special Nitro",
          categoryTier: item.categoryTier || defaultMock?.categoryTier || "PREMIUM",
          inspectionPhotos:
            item.inspectionPhotos && item.inspectionPhotos.length > 0
              ? item.inspectionPhotos
              : defaultMock?.inspectionPhotos,
          damagedChecklist:
            item.damagedChecklist && item.damagedChecklist.length > 0
              ? item.damagedChecklist
              : defaultMock?.damagedChecklist,
        }
      })
      setMaintenanceLogs(enriched)
      localStorage.setItem(maintenanceKey, JSON.stringify(enriched))
    } else {
      setMaintenanceLogs(initialMockMaintenanceLogs)
      localStorage.setItem(maintenanceKey, JSON.stringify(initialMockMaintenanceLogs))
    }

    if (storedByoc) {
      setByocRegistry(JSON.parse(storedByoc))
    } else {
      setByocRegistry(initialMockByocRegistry)
      localStorage.setItem(byocKey, JSON.stringify(initialMockByocRegistry))
    }
  }, [userId, fleetKey, incidentsKey, maintenanceKey, byocKey])

  const setAssignedCafeId = useCallback((_cafeId: string | null) => {
    // No-op - derived directly from auth store profile
  }, [])

  // const saveBookings = useCallback((newBookings: CustomerBookingDetail[]) => {
  //   setBookings(newBookings)
  //   localStorage.setItem(bookingsKey, JSON.stringify(newBookings))
  // }, [bookingsKey])

  const saveFnbOrders = useCallback((newOrders: FnbOrder[]) => {
    setFnbOrders(newOrders)
    localStorage.setItem(fnbOrdersKey, JSON.stringify(newOrders))
  }, [fnbOrdersKey])

  const saveFleetStates = useCallback((newFleet: Record<string, keyof typeof VehicleStatus>) => {
    setFleetStates(newFleet)
    localStorage.setItem(fleetKey, JSON.stringify(newFleet))
  }, [fleetKey])

  const saveIncidents = useCallback((newIncidents: StaffIncident[]) => {
    setIncidents(newIncidents)
    localStorage.setItem(incidentsKey, JSON.stringify(newIncidents))
  }, [incidentsKey])

  const saveMaintenanceLogs = useCallback((newLogs: StaffMaintenanceLog[]) => {
    setMaintenanceLogs(newLogs)
    localStorage.setItem(maintenanceKey, JSON.stringify(newLogs))
  }, [maintenanceKey])

  const saveByocRegistry = useCallback((newByoc: StaffByocVehicle[]) => {
    setByocRegistry(newByoc)
    localStorage.setItem(byocKey, JSON.stringify(newByoc))
  }, [byocKey])

  const updateFleetVehicleStatus = useCallback((vehicleId: string, status: keyof typeof VehicleStatus) => {
    saveFleetStates({
      ...fleetStates,
      [vehicleId]: status,
    })
  }, [fleetStates, saveFleetStates])

  const resetDemoData = useCallback(() => {
    localStorage.removeItem(bookingsKey)
    localStorage.removeItem(fnbOrdersKey)
    localStorage.removeItem(fleetKey)
    localStorage.removeItem(incidentsKey)
    localStorage.removeItem(maintenanceKey)
    localStorage.removeItem(byocKey)
    
    setBookings(initialMockBookings)
    localStorage.setItem(bookingsKey, JSON.stringify(initialMockBookings))

    const initialFnb: FnbOrder[] = []
    initialMockBookings.forEach((b) => {
      b.sessions?.forEach((s) => {
        s.fnbOrders?.forEach((order, idx) => {
          initialFnb.push({
            orderId: order.orderId,
            sessionId: s.sessionId,
            tableName: b.trackName,
            items: order.items,
            total: order.total,
            status: "DELIVERED",
            createdAt: new Date(Date.now() - (idx + 1) * 3600000).toISOString(),
          })
        })
      })
    })
    setFnbOrders(initialFnb)
    localStorage.setItem(fnbOrdersKey, JSON.stringify(initialFnb))

    const initialFleet: Record<string, keyof typeof VehicleStatus> = {
      "V-MAZDA-RX7": "IN_USE",
      "V-NISSAN-GTR": "IN_USE",
      "V-SUBARU-BRZ": "IN_USE",
      "V-MAZDA-RX7-OUT": "IN_USE",
    }
    setFleetStates(initialFleet)
    localStorage.setItem(fleetKey, JSON.stringify(initialFleet))

    setIncidents(initialMockIncidents)
    localStorage.setItem(incidentsKey, JSON.stringify(initialMockIncidents))

    setMaintenanceLogs(initialMockMaintenanceLogs)
    localStorage.setItem(maintenanceKey, JSON.stringify(initialMockMaintenanceLogs))

    setByocRegistry(initialMockByocRegistry)
    localStorage.setItem(byocKey, JSON.stringify(initialMockByocRegistry))

    toast.success("Đã khôi phục dữ liệu vận hành cục bộ về mặc định thành công.")
  }, [bookingsKey, fnbOrdersKey, fleetKey, incidentsKey, maintenanceKey, byocKey])

  const createWalkInBooking = useCallback(async (data: {
    playMode: "RENTAL" | "BYOC"
    trackTypeId: string
    slotStart: string
    slotEnd: string
    paymentMethod: "CASH" | "BANK_TRANSFER"
    vehicleIds: string[]
    participants: { guest_name: string; guest_phone: string; participant_type: string }[]
  }) => {
    try {
      const res = await staffApi.createWalkInBooking({
        play_mode: data.playMode,
        track_type_id: data.trackTypeId,
        slot_start: data.slotStart,
        slot_end: data.slotEnd,
        payment_method: data.paymentMethod,
        vehicle_ids: data.vehicleIds,
        participants: data.participants,
      })
      toast.success(`Tạo đơn đặt lịch trực tiếp ${res.bookingCode || ""} thành công!`)
      await Promise.all([
        fetchData(),
        queryClient.invalidateQueries({ queryKey: staffQueryKeys.bookingLists() }),
        queryClient.invalidateQueries({ queryKey: staffQueryKeys.todayBookings() }),
      ])
      return true
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; errors?: { message: string }[] } }; message?: string }
      const msg = error.response?.data?.message || error.response?.data?.errors?.[0]?.message || error.message || "Something went wrong"
      toast.error(`Lỗi khi tạo đơn: ${msg}`)
      return false
    }
  }, [fetchData, queryClient])

  const startCheckIn = useCallback(async (bookingId: string) => {
    try {
      const data = await staffApi.checkIn(bookingId)
      toast.success(`Đã khởi tạo quy trình Check-In cho session ${data.id || data.sessionId}. Cần làm kiểm xe.`)
      await fetchData()
      return data
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể Check-In")
      return null
    }
  }, [fetchData])

  const submitInspection = useCallback(async (
    sessionId: string,
    type: "CHECK_IN" | "CHECK_OUT",
    photos: InspectionPhoto[],
    checklist: ChecklistItem[],
    staffNotes: string,
    damageFlagged: boolean,
    damageLineItems?: DamageLineItemInput[]
  ) => {
    try {
      const formattedChecklist = checklist.map(item => ({
        itemKey: item.id,
        itemLabel: item.label,
        status: item.checked ? "OK" : "BROKEN",
        note: item.notes || ""
      }))
      const formattedPhotos = photos.map(p => ({
        angle: p.direction,
        url: p.url,
        notes: p.notes,
      }))
      await staffApi.submitInspection(sessionId, {
        type,
        photos: formattedPhotos,
        checklist: formattedChecklist,
        staffNotes,
        damageFlagged,
        damageLineItems,
      })

      if (type === "CHECK_IN") {
        toast.success("Check-In thành công")
      } else {
        if (damageFlagged) {
          toast.warning(`Phát hiện hư hỏng xe! Vui lòng xem lại biên bản và xác nhận với khách.`)
        } else {
          toast.success(`Hoàn tất kiểm xe Check-Out. Vui lòng xem biên bản và xác nhận với khách.`)
        }
      }
      await fetchData()
      return true
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể gửi báo cáo kiểm xe")
      return false
    }
  }, [fetchData])

  const proposeExtension = useCallback(async (sessionId: string, extraMinutes: number, additionalFee: number, direct?: boolean) => {
    try {
      await staffApi.proposeExtension(sessionId, { extraMinutes, additionalFee, direct })
      toast.success(
        direct
          ? `Đã gia hạn trực tiếp thêm ${extraMinutes} phút.`
          : `Đã gửi yêu cầu gia hạn thêm ${extraMinutes} phút đến khách hàng.`
      )
      await fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể gửi đề xuất gia hạn")
    }
  }, [fetchData])

  const addFnbOrder = useCallback(async (sessionId: string, items: { name: string; qty: number; price: number }[]) => {
    try {
      await staffApi.addSessionFnbOrder(sessionId, { items })
      toast.success(`Đã thêm món F&B thành công cho phiên chạy!`)
      await fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể gọi món F&B")
    }
  }, [fetchData])

  const updateFnbOrderStatus = useCallback((orderId: string, status: FnbOrder["status"]) => {
    // Left as-is or mapped if needed
    const updatedOrders = fnbOrders.map((o) => {
      if (o.orderId === orderId) {
        return { ...o, status }
      }
      return o
    })
    saveFnbOrders(updatedOrders)
  }, [fnbOrders, saveFnbOrders])

  const swapSessionVehicle = useCallback(async (
    sessionId: string,
    oldVehicleId: string,
    newVehicleId: string,
    oldVehicleNewStatus: keyof typeof VehicleStatus,
    newVehicleData: { name: string; imageUrl?: string }
  ) => {
    try {
      await staffApi.swapSessionVehicle(sessionId, {
        oldVehicleId,
        newVehicleId,
        oldVehicleNewStatus
      })
      toast.success(`Đã đổi xe thành công từ xe cũ sang ${newVehicleData.name}`)
      await fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể đổi xe")
    }
  }, [fetchData])

  // Incident log helpers
  const logIncident = useCallback((incident: Omit<StaffIncident, "incidentId" | "createdAt">) => {
    const newIncident: StaffIncident = {
      ...incident,
      incidentId: `INC-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
    }
    saveIncidents([newIncident, ...incidents])
    toast.success(`Đã tạo hồ sơ báo cáo sự cố ${newIncident.incidentId} thành công!`)
  }, [incidents, saveIncidents])

  const resolveIncident = useCallback((incidentId: string) => {
    const updated = incidents.map((inc) => {
      if (inc.incidentId === incidentId) {
        return { ...inc, status: "RESOLVED" as const }
      }
      return inc
    })
    saveIncidents(updated)
    toast.success(`Sự cố ${incidentId} đã được đánh dấu là đã giải quyết.`)
  }, [incidents, saveIncidents])

  // Maintenance logging helpers
  const logMaintenance = useCallback((log: Omit<StaffMaintenanceLog, "logId" | "createdAt">) => {
    const newLog: StaffMaintenanceLog = {
      ...log,
      logId: `MNT-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
    }
    saveMaintenanceLogs([newLog, ...maintenanceLogs])
    
    // Auto sync vehicle state
    if (log.status === "IN_PROGRESS") {
      updateFleetVehicleStatus(log.vehicleId, "MAINTENANCE")
    }
    toast.success(`Đã ghi nhận kế hoạch bảo trì ${newLog.logId} cho xe ${log.vehicleName}!`)
  }, [maintenanceLogs, saveMaintenanceLogs, updateFleetVehicleStatus])

  const updateMaintenanceStatus = useCallback((logId: string, status: StaffMaintenanceLog["status"], notes: string) => {
    const updated = maintenanceLogs.map((log) => {
      if (log.logId === logId) {
        const completedAt = status === "COMPLETED" ? new Date().toISOString() : log.completedAt
        
        // Sync vehicle fleet status
        if (status === "COMPLETED") {
          updateFleetVehicleStatus(log.vehicleId, "AVAILABLE")
        } else if (status === "IN_PROGRESS") {
          updateFleetVehicleStatus(log.vehicleId, "MAINTENANCE")
        }

        return {
          ...log,
          status,
          staffNotes: notes || log.staffNotes,
          completedAt,
        }
      }
      return log
    })
    saveMaintenanceLogs(updated)
    toast.success(`Đã cập nhật trạng thái bảo trì đơn ${logId} thành công.`)
  }, [maintenanceLogs, saveMaintenanceLogs, updateFleetVehicleStatus])

  // BYOC Registry helpers
  const registerByoc = useCallback((byoc: Omit<StaffByocVehicle, "id" | "lastCheckedAt">) => {
    const newByoc: StaffByocVehicle = {
      ...byoc,
      id: `BYOC-${Math.floor(100 + Math.random() * 900)}`,
      lastCheckedAt: new Date().toISOString(),
    }
    saveByocRegistry([newByoc, ...byocRegistry])
    toast.success(`Đã đăng ký và kiểm định an toàn xe tự mang ${newByoc.id}!`)
  }, [byocRegistry, saveByocRegistry])

  const updateByocSafety = useCallback((id: string, safetyChecked: boolean) => {
    const updated = byocRegistry.map((car) => {
      if (car.id === id) {
        return {
          ...car,
          safetyChecked,
          lastCheckedAt: new Date().toISOString(),
        }
      }
      return car
    })
    saveByocRegistry(updated)
    toast.success(`Đã cập nhật trạng thái kiểm định an toàn xe ${id} thành ${safetyChecked ? "ĐẠT" : "KHÔNG ĐẠT"}.`)
  }, [byocRegistry, saveByocRegistry])

  return (
    <StaffOperationContext.Provider
      value={{
        assignedCafeId,
        setAssignedCafeId,
        bookings,
        sessions,
        fnbOrders,
        incidents,
        maintenanceLogs,
        byocRegistry,
        customerPackages,
        resetDemoData,
        createWalkInBooking,
        refreshData: fetchData,
        startCheckIn,
        submitInspection,
        proposeExtension,
        addFnbOrder,
        updateFnbOrderStatus,
        swapSessionVehicle,
        fleetStates,
        updateFleetVehicleStatus,
        logIncident,
        resolveIncident,
        logMaintenance,
        updateMaintenanceStatus,
        registerByoc,
        updateByocSafety,
        headerProps,
        setHeaderProps,
      }}
    >
      {children}
    </StaffOperationContext.Provider>
  )
}
