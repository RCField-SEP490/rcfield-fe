import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { useAuthStore } from "@/features/auth/stores/auth.store"
import {
  type CustomerBookingDetail,
  type MockSessionDetail,
  type MockInspection,
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
    playMode: "RENTAL" | "BYOC" | "MIXED"
    trackName: string
    trackType: string
    slotStart: string
    slotEnd: string
    slotCount: number
    slotFee: number
    rentalFee: number
    totalAmount: number
    plannedParticipants: string[]
    plannedVehicles: string[]
    selectedVehicles: { vehicleId: string; name: string; imageUrl?: string }[]
  }) => boolean
  startCheckIn: (bookingId: string) => void
  submitInspection: (
    sessionId: string,
    type: "CHECK_IN" | "CHECK_OUT",
    photos: InspectionPhoto[],
    checklist: ChecklistItem[],
    staffNotes: string,
    damageFlagged: boolean,
    damageDetails?: { description: string; estimatedCost: number; damageMultiplier: number; finalCharge: number },
    swappedVehiclesState?: { vehicleId: string; status: keyof typeof VehicleStatus }[]
  ) => void
  proposeExtension: (sessionId: string, extraMinutes: number, additionalFee: number) => void
  simulateClientExtensionResponse: (sessionId: string, approved: boolean) => void
  simulateClientCheckInResponse: (sessionId: string) => void
  simulateClientCheckOutResponse: (sessionId: string) => void
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

  // Sync state with localStorage
  useEffect(() => {
    const storedBookings = localStorage.getItem(bookingsKey)
    const storedFnb = localStorage.getItem(fnbOrdersKey)
    const storedFleet = localStorage.getItem(fleetKey)
    const storedIncidents = localStorage.getItem(incidentsKey)
    const storedMaintenance = localStorage.getItem(maintenanceKey)
    const storedByoc = localStorage.getItem(byocKey)

    if (storedBookings) {
      setBookings(JSON.parse(storedBookings))
    } else {
      setBookings(initialMockBookings)
      localStorage.setItem(bookingsKey, JSON.stringify(initialMockBookings))
    }

    if (storedFnb) {
      setFnbOrders(JSON.parse(storedFnb))
    } else {
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
    }

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
      setMaintenanceLogs(JSON.parse(storedMaintenance))
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
  }, [userId, bookingsKey, fnbOrdersKey, fleetKey, incidentsKey, maintenanceKey, byocKey])

  const setAssignedCafeId = useCallback((_cafeId: string | null) => {
    // No-op - derived directly from auth store profile
  }, [])

  const saveBookings = useCallback((newBookings: CustomerBookingDetail[]) => {
    setBookings(newBookings)
    localStorage.setItem(bookingsKey, JSON.stringify(newBookings))
  }, [bookingsKey])

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

    toast.success("Đã hoàn tác dữ liệu mô phỏng về mặc định thành công.")
  }, [bookingsKey, fnbOrdersKey, fleetKey, incidentsKey, maintenanceKey, byocKey])

  const createWalkInBooking = useCallback((data: {
    playMode: "RENTAL" | "BYOC" | "MIXED"
    trackName: string
    trackType: string
    slotStart: string
    slotEnd: string
    slotCount: number
    slotFee: number
    rentalFee: number
    totalAmount: number
    plannedParticipants: string[]
    plannedVehicles: string[]
    selectedVehicles: { vehicleId: string; name: string; imageUrl?: string }[]
  }) => {
    const activeAtSameTime = bookings.filter(
      (b) =>
        b.status === "CONFIRMED" &&
        b.trackName === data.trackName &&
        new Date(b.slotStart) < new Date(data.slotEnd) &&
        new Date(b.slotEnd) > new Date(data.slotStart)
    )

    if (activeAtSameTime.length >= 2) {
      toast.error(`Đường đua ${data.trackName} đã đạt giới hạn công suất cho khung giờ này!`)
      return false
    }

    if (data.playMode !== "BYOC") {
      const busyVehicles = data.selectedVehicles.some(v => fleetStates[v.vehicleId] === "IN_USE" || fleetStates[v.vehicleId] === "MAINTENANCE")
      if (busyVehicles) {
        toast.error("Một số xe được chọn hiện đang bận hoặc đang bảo trì!")
        return false
      }
    }

    const bookingId = `BK-${Math.floor(1000 + Math.random() * 9000)}`
    const shortCode = `RCF-${Math.floor(1000 + Math.random() * 9000)}`

    const newBooking: CustomerBookingDetail = {
      bookingId,
      shortCode,
      cafeId: assignedCafeId || "cafe-drift-town",
      cafeName: "Chi nhánh đang chọn",
      cafeAddress: "Địa chỉ chi nhánh",
      cafePhone: "0900000000",
      trackName: data.trackName,
      trackType: data.trackType,
      bookingMode: "SINGLE",
      playMode: data.playMode,
      status: "CONFIRMED",
      slotStart: data.slotStart,
      slotEnd: data.slotEnd,
      slotCount: data.slotCount,
      depositAmount: data.playMode === "RENTAL" ? 150000 : 0,
      slotFee: data.slotFee,
      rentalFee: data.rentalFee,
      fnbPreorderFee: 0,
      discountAmount: 0,
      totalAmount: data.totalAmount,
      paymentStatus: "PAID",
      plannedParticipants: data.plannedParticipants,
      plannedVehicles: data.plannedVehicles,
      sessions: [],
    }

    const updatedFleet = { ...fleetStates }
    data.selectedVehicles.forEach((v) => {
      updatedFleet[v.vehicleId] = "AVAILABLE"
    })
    saveFleetStates(updatedFleet)
    saveBookings([newBooking, ...bookings])
    toast.success(`Tạo đơn đặt lịch trực tiếp ${shortCode} thành công!`)
    return true
  }, [bookings, fleetStates, assignedCafeId, saveBookings, saveFleetStates])

  const startCheckIn = useCallback((bookingId: string) => {
    const updatedBookings = bookings.map((b) => {
      if (b.bookingId === bookingId) {
        if (b.status !== "CONFIRMED") {
          toast.error("Chỉ có thể Check-In đơn đặt lịch có trạng thái CONFIRMED!")
          return b
        }

        const sessionId = `SS-${Math.floor(1000 + Math.random() * 9000)}`
        const vehiclesList = b.plannedVehicles.map((pvName, index) => {
          const matchedVehId = index === 0 ? "V-MAZDA-RX7" : `V-WALKIN-${index}-${Math.floor(Math.random() * 100)}`
          return {
            vehicleId: matchedVehId,
            name: pvName,
            type: b.playMode === "BYOC" ? ("BYOC" as const) : ("RENT" as const),
            imageUrl: "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&q=80&w=400"
          }
        })

        const newSession: MockSessionDetail = {
          sessionId,
          bookingId,
          status: "CHECKED_IN",
          staffName: user?.fullName || "Nhân viên trực ban",
          plannedEnd: b.slotEnd,
          participants: b.plannedParticipants.map((p) => ({ name: p, type: "PLAYER" })),
          vehicles: vehiclesList,
          inspections: [],
        }

        toast.success(`Đã khởi tạo quy trình Check-In cho session ${sessionId}. Cần làm kiểm xe.`)

        return {
          ...b,
          sessions: [...(b.sessions || []), newSession]
        }
      }
      return b
    })

    saveBookings(updatedBookings)
  }, [bookings, user, saveBookings])

  const submitInspection = useCallback((
    sessionId: string,
    type: "CHECK_IN" | "CHECK_OUT",
    photos: InspectionPhoto[],
    checklist: ChecklistItem[],
    staffNotes: string,
    damageFlagged: boolean,
    damageDetails?: { description: string; estimatedCost: number; damageMultiplier: number; finalCharge: number }
  ) => {
    const updatedBookings = bookings.map((b) => {
      const targetSessionIdx = b.sessions?.findIndex((s) => s.sessionId === sessionId)
      if (targetSessionIdx !== undefined && targetSessionIdx !== -1) {
        const session = b.sessions[targetSessionIdx]
        const inspectionId = `INS-${type}-${Math.floor(1000 + Math.random() * 9000)}`

        const newInspection: MockInspection = {
          inspectionId,
          type,
          photos,
          checklist,
          staffNotes,
          customerConfirmed: false,
          damageFlagged,
          damageDescription: damageDetails?.description,
          estimatedCost: damageDetails?.estimatedCost,
        }

        const updatedInspections = [...(session.inspections || []), newInspection]
        let updatedStatus = session.status
        let updatedDamageClaim = session.damageClaim

        if (type === "CHECK_IN") {
          toast.success(`Gửi báo cáo Check-In kiểm xe thành công. Đang chờ khách hàng xác nhận.`)
        } else {
          updatedStatus = "CHECKING_OUT"
          if (damageFlagged && damageDetails) {
            updatedDamageClaim = {
              claimId: `CLM-${Math.floor(1000 + Math.random() * 9000)}`,
              description: damageDetails.description,
              estimatedCost: damageDetails.estimatedCost,
              damageMultiplier: damageDetails.damageMultiplier,
              finalCharge: damageDetails.finalCharge,
              checkInPhoto: session.inspections.find(i => i.type === "CHECK_IN")?.photos[0]?.url || "",
              checkOutPhoto: photos[0]?.url || "",
              status: "PENDING",
              expiresAt: new Date(Date.now() + 24 * 3600000).toISOString(),
            }
            toast.warning(`Đã phát hiện hư hại xe! Đã lập hóa đơn phạt đền bù và gửi xác nhận cho khách hàng.`)
          } else {
            toast.success(`Hoàn tất kiểm xe Check-Out. Đang chờ khách xác nhận đóng phiên chạy.`)
          }
        }

        const updatedSession = {
          ...session,
          status: updatedStatus,
          inspections: updatedInspections,
          damageClaim: updatedDamageClaim,
        }

        const updatedSessions = [...b.sessions]
        updatedSessions[targetSessionIdx] = updatedSession

        return {
          ...b,
          sessions: updatedSessions,
        }
      }
      return b
    })

    saveBookings(updatedBookings)
  }, [bookings, saveBookings])

  const simulateClientCheckInResponse = useCallback((sessionId: string) => {
    let updatedFleet = { ...fleetStates }
    const updatedBookings = bookings.map((b) => {
      const idx = b.sessions?.findIndex((s) => s.sessionId === sessionId)
      if (idx !== undefined && idx !== -1) {
        const session = b.sessions[idx]
        const updatedInspections = session.inspections.map((insp) => {
          if (insp.type === "CHECK_IN" && !insp.customerConfirmed) {
            return { ...insp, customerConfirmed: true, customerConfirmedAt: new Date().toISOString() }
          }
          return insp
        })

        const updatedSession: MockSessionDetail = {
          ...session,
          status: "ACTIVE",
          actualStart: new Date().toISOString(),
          inspections: updatedInspections,
        }

        session.vehicles.forEach((v) => {
          updatedFleet[v.vehicleId] = "IN_USE"
        })

        toast.success(`Khách hàng đã đồng ý biên bản bàn giao xe. Bắt đầu ca chạy!`)

        const updatedSessions = [...b.sessions]
        updatedSessions[idx] = updatedSession
        return { ...b, sessions: updatedSessions }
      }
      return b
    })

    saveFleetStates(updatedFleet)
    saveBookings(updatedBookings)
  }, [bookings, fleetStates, saveBookings, saveFleetStates])

  const simulateClientCheckOutResponse = useCallback((sessionId: string) => {
    let updatedFleet = { ...fleetStates }
    const updatedBookings = bookings.map((b) => {
      const idx = b.sessions?.findIndex((s) => s.sessionId === sessionId)
      if (idx !== undefined && idx !== -1) {
        const session = b.sessions[idx]
        const updatedInspections = session.inspections.map((insp) => {
          if (insp.type === "CHECK_OUT" && !insp.customerConfirmed) {
            return { ...insp, customerConfirmed: true, customerConfirmedAt: new Date().toISOString() }
          }
          return insp
        })

        const updatedDamageClaim = session.damageClaim
          ? ({ ...session.damageClaim, status: "CONFIRMED" as const } as const)
          : undefined

        const updatedSession: MockSessionDetail = {
          ...session,
          status: "COMPLETED",
          actualEnd: new Date().toISOString(),
          inspections: updatedInspections,
          damageClaim: updatedDamageClaim,
        }

        session.vehicles.forEach((v) => {
          if (session.damageClaim) {
            updatedFleet[v.vehicleId] = "MAINTENANCE"
          } else {
            updatedFleet[v.vehicleId] = "AVAILABLE"
          }
        })

        toast.success(`Khách hàng đã xác nhận thanh toán & biên bản Check-Out. Phiên chạy hoàn thành!`)

        const updatedSessions = [...b.sessions]
        updatedSessions[idx] = updatedSession

        const allCompleted = updatedSessions.every((s) => s.status === "COMPLETED")
        const newBookingStatus = allCompleted ? ("COMPLETED" as const) : b.status

        return { ...b, status: newBookingStatus, sessions: updatedSessions }
      }
      return b
    })

    saveFleetStates(updatedFleet)
    saveBookings(updatedBookings)
  }, [bookings, fleetStates, saveBookings, saveFleetStates])

  const proposeExtension = useCallback((sessionId: string, extraMinutes: number, additionalFee: number) => {
    const updatedBookings = bookings.map((b) => {
      const idx = b.sessions?.findIndex((s) => s.sessionId === sessionId)
      if (idx !== undefined && idx !== -1) {
        const session = b.sessions[idx]
        if (session.status !== "ACTIVE") {
          toast.error("Chỉ đề xuất gia hạn khi phiên đang ACTIVE!")
          return b
        }

        const proposalId = `PRP-${Math.floor(1000 + Math.random() * 9000)}`
        const newPlannedEnd = new Date(new Date(session.plannedEnd).getTime() + extraMinutes * 60000).toISOString()

        const extensionProposal = {
          proposalId,
          extraMinutes,
          additionalFee,
          newPlannedEnd,
          expiresAt: new Date(Date.now() + 10 * 60000).toISOString(),
          status: "PENDING" as const,
        }

        toast.success(`Đã gửi yêu cầu gia hạn thêm ${extraMinutes} phút đến khách hàng.`)

        const updatedSession = {
          ...session,
          status: "EXTENDING" as const,
          extensionProposal,
        }

        const updatedSessions = [...b.sessions]
        updatedSessions[idx] = updatedSession
        return { ...b, sessions: updatedSessions }
      }
      return b
    })

    saveBookings(updatedBookings)
  }, [bookings, saveBookings])

  const simulateClientExtensionResponse = useCallback((sessionId: string, approved: boolean) => {
    const updatedBookings = bookings.map((b) => {
      const idx = b.sessions?.findIndex((s) => s.sessionId === sessionId)
      if (idx !== undefined && idx !== -1) {
        const session = b.sessions[idx]
        const prop = session.extensionProposal

        if (!prop || prop.status !== "PENDING") return b

        let updatedSession = { ...session }

        if (approved) {
          updatedSession = {
            ...session,
            status: "ACTIVE" as const,
            plannedEnd: prop.newPlannedEnd,
            extensionProposal: {
              ...prop,
              status: "APPROVED" as const,
            },
          }
          b.totalAmount += prop.additionalFee
          b.slotCount += Math.ceil(prop.extraMinutes / 30)
          toast.success(`Khách hàng ĐỒNG Ý gia hạn! Phiên chạy kéo dài đến ${new Date(prop.newPlannedEnd).toLocaleTimeString()}.`)
        } else {
          updatedSession = {
            ...session,
            status: "ACTIVE" as const,
            extensionProposal: {
              ...prop,
              status: "REJECTED" as const,
            },
          }
          toast.error(`Khách hàng TỪ CHỐI gia hạn ca chơi.`)
        }

        const updatedSessions = [...b.sessions]
        updatedSessions[idx] = updatedSession
        return { ...b, sessions: updatedSessions }
      }
      return b
    })

    saveBookings(updatedBookings)
  }, [bookings, saveBookings])

  const addFnbOrder = useCallback((sessionId: string, items: { name: string; qty: number; price: number }[]) => {
    const orderId = `FNB-${Math.floor(1000 + Math.random() * 9000)}`
    const total = items.reduce((sum, item) => sum + item.qty * item.price, 0)

    let trackName = "Đường đua"
    const updatedBookings = bookings.map((b) => {
      const idx = b.sessions?.findIndex((s) => s.sessionId === sessionId)
      if (idx !== undefined && idx !== -1) {
        trackName = b.trackName
        const session = b.sessions[idx]
        const newOrder = {
          orderId,
          items,
          total,
        }

        const updatedFnb = [...(session.fnbOrders || []), newOrder]
        const updatedSession = {
          ...session,
          fnbOrders: updatedFnb,
        }

        const updatedSessions = [...b.sessions]
        updatedSessions[idx] = updatedSession
        b.totalAmount += total

        return { ...b, sessions: updatedSessions }
      }
      return b
    })

    const newGlobalOrder: FnbOrder = {
      orderId,
      sessionId,
      tableName: trackName,
      items,
      total,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    }

    saveFnbOrders([newGlobalOrder, ...fnbOrders])
    saveBookings(updatedBookings)
    toast.success(`Đã thêm món F&B thành công cho phiên chạy!`)
  }, [bookings, fnbOrders, saveBookings, saveFnbOrders])

  const updateFnbOrderStatus = useCallback((orderId: string, status: FnbOrder["status"]) => {
    const updatedOrders = fnbOrders.map((o) => {
      if (o.orderId === orderId) {
        return { ...o, status }
      }
      return o
    })
    saveFnbOrders(updatedOrders)

    if (status === "PREPARING") {
      toast.info(`Đơn gọi món ${orderId} đang được chế biến...`)
    } else if (status === "DELIVERED") {
      toast.success(`Đơn gọi món ${orderId} đã phục vụ!`)
    } else if (status === "CANCELLED") {
      toast.warning(`Đã hủy đơn gọi món ${orderId}`)
    }
  }, [fnbOrders, saveFnbOrders])

  const swapSessionVehicle = useCallback((
    sessionId: string,
    oldVehicleId: string,
    newVehicleId: string,
    oldVehicleNewStatus: keyof typeof VehicleStatus,
    newVehicleData: { name: string; imageUrl?: string }
  ) => {
    let oldVehicleName = ""
    const updatedBookings = bookings.map((b) => {
      const idx = b.sessions?.findIndex((s) => s.sessionId === sessionId)
      if (idx !== undefined && idx !== -1) {
        const session = b.sessions[idx]
        const updatedVehicles = session.vehicles.map((v) => {
          if (v.vehicleId === oldVehicleId) {
            oldVehicleName = v.name
            return {
              vehicleId: newVehicleId,
              name: newVehicleData.name,
              type: "RENT" as const,
              imageUrl: newVehicleData.imageUrl,
            }
          }
          return v
        })

        const updatedSession = {
          ...session,
          vehicles: updatedVehicles,
        }

        const updatedSessions = [...b.sessions]
        updatedSessions[idx] = updatedSession
        return { ...b, sessions: updatedSessions }
      }
      return b
    })

    saveBookings(updatedBookings)

    const updatedFleet = {
      ...fleetStates,
      [oldVehicleId]: oldVehicleNewStatus,
      [newVehicleId]: "IN_USE" as const,
    }
    saveFleetStates(updatedFleet)

    toast.success(`Đã đổi xe thành công từ ${oldVehicleName} sang ${newVehicleData.name}`)
  }, [bookings, fleetStates, saveBookings, saveFleetStates])

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
    toast.success(`Đã đăng ký và kiểm định an toàn xe tự mang (BYOC) ${newByoc.id}!`)
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
        startCheckIn,
        submitInspection,
        proposeExtension,
        simulateClientExtensionResponse,
        simulateClientCheckInResponse,
        simulateClientCheckOutResponse,
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
      }}
    >
      {children}
    </StaffOperationContext.Provider>
  )
}
