import React, { useState, useEffect } from "react"
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
} from "lucide-react"
import { formatCurrency } from "@/shared/lib/format"
import { useStaffOperations } from "./context/StaffOperationContext"
import { cafeApi } from "@/features/cafes/api/cafe.api"
import { vehicleApi } from "@/features/vehicles/api/vehicle.api"
import { staffApi, staffQueryKeys } from "@/features/staff/api/staff.api"
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
import type { CustomerBookingDetail } from "@/shared/data/customer-operational-mock-data"

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

  const { data: displayBookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: staffQueryKeys.todayBookings(),
    queryFn: staffApi.getTodayBookings,
    refetchInterval: 60_000,
  })

  // Primary navigation tab
  const [activeTab, setActiveTab] = useState<TabType>("LIST")
  
  // List states
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")

  // Walk-in form states
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [playMode, setPlayMode] = useState<"RENTAL" | "BYOC" | "MIXED">("RENTAL")
  const [selectedTrackCode, setSelectedTrackCode] = useState("")
  const [selectedTrackName, setSelectedTrackName] = useState("")
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [selectedVehicles, setSelectedVehicles] = useState<VehicleUnit[]>([])

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
    setSelectedVehicles([])
    setDurationMinutes(60)
    setSearchParams({})
  }

  // Calculate pricing values
  const slotFeeRate = cafeDetails ? Number(cafeDetails.slotFeeRate) || 80000 : 80000
  const slotDuration = cafeDetails?.slotDurationMinutes || 30
  const slotCount = Math.ceil(durationMinutes / slotDuration)
  const slotFeeTotal = slotCount * slotFeeRate

  // Calculate rental fees
  const rentalFeeTotal = selectedVehicles.reduce((total, unit) => {
    const hourly = unit.catalog?.hourlyRate || 75000
    return total + hourly * (durationMinutes / 60)
  }, 0)

  const totalAmount = slotFeeTotal + rentalFeeTotal

  // Submit Walk-in Form
  const handleWalkinSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!customerName.trim()) {
      toast.error("Vui lòng nhập tên khách hàng!")
      return
    }

    if (playMode !== "BYOC" && selectedVehicles.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 xe thuê để tiếp tục!")
      return
    }

    const slotStart = new Date().toISOString()
    const slotEnd = new Date(Date.now() + durationMinutes * 60000).toISOString()

    const success = createWalkInBooking({
      playMode,
      trackName: selectedTrackName,
      trackType: selectedTrackCode,
      slotStart,
      slotEnd,
      slotCount,
      slotFee: slotFeeTotal,
      rentalFee: rentalFeeTotal,
      totalAmount,
      plannedParticipants: [customerName.trim()],
      plannedVehicles: selectedVehicles.map((v) => v.identifier),
      selectedVehicles: selectedVehicles.map((v) => ({
        vehicleId: v.id,
        name: v.catalog?.name || v.identifier,
        imageUrl: v.distinctive_image_url || undefined,
      })),
    })

    if (success) {
      resetWalkinForm()
      setActiveTab("LIST")
      setSearchParams({})
    }
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

  const visibleBookings = displayBookings.filter((booking: any) => {
    const matchSearch = searchTerm === "" || getCustomerName(booking).toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = statusFilter === "ALL" || booking.status === statusFilter
    return matchSearch && matchStatus
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
                  const activeSession = b.sessions?.find((session: any) => session.status !== "COMPLETED" && session.status !== "CANCELLED") ?? b.sessions?.[0]
                  const statusLabel: Record<string, string> = {
                    PENDING: "CHỜ THANH TOÁN",
                    CONFIRMED: "ĐÃ XÁC NHẬN",
                    NO_SHOW: "KHÔNG ĐẾN",
                    COMPLETED: "HOÀN THÀNH",
                    CANCELLED: "ĐÃ HỦY",
                  }
                  const badgeVariant =
                    b.status === "CONFIRMED" ? "info"
                    : b.status === "COMPLETED" ? "success"
                    : b.status === "CANCELLED" || b.status === "NO_SHOW" ? "neutral"
                    : "warning"

                  const hasFnb = fnbAmount > 0
                  const countdown = getSlotCountdown(slotStart)

                  return (
                    <StaffCard key={bookingId} className="space-y-3">
                      {/* Row 1 — ID + status + detail link */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#a09e9d] font-mono font-bold">
                            #{bookingId.slice(0, 8).toUpperCase()}
                          </span>
                          <StaffBadge variant={badgeVariant}>{statusLabel[b.status] ?? b.status}</StaffBadge>
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
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    placeholder="Nhập số điện thoại khách hàng"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full rounded-lg border border-[#e5e2e1] bg-white px-4 py-2.5 text-sm font-semibold text-[#1c1b1b] focus:border-[#ea580c] focus:outline-none focus:ring-1 focus:ring-[#ea580c]"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {/* Play Mode */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4c4a49] mb-1.5">
                    Chế độ chơi
                  </label>
                  <select
                    value={playMode}
                    onChange={(e) => {
                      setPlayMode(e.target.value as any)
                      setSelectedVehicles([])
                    }}
                    className="w-full rounded-lg border border-[#e5e2e1] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#1c1b1b] focus:border-[#ea580c] focus:outline-none focus:ring-1 focus:ring-[#ea580c]"
                  >
                    <option value="RENTAL">Thuê xe của hàng</option>
                    <option value="BYOC">Tự mang xe (BYOC)</option>
                    <option value="MIXED">Hỗn hợp (Thuê + BYOC)</option>
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

                {/* Duration selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4c4a49] mb-1.5">
                    Thời lượng ca chơi
                  </label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full rounded-lg border border-[#e5e2e1] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#1c1b1b] focus:border-[#ea580c] focus:outline-none focus:ring-1 focus:ring-[#ea580c]"
                  >
                    <option value={30}>30 phút ({slotDuration} phút/lượt)</option>
                    <option value={60}>60 phút (1 giờ)</option>
                    <option value={90}>90 phút (1.5 giờ)</option>
                    <option value={120}>120 phút (2 giờ)</option>
                  </select>
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
