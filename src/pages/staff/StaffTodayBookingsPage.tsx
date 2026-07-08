/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
import React, { useState, useEffect, useMemo } from "react"
import { useSearchParams, Link, useNavigate } from "react-router"
import { useQuery } from "@tanstack/react-query"
import {
  Search as SearchIcon,
  Car,
  Plus,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Tag,
  Loader2,
  Clock,
  Phone,
  Users,
  MapPin,
  UtensilsCrossed,
  QrCode,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react"
import { formatCurrency } from "@/shared/lib/format"
import { useStaffOperations } from "./context/StaffOperationContext"
import { cafeApi } from "@/features/cafes/api/cafe.api"
import { vehicleApi } from "@/features/vehicles/api/vehicle.api"
import { staffApi, staffQueryKeys } from "@/features/staff/api/staff.api"
import { bookingApi, bookingQueryKeys } from "@/features/booking/api/booking.api"
import type { BackendCafe } from "@/features/cafes/types"
import type { VehicleUnit } from "@/features/vehicles/types"
import { toast } from "sonner"
import { cn } from "@/shared/lib/utils"
import {
  StaffHeader,
  StaffCard,
  StaffBadge,
  StaffButton,
} from "./components/StaffUI"
import { QrCheckinUploader } from "@/features/staff/components/QrCheckinUploader"
import type { CustomerBookingDetail } from "@/shared/data/customer-operational-mock-data"
import { useDailyAvailability } from "@/features/booking/hooks/use-booking"
import { useTrackConfigs } from "@/features/cafes/hooks/useTrackConfigs"
import { buildDailySlots, DailySlotGrid, type DailySlot, type DailySlotStatus } from "@/pages/customer/cafe-detail/components/DailySlotGrid"
import type { HourlySlotAvailability } from "@/features/booking/hooks/use-booking"

type TabType = "LIST" | "WALKIN"

function getSlotCountdown(startTime: string): { label: string; urgent: boolean } | null {
  const diffMs = new Date(startTime).getTime() - Date.now()
  if (diffMs <= 0) return null // already started or past

  const totalMinutes = Math.floor(diffMs / 60000)
  if (totalMinutes >= 24 * 60) return null // more than 24h away, skip

  if (totalMinutes < 60) {
    return { label: `còn ${totalMinutes} phút`, urgent: totalMinutes <= 30 }
  }
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  const label = mins > 0 ? `còn ${hours}g ${mins}p` : `còn ${hours} tiếng`
  return { label, urgent: false }
}

function getBookingId(booking: any): string {
  return booking.bookingId ?? booking.id
}

function getCustomerName(booking: any): string {
  return booking.customerName ?? booking.plannedParticipants?.[0] ?? "Khách hàng"
}

function getCustomerPhone(booking: any): string | null {
  return booking.customerPhone ?? null
}

function getSlotStart(booking: any): string {
  return booking.startTime ?? booking.slotStart
}

function getSlotEnd(booking: any): string {
  return booking.endTime ?? booking.slotEnd
}

function getPlayMode(booking: any): string {
  return booking.mode ?? booking.playMode
}

function getTrackLabel(booking: any): string | null {
  return booking.trackTypeName ?? booking.trackName ?? booking.trackType ?? null
}

function getParticipantCount(booking: any): number {
  return booking.participantCount ?? booking.plannedParticipants?.length ?? 0
}

function getVehicleCount(booking: any): number {
  return booking.vehicleCount ?? booking.plannedVehicles?.length ?? 0
}

function getFnbAmount(booking: any): number {
  return Number(booking.fnbPreorderAmount ?? booking.fnbPreorderFee ?? 0)
}

export default function StaffTodayBookingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { assignedCafeId, createWalkInBooking, startCheckIn, fleetStates } = useStaffOperations()
  const [nowTime] = useState(() => Date.now())

  const { data: displayBookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: staffQueryKeys.todayBookings(),
    queryFn: staffApi.getTodayBookings,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  })

  // Primary navigation tab
  const [activeTab, setActiveTab] = useState<TabType>("LIST")

  // QR check-in panel state
  const [showQrPanel, setShowQrPanel] = useState(false)
  const [qrBookingId, setQrBookingId] = useState("")
  const [qrInputValue, setQrInputValue] = useState("")

  const {
    data: qrBookingData,
    isLoading: qrBookingLoading,
    isError: qrBookingError,
  } = useQuery({
    queryKey: bookingQueryKeys.detail(qrBookingId),
    queryFn: () => bookingApi.getBooking(qrBookingId),
    enabled: !!qrBookingId,
    retry: false,
  })

  // List states
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")

  const getTodayString = () => {
    const d = new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const date = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${date}`
  }



  // Walk-in form states
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [playMode, setPlayMode] = useState<"RENTAL" | "BYOC">("RENTAL")
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "BANK_TRANSFER">("CASH")
  const [selectedTrackCode, setSelectedTrackCode] = useState("")
  const [selectedTrackName, setSelectedTrackName] = useState("")
  const [selectedSlot, setSelectedSlot] = useState("")
  const [selectedSlotEnd, setSelectedSlotEnd] = useState<string | null>(null)
  const [selectedVehicles, setSelectedVehicles] = useState<VehicleUnit[]>([])
  const bookingDate = getTodayString()

  // Branch data
  const [cafeDetails, setCafeDetails] = useState<BackendCafe | null>(null)
  const [availableVehicles, setAvailableVehicles] = useState<VehicleUnit[]>([])
  const [loadingVehicles, setLoadingVehicles] = useState(false)

  // Sync tab with URL query parameter
  useEffect(() => {
    const tabParam = searchParams.get("tab")
    if (tabParam === "walkin") {
      setActiveTab("WALKIN")
    } else {
      setActiveTab("LIST")
    }
  }, [searchParams])

  // Get URL pre-selection data for track from dashboard
  useEffect(() => {
    if (activeTab === "WALKIN" && cafeDetails) {
      const trackNameUrl = searchParams.get("track")
      const trackTypeUrl = searchParams.get("type")
      if (trackNameUrl && trackTypeUrl) {
        setSelectedTrackName(trackNameUrl)
        setSelectedTrackCode(trackTypeUrl)
      } else if (cafeDetails.trackTypes && cafeDetails.trackTypes.length > 0) {
        setSelectedTrackName(cafeDetails.trackTypes[0].name)
        setSelectedTrackCode(cafeDetails.trackTypes[0].code)
      }
    }
  }, [activeTab, cafeDetails, searchParams])

  // Fetch Cafe Details & available Vehicles
  useEffect(() => {
    if (assignedCafeId) {
      cafeApi
        .getCafe(assignedCafeId)
        .then((data) => setCafeDetails(data))
        .catch((err) => console.error("Error loading cafe details:", err))

      setLoadingVehicles(true)
      vehicleApi
        .listUnits(assignedCafeId)
        .then((units) => {
          setAvailableVehicles(units)
        })
        .catch((err) => console.error("Error loading fleet units:", err))
        .finally(() => setLoadingVehicles(false))
    }
  }, [assignedCafeId])

  // Reset Walk-in form
  const resetWalkinForm = () => {
    setCustomerName("")
    setCustomerPhone("")
    setPlayMode("RENTAL")
    setPaymentMethod("CASH")
    setSelectedVehicles([])
    setSelectedSlot("")
    setSelectedSlotEnd(null)
    setSearchParams({})
  }

  // Load track configs and daily availability
  const { data: trackConfigs = [] } = useTrackConfigs(assignedCafeId ?? "")
  
  const selectedTrackConfig = useMemo(() => {
    return trackConfigs.find((c) => c.track_type?.code === selectedTrackCode) || null
  }, [trackConfigs, selectedTrackCode])

  const { openHour, closeHour } = useMemo(() => {
    const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const
    const dayKey = DAY_KEYS[new Date().getDay()]
    const hours = (cafeDetails?.operatingHours as Record<string, { open?: string; close?: string }> | undefined)?.[dayKey]
    const parseHour = (t?: string) => (t ? parseInt(t.split(":")[0], 10) : undefined)
    return {
      openHour: parseHour(hours?.open) ?? 8,
      closeHour: parseHour(hours?.close) ?? 22,
    }
  }, [cafeDetails])

  const { data: dailyAvailability, isLoading: isLoadingAvailability } = useDailyAvailability(
    assignedCafeId ?? "",
    bookingDate,
    openHour,
    closeHour,
    selectedTrackConfig?.id || undefined,
  )

  const slots = useMemo<DailySlot[]>(() => {
    if (!dailyAvailability) return buildDailySlots(openHour, closeHour)
    return buildSlotsFromAvailability(dailyAvailability, playMode)
  }, [dailyAvailability, openHour, closeHour, playMode])

  const calculateDurationFromSlots = (start: string, end: string | null): number => {
    if (!start) return 60
    const [startH, startM] = start.split(":").map(Number)
    const slotDuration = cafeDetails?.slotDurationMinutes || 30
    if (!end) return slotDuration
    const [endH, endM] = end.split(":").map(Number)
    const startTotal = startH * 60 + startM
    const endTotal = endH * 60 + endM
    return Math.max(slotDuration, endTotal - startTotal)
  }

  // Calculate pricing values
  const slotFeeRate = cafeDetails ? Number(cafeDetails.slotFeeRate) || 80000 : 80000
  const slotDuration = cafeDetails?.slotDurationMinutes || 30
  const computedDuration = calculateDurationFromSlots(selectedSlot, selectedSlotEnd)
  const slotCount = Math.ceil(computedDuration / slotDuration)
  const slotFeeTotal = slotCount * slotFeeRate

  // Calculate rental fees
  const rentalFeeTotal = selectedVehicles.reduce((total, unit) => {
    const hourly = unit.catalog?.hourlyRate || 75000
    return total + hourly * (computedDuration / 60)
  }, 0)

  const totalAmount = slotFeeTotal + rentalFeeTotal

  // Submit Walk-in Form
  const handleWalkinSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!customerName.trim()) {
      toast.error("Vui lòng nhập tên khách hàng!")
      return
    }

    if (!customerPhone.trim()) {
      toast.error("Vui lòng nhập số điện thoại khách hàng!")
      return
    }

    if (!/^[0-9]{10}$/.test(customerPhone.trim())) {
      toast.error("Số điện thoại không hợp lệ (phải gồm 10 chữ số)!")
      return
    }

    if (!selectedSlot) {
      toast.error("Vui lòng chọn slot giờ chơi trên lịch!")
      return
    }

    if (playMode !== "BYOC" && selectedVehicles.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 xe thuê để tiếp tục!")
      return
    }

    const startDateTime = new Date(`${bookingDate}T${selectedSlot}:00`)
    if (isNaN(startDateTime.getTime())) {
      toast.error("Thời gian bắt đầu không hợp lệ!")
      return
    }
    const slotStart = startDateTime.toISOString()
    const slotEnd = new Date(startDateTime.getTime() + computedDuration * 60000).toISOString()

    const matchedTrack = cafeDetails?.trackTypes.find((t) => t.code === selectedTrackCode)
    if (!matchedTrack) {
      toast.error("Không tìm thấy thông tin cấu hình đường đua!")
      return
    }

    createWalkInBooking({
      playMode,
      trackTypeId: matchedTrack.id,
      slotStart,
      slotEnd,
      paymentMethod,
      vehicleIds: selectedVehicles.map((v) => v.id),
      participants: [
        {
          guest_name: customerName.trim(),
          guest_phone: customerPhone.trim(),
          participant_type: "WALK_IN_GUEST",
        },
      ],
    }).then((success) => {
      if (success) {
        resetWalkinForm()
        setActiveTab("LIST")
        setSearchParams({})
      }
    })
  }

  // Toggle vehicle selection for Walk-in
  const toggleVehicle = (unit: VehicleUnit) => {
    const isSelected = selectedVehicles.some((v) => v.id === unit.id)
    if (isSelected) {
      setSelectedVehicles(selectedVehicles.filter((v) => v.id !== unit.id))
    } else {
      setSelectedVehicles([...selectedVehicles, unit])
    }
  }

  const handleStartCheckIn = async (booking: CustomerBookingDetail | any) => {
    const startedSession = await startCheckIn(getBookingId(booking))
    const sessionId = startedSession?.sessionId ?? startedSession?.id
    if (sessionId) {
      navigate(`/staff/sessions/${sessionId}`)
    }
  }

  const getStatusSortPriority = (booking: any): number => {
    const session = booking.sessions?.find((s: any) =>
      ["ACTIVE", "EXTENDING", "CHECKING_OUT", "CHECKED_IN"].includes(s.status)
    )
    if (session?.status === "ACTIVE" || session?.status === "EXTENDING") return 0
    if (session?.status === "CHECKING_OUT" || session?.status === "CHECKED_IN") return 1
    if (booking.status === "CONFIRMED") return 2
    if (booking.status === "PENDING") return 3
    const hasPending = booking.payment_components?.some((c: any) => c.status === "PENDING")
    if (booking.status === "COMPLETED" && hasPending) return 4
    if (booking.status === "COMPLETED") return 5
    return 6 // CANCELLED, NO_SHOW
  }

  const visibleBookings = displayBookings
    .filter((booking: any) => {
      const matchSearch = searchTerm === "" || getCustomerName(booking).toLowerCase().includes(searchTerm.toLowerCase())
      const matchStatus = statusFilter === "ALL" || booking.status === statusFilter
      return matchSearch && matchStatus
    })
    .sort((a: any, b: any) => {
      const priorityDiff = getStatusSortPriority(a) - getStatusSortPriority(b)
      if (priorityDiff !== 0) return priorityDiff
      return new Date(getSlotStart(a)).getTime() - new Date(getSlotStart(b)).getTime()
    })

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <StaffHeader
        title={activeTab === "LIST" ? "Đặt Lịch Trong Ngày" : "Đăng Ký Khách Walk-In"}
        subtitle={activeTab === "LIST" ? "Quản lý check-in, giám sát tiến độ hoạt động các lượt đua trong ca trực" : "Thiết lập nhanh ca đua trực tiếp cho khách hàng vãng lai thanh toán tại quầy"}
      />

      {/* 2. Custom Styled Tabs */}
      <div className="flex border-b border-[#e5e2e1] gap-2">
        <button
          onClick={() => {
            setActiveTab("LIST")
            setSearchParams({})
          }}
          className={cn(
            "pb-3 text-sm font-bold px-4 transition-all border-b-2",
            activeTab === "LIST"
              ? "border-[#ea580c] text-[#ea580c]"
              : "border-transparent text-[#6b7280] hover:text-[#1c1b1b]"
          )}
        >
          Lịch đặt hôm nay
        </button>
        <button
          onClick={() => {
            setActiveTab("WALKIN")
            setSearchParams({ tab: "walkin" })
          }}
          className={cn(
            "pb-3 text-sm font-bold px-4 transition-all border-b-2 flex items-center gap-1.5",
            activeTab === "WALKIN"
              ? "border-[#ea580c] text-[#ea580c]"
              : "border-transparent text-[#6b7280] hover:text-[#1c1b1b]"
          )}
        >
          <Plus className="size-4" />
          Tạo đơn trực tiếp (Walk-In)
        </button>
      </div>

      {/* 3. TODAY BOOKINGS LIST VIEW */}
      {activeTab === "LIST" && (
        <div className="space-y-4">
          {/* SEARCH & FILTERS BAR */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3.5 top-3.5 size-4 text-[#a09e9d]" />
              <input
                type="text"
                placeholder="Tìm tên khách hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-[#e5e2e1] bg-white pl-10 pr-4 py-2.5 text-sm font-semibold placeholder-[#a09e9d] text-[#1c1b1b] focus:outline-none focus:ring-1 focus:ring-[#ea580c] focus:border-[#ea580c]"
              />
            </div>

            {/* Filter tags list */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {[
                { code: "ALL", label: "Tất cả" },
                { code: "PENDING", label: "Chờ thanh toán" },
                { code: "CONFIRMED", label: "Đã xác nhận" },
                { code: "NO_SHOW", label: "Không đến" },
                { code: "COMPLETED", label: "Hoàn thành" },
                { code: "CANCELLED", label: "Đã hủy" },
              ].map((filter) => (
                <button
                  key={filter.code}
                  onClick={() => setStatusFilter(filter.code)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs font-bold transition-all border shrink-0",
                    statusFilter === filter.code
                      ? "bg-[#ea580c] text-white border-[#ea580c] shadow-sm"
                      : "bg-white text-[#6b7280] border-[#e5e2e1] hover:bg-[#fcf8f8] hover:text-[#1c1b1b]"
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* QR CHECK-IN PANEL */}
          <StaffCard className="overflow-hidden">
            <button
              onClick={() => {
                setShowQrPanel((v) => !v)
                if (showQrPanel) {
                  setQrBookingId("")
                  setQrInputValue("")
                }
              }}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-[#1c1b1b] hover:bg-[#fcf8f8] transition-colors"
            >
              <span className="flex items-center gap-2">
                <QrCode className="size-4 text-[#ea580c]" />
                Quét mã QR check-in
              </span>
              {showQrPanel ? <ChevronUp className="size-4 text-[#a09e9d]" /> : <ChevronDown className="size-4 text-[#a09e9d]" />}
            </button>

            {showQrPanel && (
              <div className="px-4 pb-4 space-y-4 border-t border-[#f0eeee] pt-4">
                <QrCheckinUploader onDecoded={(id) => { setQrBookingId(id); setQrInputValue(id) }} />

                <div className="relative flex items-center">
                  <div className="flex-grow border-t border-[#e5e2e1]" />
                  <span className="mx-3 text-xs font-bold text-[#a09e9d] bg-white px-1">hoặc</span>
                  <div className="flex-grow border-t border-[#e5e2e1]" />
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nhập booking ID thủ công..."
                    value={qrInputValue}
                    onChange={(e) => setQrInputValue(e.target.value)}
                    className="flex-1 rounded-lg border border-[#e5e2e1] bg-white px-3.5 py-2 text-sm font-semibold text-[#1c1b1b] focus:border-[#ea580c] focus:outline-none focus:ring-1 focus:ring-[#ea580c]"
                  />
                  <button
                    onClick={() => setQrBookingId(qrInputValue.trim())}
                    disabled={!qrInputValue.trim()}
                    className="rounded-lg bg-[#ea580c] text-white text-sm font-bold px-4 py-2 hover:bg-[#c2410c] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Tìm
                  </button>
                  {qrBookingId && (
                    <button
                      onClick={() => { setQrBookingId(""); setQrInputValue("") }}
                      className="rounded-lg border border-[#e5e2e1] text-[#6b7280] px-3 py-2 hover:bg-[#fcf8f8] transition-colors"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>

                {qrBookingId && (
                  <div className="rounded-xl border border-[#e5e2e1] overflow-hidden">
                    {qrBookingLoading && (
                      <div className="flex items-center justify-center py-6 gap-2 text-sm text-[#6b7280]">
                        <Loader2 className="size-4 animate-spin" />
                        Đang tải thông tin booking...
                      </div>
                    )}
                    {qrBookingError && (
                      <div className="py-4 px-4 text-sm text-red-600 font-semibold">
                        Không tìm thấy booking. Kiểm tra lại mã QR hoặc ID.
                      </div>
                    )}
                    {qrBookingData && (
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-[#a09e9d]">
                            #{qrBookingData.id.slice(0, 8).toUpperCase()}
                          </span>
                          <StaffBadge variant={
                            qrBookingData.status === "CONFIRMED" ? "info"
                            : qrBookingData.status === "COMPLETED" ? "success"
                            : "neutral"
                          }>
                            {qrBookingData.status}
                          </StaffBadge>
                        </div>
                        <div className="text-xs space-y-1 text-[#4c4a49] font-semibold">
                          <p><span className="text-[#a09e9d]">Khách:</span> {qrBookingData.participants?.[0]?.resolvedName ?? "—"}</p>
                          <p>
                            <span className="text-[#a09e9d]">Giờ:</span>{" "}
                            {new Date(qrBookingData.slotStart).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                            {" – "}
                            {new Date(qrBookingData.slotEnd).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                          <p><span className="text-[#a09e9d]">Chế độ:</span> {qrBookingData.playMode === "RENTAL" ? "Thuê xe" : "BYOC"}</p>
                        </div>
                        {qrBookingData.status !== "CONFIRMED" && (
                          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">
                            {qrBookingData.status === "COMPLETED" ? "Booking này đã hoàn thành." :
                             qrBookingData.status === "CANCELLED" ? "Booking này đã bị hủy." :
                             qrBookingData.status === "NO_SHOW" ? "Booking này đã quá hạn (No Show)." :
                             qrBookingData.status === "PENDING" ? "Booking chưa thanh toán, không thể check-in." :
                             "Không thể check-in với trạng thái hiện tại."}
                          </div>
                        )}
                        {qrBookingData.status === "CONFIRMED" && qrBookingData.session && (
                          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-700">
                            Đã check-in lúc {qrBookingData.session.actualStartAt
                              ? new Date(qrBookingData.session.actualStartAt).toLocaleTimeString("vi-VN")
                              : "—"}.
                          </div>
                        )}
                        {qrBookingData.status === "CONFIRMED" && !qrBookingData.session && (
                          <StaffButton
                            onClick={() => handleStartCheckIn(qrBookingData)}
                            variant="primary"
                            className="w-full"
                          >
                            Xác nhận check-in
                            <ArrowRight className="size-3.5" />
                          </StaffButton>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </StaffCard>

          {/* BOOKINGS CARDS GRID */}
          {loadingBookings ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-[#a09e9d]" />
            </div>
          ) : (
            <div className="grid gap-4">
              {visibleBookings
                .map((b: any) => {
                  const bookingId = getBookingId(b)
                  const customerName = getCustomerName(b)
                  const customerPhone = getCustomerPhone(b)
                  const slotStart = getSlotStart(b)
                  const slotEnd = getSlotEnd(b)
                  const playMode = getPlayMode(b)
                  const trackLabel = getTrackLabel(b)
                  const participantCount = getParticipantCount(b)
                  const vehicleCount = getVehicleCount(b)
                  const fnbAmount = getFnbAmount(b)
                  const activeSession = !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(b.status)
                    ? b.sessions?.find((session: any) => ["ACTIVE", "CHECKED_IN", "EXTENDING", "CHECKING_OUT"].includes(session.status))
                    : undefined
                  const completedSession = b.status === "COMPLETED"
                    ? b.sessions?.find((session: any) => session.status === "COMPLETED")
                    : undefined
                  const sessionStatusLabel: Record<string, string> = {
                    CHECKED_IN: "ĐANG CHECK-IN",
                    ACTIVE: "ĐANG CHƠI",
                    EXTENDING: "GIA HẠN",
                    CHECKING_OUT: "ĐANG CHECKOUT",
                  }
                  const hasPendingSettlement = b.status === "COMPLETED" &&
                    (b as any).payment_components?.some((c: any) => c.status === "PENDING")
                  const bookingStatusLabel: Record<string, string> = {
                    PENDING: "CHỜ THANH TOÁN",
                    CONFIRMED: "ĐÃ XÁC NHẬN",
                    NO_SHOW: "KHÔNG ĐẾN",
                    COMPLETED: hasPendingSettlement ? "CHỜ QUYẾT TOÁN" : "HOÀN THÀNH",
                    CANCELLED: "ĐÃ HỦY",
                  }
                  const displayLabel = activeSession
                    ? (sessionStatusLabel[activeSession.status] ?? activeSession.status)
                    : (bookingStatusLabel[b.status] ?? b.status)
                  const badgeVariant =
                    activeSession?.status === "ACTIVE" || activeSession?.status === "EXTENDING" ? "success"
                    : activeSession?.status === "CHECKED_IN" || activeSession?.status === "CHECKING_OUT" ? "warning"
                    : b.status === "CONFIRMED" ? "info"
                    : b.status === "COMPLETED" && !hasPendingSettlement ? "success"
                    : b.status === "CANCELLED" || b.status === "NO_SHOW" ? "neutral"
                    : "warning"

                  const hasFnb = fnbAmount > 0
                  const countdown = activeSession ? null : getSlotCountdown(slotStart)
                  const remainingMs = activeSession ? new Date(slotEnd).getTime() - nowTime : null
                  const remainingMinutes = remainingMs !== null ? Math.ceil(remainingMs / 60000) : null

                  return (
                    <StaffCard key={bookingId} className="space-y-3">
                      {/* Row 1 — ID + status + remaining + detail link */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-[#a09e9d] font-mono font-bold">
                            #{bookingId.slice(0, 8).toUpperCase()}
                          </span>
                          <StaffBadge variant={badgeVariant}>{displayLabel}</StaffBadge>
                          {remainingMinutes !== null && remainingMinutes > 0 && (
                            <span className={cn(
                              "rounded-full px-2.5 py-0.5 text-[10px] font-bold border",
                              remainingMinutes <= 10
                                ? "bg-red-50 text-red-600 border-red-200"
                                : remainingMinutes <= 20
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            )}>
                              còn {remainingMinutes} phút
                            </span>
                          )}
                          {remainingMinutes !== null && remainingMinutes <= 0 && (
                            <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold border bg-red-100 text-red-700 border-red-300">
                              hết giờ
                            </span>
                          )}
                        </div>
                        <Link
                          to={`/booking/${bookingId}`}
                          className="flex items-center justify-center size-7 rounded-lg border border-[#e5e2e1] bg-white hover:bg-[#fcf8f8] text-[#6b7280] hover:text-[#1c1b1b] transition-colors shrink-0"
                        >
                          <ChevronRight className="size-3.5" />
                        </Link>
                      </div>

                      {/* Row 2 — Customer name + phone */}
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="text-base font-bold text-[#1c1b1b] leading-tight">{customerName}</h4>
                        {customerPhone && (
                          <a
                            href={`tel:${customerPhone}`}
                            className="flex items-center gap-1 text-xs font-semibold text-[#ea580c] shrink-0 hover:underline"
                          >
                            <Phone className="size-3" />
                            {customerPhone}
                          </a>
                        )}
                      </div>

                      {/* Row 3 — Time + track + mode */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-[#4c4a49] font-medium">
                        <span className="flex items-center gap-1.5">
                          <Clock className="size-3.5 text-[#ea580c]/80 shrink-0" />
                          <span className="font-bold text-[#1c1b1b]">
                            {new Date(slotStart).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false })}
                            {" – "}
                            {new Date(slotEnd).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false })}
                          </span>
                          {countdown && (
                            <span className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-bold",
                              countdown.urgent
                                ? "bg-red-50 text-red-600 border border-red-200"
                                : "bg-[#f5f3f2] text-[#6b7280]"
                            )}>
                              {countdown.label}
                            </span>
                          )}
                        </span>
                        {trackLabel && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="size-3.5 text-[#ea580c]/80 shrink-0" />
                            {trackLabel}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <Tag className="size-3 text-[#ea580c]/70 shrink-0" />
                          {playMode === "BYOC" ? "Tự mang xe" : "Thuê xe"}
                        </span>
                      </div>

                      {/* Row 4 — Counts + FnB badge */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#f0eeee]">
                        <span className="flex items-center gap-1 rounded-md bg-[#f5f3f2] px-2 py-1 text-[11px] font-bold text-[#4c4a49]">
                          <Users className="size-3 text-[#6b7280]" />
                          {participantCount} người chơi
                        </span>
                        {playMode !== "BYOC" && vehicleCount > 0 && (
                          <span className="flex items-center gap-1 rounded-md bg-[#f5f3f2] px-2 py-1 text-[11px] font-bold text-[#4c4a49]">
                            <Car className="size-3 text-[#6b7280]" />
                            {vehicleCount} xe thuê
                          </span>
                        )}
                        {hasFnb && (
                          <span className="flex items-center gap-1 rounded-md bg-orange-50 border border-orange-200 px-2 py-1 text-[11px] font-bold text-orange-700">
                            <UtensilsCrossed className="size-3" />
                            F&B đặt trước · {formatCurrency(fnbAmount)}
                          </span>
                        )}
                        <div className="ml-auto">
                          {activeSession ? (
                            <StaffButton onClick={() => navigate(`/staff/sessions/${activeSession.sessionId}`)} variant="outline" size="sm">
                              Mở phiên
                              <ArrowRight className="size-3.5" />
                            </StaffButton>
                          ) : b.status === "CONFIRMED" ? (
                            <StaffButton onClick={() => handleStartCheckIn(b)} variant="primary" size="sm">
                              Check-In bàn giao
                              <ArrowRight className="size-3.5" />
                            </StaffButton>
                          ) : completedSession ? (
                            <StaffButton onClick={() => navigate(`/staff/sessions/${completedSession.sessionId}`)} variant="outline" size="sm">
                              Xem phiên
                              <ArrowRight className="size-3.5" />
                            </StaffButton>
                          ) : null}
                        </div>
                      </div>
                    </StaffCard>
                  )
                })}

              {visibleBookings.length === 0 && (
                <StaffCard className="py-12 text-center text-[#6b7280] space-y-2 border-dashed">
                  <p className="text-sm font-bold">Không có đơn đặt lịch nào hôm nay</p>
                  <p className="text-xs">
                    Nhấn <strong className="text-[#ea580c]">Đăng ký Walk-In</strong> để lập nhanh lượt chơi mới tại quầy.
                  </p>
                </StaffCard>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. DYNAMIC WALK-IN REGISTRATION FORM */}
      {activeTab === "WALKIN" && (
        <div className="max-w-3xl mx-auto">
          <StaffCard className="p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-[#e5e2e1] pb-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-[#fff3eb] text-[#ea580c] border border-[#ffdbca]">
                <Plus className="size-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1c1b1b]">Đăng ký ca trực tiếp (Walk-In)</h3>
                <p className="text-xs text-[#6b7280]">Khởi tạo ca chơi và thanh toán nhanh chóng cho khách trực ca</p>
              </div>
            </div>

            <form onSubmit={handleWalkinSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                {/* Customer Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4c4a49] mb-1.5">
                    Tên Khách Hàng <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nhập tên khách hàng"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full rounded-lg border border-[#e5e2e1] bg-white px-4 py-2.5 text-sm font-semibold text-[#1c1b1b] focus:border-[#ea580c] focus:outline-none focus:ring-1 focus:ring-[#ea580c]"
                  />
                </div>

                {/* Customer Phone */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4c4a49] mb-1.5">
                    Số điện thoại <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Nhập số điện thoại khách hàng"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full rounded-lg border border-[#e5e2e1] bg-white px-4 py-2.5 text-sm font-semibold text-[#1c1b1b] focus:border-[#ea580c] focus:outline-none focus:ring-1 focus:ring-[#ea580c]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Play Mode */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4c4a49] mb-1.5">
                    Chế độ chơi
                  </label>
                  <select
                    value={playMode}
                    onChange={(e) => {
                      setPlayMode(e.target.value as "RENTAL" | "BYOC")
                      setSelectedVehicles([])
                      setSelectedSlot("")
                      setSelectedSlotEnd(null)
                    }}
                    className="w-full rounded-lg border border-[#e5e2e1] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#1c1b1b] focus:border-[#ea580c] focus:outline-none focus:ring-1 focus:ring-[#ea580c]"
                  >
                    <option value="RENTAL">Thuê xe của hàng</option>
                    <option value="BYOC">Tự mang xe (BYOC)</option>
                  </select>
                </div>

                {/* Track selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4c4a49] mb-1.5">
                    Đường đua hoạt động
                  </label>
                  <select
                    value={selectedTrackCode}
                    onChange={(e) => {
                      const match = cafeDetails?.trackTypes.find((t) => t.code === e.target.value)
                      if (match) {
                        setSelectedTrackCode(match.code)
                        setSelectedTrackName(match.name)
                        setSelectedSlot("")
                        setSelectedSlotEnd(null)
                      }
                    }}
                    className="w-full rounded-lg border border-[#e5e2e1] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#1c1b1b] focus:border-[#ea580c] focus:outline-none focus:ring-1 focus:ring-[#ea580c]"
                  >
                    {cafeDetails?.trackTypes.map((t) => (
                      <option key={t.id} value={t.code}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4c4a49] mb-1.5">
                    Thanh toán tại quầy
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as "CASH" | "BANK_TRANSFER") }
                    className="w-full rounded-lg border border-[#e5e2e1] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#1c1b1b] focus:border-[#ea580c] focus:outline-none focus:ring-1 focus:ring-[#ea580c]"
                  >
                    <option value="CASH">Tiền mặt (Cash)</option>
                    <option value="BANK_TRANSFER">Chuyển khoản (Bank Transfer)</option>
                  </select>
                </div>
              </div>

              {/* DATE & DYNAMIC SLOT GRID */}
              <div className="rounded-xl border border-orange-100 bg-orange-50/20 p-4 md:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#ea580c]" />
                    <span className="text-sm font-bold text-[#1c1b1b]">
                      Ngày chơi: Hôm nay (
                      {new Date().toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                      )
                    </span>
                  </div>
                  <span className="rounded-full bg-[#fff3eb] border border-[#ffdbca] px-2.5 py-0.5 text-[10px] font-bold text-[#ea580c]">
                    Walk-in trong ngày
                  </span>
                </div>

                <div className={cn("transition-opacity", isLoadingAvailability && "pointer-events-none opacity-40")}>
                  {isLoadingAvailability && (
                    <div className="flex items-center gap-2 text-xs text-[#6b7280] mb-2 animate-pulse font-semibold">
                      <Loader2 className="size-3.5 animate-spin text-[#ea580c]" />
                      Đang cập nhật danh sách slot trống...
                    </div>
                  )}

                  <DailySlotGrid
                    slots={slots}
                    selectedSlotId={selectedSlot}
                    selectedSlotEndId={selectedSlotEnd ?? undefined}
                    onSelectSlot={setSelectedSlot}
                    slotDurationMinutes={slotDuration}
                    minBookingNoticeMinutes={0}
                    openHour={openHour}
                    closeHour={closeHour}
                    date={bookingDate}
                    onSelectRange={(start, end) => {
                      setSelectedSlot(start)
                      setSelectedSlotEnd(end || null)
                    }}
                  />
                </div>
              </div>

              {/* VEHICLE FLEET MULTI SELECTOR */}
              {playMode !== "BYOC" && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4c4a49]">
                    Chọn xe cho thuê ({selectedVehicles.length} đã chọn) <span className="text-rose-500">*</span>
                  </label>

                  {loadingVehicles ? (
                    <div className="h-20 animate-pulse bg-[#fcf8f8] border border-[#e5e2e1] rounded-xl" />
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-2 bg-[#fcf8f8] rounded-xl border border-[#e5e2e1]">
                      {availableVehicles.map((unit) => {
                        const currentStatus = fleetStates[unit.id] || unit.status
                        const isSelected = selectedVehicles.some((v) => v.id === unit.id)
                        const isBusy = currentStatus === "IN_USE" || currentStatus === "MAINTENANCE"

                        return (
                          <div
                            key={unit.id}
                            onClick={() => {
                              if (!isBusy) toggleVehicle(unit)
                            }}
                            className={cn(
                              "flex items-center gap-3 rounded-lg border p-3 transition-all select-none cursor-pointer",
                              isSelected
                                ? "border-[#ea580c] bg-[#fff3eb]/30 text-[#ea580c]"
                                : "border-[#e5e2e1] bg-white hover:border-[#a09e9d]",
                              isBusy && "opacity-40 cursor-not-allowed pointer-events-none"
                            )}
                          >
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#f5f3f2] border border-[#e5e2e1]">
                              <Car className="size-5 text-[#6b7280]" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-bold text-[#1c1b1b]">
                                {unit.catalog?.name || unit.identifier}
                              </p>
                              <p className="text-[10px] text-[#6b7280] font-semibold">
                                ID: {unit.identifier} | {unit.color}
                              </p>
                              <p className="text-[10px] font-bold text-[#ea580c] mt-0.5">
                                {unit.catalog?.hourlyRate?.toLocaleString("vi-VN") || "75.000"} đ/h
                              </p>
                            </div>
                            <div className="text-right font-mono text-[9px] font-bold">
                              {isBusy ? (
                                <span className="text-rose-600">ĐANG BẬN</span>
                              ) : (
                                <span className="text-emerald-600">SẴN SÀNG</span>
                              )}
                            </div>
                          </div>
                        )
                      })}

                      {availableVehicles.length === 0 && (
                        <p className="col-span-full py-6 text-center text-xs text-[#6b7280] italic">
                          Không tìm thấy xe nào khả dụng tại cửa hàng hiện tại.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* CAPACITY WARNING */}
              <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-700">
                  <ShieldCheck className="size-4 text-blue-600" />
                  Kiểm tra an toàn & Công suất đường đua
                </div>
                <p className="text-[11px] text-blue-900 leading-relaxed font-semibold">
                  Hệ thống tự động kiểm tra tính sẵn sàng của đường đua <strong>{selectedTrackName || "đã chọn"}</strong> để tránh chồng chéo các ca chạy cùng lúc.
                </p>
              </div>

              {/* BILLING BREAKDOWN PREVIEW */}
              <div className="rounded-lg border border-[#e5e2e1] bg-[#fcf8f8] p-4 space-y-2">
                <h5 className="text-xs font-extrabold uppercase tracking-wider text-[#6b7280]">Chi tiết hóa đơn dự kiến</h5>
                
                <div className="space-y-1.5 text-xs font-bold">
                  <div className="flex justify-between text-[#4c4a49]">
                    <span>
                      Phí giờ chơi ({slotCount} slots x {slotFeeRate.toLocaleString("vi-VN")} đ)
                    </span>
                    <span>{slotFeeTotal.toLocaleString("vi-VN")} đ</span>
                  </div>
                  {playMode !== "BYOC" && (
                    <div className="flex justify-between text-[#4c4a49]">
                      <span>Phí thuê xe ({selectedVehicles.length} xe)</span>
                      <span>{rentalFeeTotal.toLocaleString("vi-VN")} đ</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#1c1b1b] border-t border-[#e5e2e1] pt-2">
                    <span>Tổng thanh toán tại quầy:</span>
                    <span className="text-[#ea580c] text-sm font-black">
                      {totalAmount.toLocaleString("vi-VN")} đ
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-2">
                <StaffButton
                  type="button"
                  onClick={() => {
                    resetWalkinForm()
                    setActiveTab("LIST")
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Hủy bỏ
                </StaffButton>
                <StaffButton type="submit" variant="primary" className="flex-1 uppercase tracking-wider">
                  Khởi tạo & Nhận ca chạy
                </StaffButton>
              </div>
            </form>
          </StaffCard>
        </div>
      )}
    </div>
  )
}

function buildSlotsFromAvailability(hourlyData: HourlySlotAvailability[], playMode: "RENTAL" | "BYOC"): DailySlot[] {
  return hourlyData.map(({ hour, data }) => {
    const startTime = `${String(hour).padStart(2, "0")}:00`
    const endTime = `${String(hour + 1).padStart(2, "0")}:00`
    if (!data) return { id: startTime, startTime, endTime, status: "booked" as DailySlotStatus, remaining: 0, rentalCount: 0, byocRemaining: 0 }

    const rentalCount = data.vehicles?.length ?? 0
    const byocRemaining = data.byoc_remaining ?? 0

    let remaining: number
    let available: boolean
    if (playMode === "RENTAL") {
      remaining = rentalCount
      available = rentalCount > 0
    } else {
      remaining = byocRemaining
      available = byocRemaining > 0
    }

    let status: DailySlotStatus
    if (!available) status = "booked"
    else if (remaining <= 2) status = "limited"
    else status = "available"

    return {
      id: startTime,
      startTime,
      endTime,
      status,
      remaining,
      rentalCount: playMode === "BYOC" ? 0 : rentalCount,
      byocRemaining: playMode === "RENTAL" ? 0 : byocRemaining,
    }
  })
}
