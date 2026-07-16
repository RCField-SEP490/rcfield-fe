/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
import React, { useState, useEffect, useMemo } from "react"
import { useSearchParams, Link, useNavigate } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { z } from "zod"
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
import { cafeApi, cafeQueryKeys } from "@/features/cafes/api/cafe.api"
import { useVehicleUnits } from "@/features/vehicles/hooks/useVehicleUnits"
import { staffApi, staffQueryKeys } from "@/features/staff/api/staff.api"
import {
  bookingApi,
  bookingQueryKeys,
} from "@/features/booking/api/booking.api"
import { VehicleStatus, type VehicleUnit } from "@/features/vehicles/types"
import { cn, getCatalogImageUrl, sanitizeImageUrl } from "@/shared/lib/utils"
import {
  StaffHeader,
  StaffCard,
  StaffBadge,
  StaffButton,
} from "./components/StaffUI"
import { QrCheckinUploader } from "@/features/staff/components/QrCheckinUploader"
import type { CustomerBookingDetail } from "@/shared/data/customer-operational-mock-data"
import {
  useAvailability,
  useDailyAvailability,
  toVietnamSlotISOString,
} from "@/features/booking/hooks/use-booking"
import { useTrackConfigs } from "@/features/cafes/hooks/useTrackConfigs"
import {
  DailySlotGrid,
  type DailySlot,
  type DailySlotStatus,
} from "@/pages/customer/cafe-detail/components/DailySlotGrid"
import type { HourlySlotAvailability } from "@/features/booking/hooks/use-booking"

type TabType = "LIST" | "WALKIN"

const MAX_CONSECUTIVE_SLOTS = 8

const walkInFormSchema = z
  .object({
    customerName: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập tên khách hàng")
      .max(255, "Tên khách hàng không được quá 255 ký tự"),
    customerPhone: z
      .string()
      .trim()
      .regex(
        /^(84|0[35789])\d{8}$/,
        "Số điện thoại cần có 10 số và bắt đầu bằng 03, 05, 07, 08 hoặc 09",
      ),
    playMode: z.enum(["RENTAL", "BYOC"]),
    paymentMethod: z.enum(["CASH", "BANK_TRANSFER"]),
    trackTypeId: z.string().uuid("Vui lòng chọn đường đua đang hoạt động"),
    slotStart: z.string().datetime({ offset: true }),
    slotEnd: z.string().datetime({ offset: true }),
    slotDurationMinutes: z
      .number()
      .int()
      .positive("Thời lượng slot của cơ sở chưa hợp lệ")
      .max(1440),
    scheduleConfigured: z.boolean(),
    vehicleIds: z.array(z.string().uuid()),
  })
  .superRefine((data, ctx) => {
    if (!data.scheduleConfigured) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["scheduleConfigured"],
        message:
          "Cơ sở chưa cấu hình giờ hoạt động hoặc thời lượng slot hợp lệ",
      })
    }

    const start = new Date(data.slotStart)
    const end = new Date(data.slotEnd)
    const durationMinutes = (end.getTime() - start.getTime()) / 60_000
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["slotEnd"],
        message: "Khoảng thời gian chơi không hợp lệ",
      })
    } else if (
      durationMinutes % data.slotDurationMinutes !== 0 ||
      durationMinutes > data.slotDurationMinutes * MAX_CONSECUTIVE_SLOTS
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["slotEnd"],
        message: `Chỉ được chọn tối đa ${MAX_CONSECUTIVE_SLOTS} slot liên tiếp`,
      })
    }

    if (data.playMode === "RENTAL" && data.vehicleIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["vehicleIds"],
        message: "Vui lòng chọn ít nhất 1 xe thuê",
      })
    }
    if (data.playMode === "BYOC" && data.vehicleIds.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["vehicleIds"],
        message: "Chế độ tự mang xe không được chọn xe của cửa hàng",
      })
    }
  })

type WalkInFieldErrors = Partial<
  Record<
    | "customerName"
    | "customerPhone"
    | "playMode"
    | "paymentMethod"
    | "trackTypeId"
    | "slotStart"
    | "slotEnd"
    | "slotDurationMinutes"
    | "scheduleConfigured"
    | "vehicleIds",
    string
  >
>

function getSlotCountdown(
  startTime: string,
): { label: string; urgent: boolean } | null {
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
  return (
    booking.customerName ?? booking.plannedParticipants?.[0] ?? "Khách hàng"
  )
}

function getCustomerPhone(booking: any): string | null {
  return booking.customerPhone ?? null
}

function getSlotStart(booking: any): string {
  return booking.startTime ?? booking.slotStart
}

function addMinutesToTime(time: string, minutes: number): string {
  const [hour, minute] = time.split(":").map(Number)
  const total = hour * 60 + minute + minutes
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`
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
  return Number(booking.fnbPreorderFee ?? 0)
}

function getFnbOnsiteAmount(booking: any): number {
  return Number(booking.fnbOnsiteFee ?? 0)
}

function VehicleThumbnail({ unit }: { unit: VehicleUnit }) {
  const [isImageUnavailable, setIsImageUnavailable] = useState(false)
  const imageUrl = isImageUnavailable
    ? null
    : (sanitizeImageUrl(unit.distinctive_image_url) ??
      getCatalogImageUrl(unit.catalog))

  return (
    <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-[#e5e2e1] bg-[#f5f3f2]">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={unit.catalog?.name || unit.identifier}
          className="h-full w-full object-cover"
          onError={() => setIsImageUnavailable(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Car className="size-7 text-[#6b7280]" />
        </div>
      )}
    </div>
  )
}

export default function StaffTodayBookingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { assignedCafeId, createWalkInBooking, startCheckIn } =
    useStaffOperations()
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
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const date = String(d.getDate()).padStart(2, "0")
    return `${year}-${month}-${date}`
  }

  // Walk-in form states
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [fieldErrors, setFieldErrors] = useState<WalkInFieldErrors>({})
  const [playMode, setPlayMode] = useState<"RENTAL" | "BYOC">("RENTAL")
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "BANK_TRANSFER">(
    "CASH",
  )
  const [selectedTrackCode, setSelectedTrackCode] = useState("")
  const [selectedTrackName, setSelectedTrackName] = useState("")
  const [selectedSlot, setSelectedSlot] = useState("")
  const [selectedSlotEnd, setSelectedSlotEnd] = useState<string | null>(null)
  const [selectedVehicles, setSelectedVehicles] = useState<VehicleUnit[]>([])
  const bookingDate = getTodayString()

  // Cafe details — dùng useQuery thay vì useEffect+setState
  const { data: cafeDetails, isLoading: isLoadingCafe } = useQuery({
    queryKey: cafeQueryKeys.detail(assignedCafeId ?? ""),
    queryFn: () => cafeApi.getCafe(assignedCafeId!),
    enabled: !!assignedCafeId,
    staleTime: 5 * 60 * 1000, // 5 phút
  })

  // Only load physical units that are currently in AVAILABLE state.
  const { data: availableVehicles = [], isLoading: loadingVehicles } =
    useVehicleUnits(assignedCafeId ?? "", { status: VehicleStatus.AVAILABLE })

  // Track configs (must be before useEffects that reference it)
  const { data: trackConfigs = [] } = useTrackConfigs(assignedCafeId ?? "")

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
    if (activeTab === "WALKIN") {
      const trackNameUrl = searchParams.get("track")
      const trackTypeUrl = searchParams.get("type")
      if (trackNameUrl && trackTypeUrl) {
        setSelectedTrackName(trackNameUrl)
        setSelectedTrackCode(trackTypeUrl)
      } else {
        const activeConfigs = trackConfigs.filter((c) => c.is_active)
        if (activeConfigs.length > 0 && !selectedTrackCode) {
          setSelectedTrackName(activeConfigs[0].track_type?.name ?? "")
          setSelectedTrackCode(activeConfigs[0].track_type?.code ?? "")
        }
      }
    }
  }, [activeTab, selectedTrackCode, trackConfigs, searchParams])

  // Reset Walk-in form
  const resetWalkinForm = () => {
    setCustomerName("")
    setCustomerPhone("")
    setFieldErrors({})
    setPlayMode("RENTAL")
    setPaymentMethod("CASH")
    setSelectedVehicles([])
    setSelectedSlot("")
    setSelectedSlotEnd(null)
    setSearchParams({})
  }

  const selectedTrackConfig = useMemo(() => {
    return (
      trackConfigs.find((c) => c.track_type?.code === selectedTrackCode) || null
    )
  }, [trackConfigs, selectedTrackCode])

  const { openHour, closeHour, isClosedToday, isScheduleConfigured } =
    useMemo(() => {
      const DAY_KEYS = [
        "sun",
        "mon",
        "tue",
        "wed",
        "thu",
        "fri",
        "sat",
      ] as const
      const dayKey = DAY_KEYS[new Date().getDay()]
      const hours = (
        cafeDetails?.operatingHours as
          | Record<
              string,
              { open?: string; close?: string; is_closed?: boolean }
            >
          | undefined
      )?.[dayKey]
      const parseHour = (t?: string) => {
        if (!t) return null
        const parsed = parseInt(t.split(":")[0], 10)
        return Number.isInteger(parsed) && parsed >= 0 && parsed <= 24
          ? parsed
          : null
      }
      const configuredOpenHour = parseHour(hours?.open)
      let configuredCloseHour = parseHour(hours?.close)
      // midnight (00:00) or any close ≤ open means next-day close → add 24
      if (configuredOpenHour !== null && configuredCloseHour !== null && configuredCloseHour <= configuredOpenHour) {
        configuredCloseHour = configuredCloseHour + 24
      }
      const slotDurationMinutes = Number(cafeDetails?.slotDurationMinutes)
      return {
        openHour: configuredOpenHour ?? 0,
        closeHour: configuredCloseHour ?? 0,
        isClosedToday: !!hours?.is_closed,
        isScheduleConfigured:
          configuredOpenHour !== null &&
          configuredCloseHour !== null &&
          configuredCloseHour > configuredOpenHour &&
          Number.isInteger(slotDurationMinutes) &&
          slotDurationMinutes > 0,
      }
    }, [cafeDetails])

  const slotDuration = Number(cafeDetails?.slotDurationMinutes) || 0
  const selectedSlotEndTime = selectedSlot
    ? (selectedSlotEnd ?? addMinutesToTime(selectedSlot, slotDuration))
    : ""
  const selectedSlotStartForAvailability = selectedSlot
    ? toVietnamSlotISOString(bookingDate, selectedSlot)
    : ""
  const selectedSlotEndForAvailability = selectedSlotEndTime
    ? toVietnamSlotISOString(bookingDate, selectedSlotEndTime)
    : ""

  const { data: dailyAvailability, isLoading: isLoadingAvailability } =
    useDailyAvailability(
      assignedCafeId ?? "",
      bookingDate,
      openHour,
      closeHour,
      selectedTrackConfig?.id || undefined,
    )

  const {
    data: selectedSlotAvailability,
    isLoading: isLoadingSelectedSlotAvailability,
  } = useAvailability(
    assignedCafeId ?? "",
    {
      slot_start: selectedSlotStartForAvailability,
      slot_end: selectedSlotEndForAvailability,
      play_mode: "RENTAL",
      ...(selectedTrackConfig
        ? { track_config_id: selectedTrackConfig.id }
        : {}),
    },
    !!selectedSlot && !!selectedTrackConfig,
  )

  const selectableVehicleIds = useMemo(
    () =>
      new Set(
        selectedSlotAvailability?.vehicles.map(
          (vehicle) => vehicle.vehicle_id,
        ) ?? [],
      ),
    [selectedSlotAvailability],
  )
  const selectableVehicles = useMemo(
    () =>
      availableVehicles.filter(
        (vehicle) =>
          selectableVehicleIds.has(vehicle.id) &&
          vehicle.status === VehicleStatus.AVAILABLE,
      ),
    [availableVehicles, selectableVehicleIds],
  )
  const selectedSelectableVehicles = useMemo(
    () =>
      selectedVehicles.filter((vehicle) =>
        selectableVehicleIds.has(vehicle.id),
      ),
    [selectedVehicles, selectableVehicleIds],
  )

  useEffect(() => {
    if (!selectedSlotAvailability) return
    setSelectedVehicles((current) => {
      const next = current.filter((vehicle) =>
        selectableVehicleIds.has(vehicle.id),
      )
      return next.length === current.length ? current : next
    })
  }, [selectedSlotAvailability, selectableVehicleIds])

  const slots = useMemo<DailySlot[]>(() => {
    if (!dailyAvailability) return []
    return buildSlotsFromAvailability(dailyAvailability, playMode)
  }, [dailyAvailability, playMode])

  const calculateDurationFromSlots = (
    start: string,
    end: string | null,
  ): number => {
    if (!start) return 0
    const [startH, startM] = start.split(":").map(Number)
    if (!slotDuration) return 0
    if (!end) return slotDuration
    const [endH, endM] = end.split(":").map(Number)
    const startTotal = startH * 60 + startM
    const endTotal = endH * 60 + endM
    return Math.max(slotDuration, endTotal - startTotal)
  }

  // Calculate pricing values
  // Không dùng fallback giá giả — nếu chưa load cafe thì hiện 0
  const slotFeeRate = cafeDetails ? Number(cafeDetails.slotFeeRate) || 0 : 0
  const computedDuration = calculateDurationFromSlots(
    selectedSlot,
    selectedSlotEnd,
  )
  const slotCount =
    slotDuration > 0 ? Math.ceil(computedDuration / slotDuration) : 0
  const slotFeeTotal = slotCount * slotFeeRate

  // Không dùng fallback giá giả — nếu catalog chưa có hourlyRate thì tính 0
  const rentalFeeTotal = selectedSelectableVehicles.reduce((total, unit) => {
    const hourly = unit.catalog?.hourlyRate ?? 0
    return total + hourly * (computedDuration / 60)
  }, 0)

  const totalAmount = slotFeeTotal + rentalFeeTotal

  // Submit Walk-in Form
  const handleWalkinSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const slotStart = selectedSlot
      ? toVietnamSlotISOString(bookingDate, selectedSlot)
      : ""
    const slotEnd = selectedSlotEndTime
      ? toVietnamSlotISOString(bookingDate, selectedSlotEndTime)
      : ""
    const parsed = walkInFormSchema.safeParse({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      playMode,
      paymentMethod,
      trackTypeId: selectedTrackConfig?.track_type_id ?? "",
      slotStart,
      slotEnd,
      slotDurationMinutes: slotDuration,
      scheduleConfigured: isScheduleConfigured,
      vehicleIds: selectedSelectableVehicles.map((vehicle) => vehicle.id),
    })

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors
      setFieldErrors({
        customerName: errors.customerName?.[0],
        customerPhone: errors.customerPhone?.[0],
        playMode: errors.playMode?.[0],
        paymentMethod: errors.paymentMethod?.[0],
        trackTypeId: errors.trackTypeId?.[0],
        slotStart: errors.slotStart?.[0],
        slotEnd: errors.slotEnd?.[0],
        slotDurationMinutes: errors.slotDurationMinutes?.[0],
        scheduleConfigured: errors.scheduleConfigured?.[0],
        vehicleIds: errors.vehicleIds?.[0],
      })
      return
    }

    if (
      parsed.data.playMode === "RENTAL" &&
      (isLoadingSelectedSlotAvailability || !selectedSlotAvailability)
    ) {
      setFieldErrors({
        vehicleIds:
          "Đang kiểm tra xe trống cho khung giờ đã chọn. Vui lòng thử lại ngay sau đó.",
      })
      return
    }
    if (
      parsed.data.playMode === "RENTAL" &&
      parsed.data.vehicleIds.some(
        (vehicleId) => !selectableVehicleIds.has(vehicleId),
      )
    ) {
      setFieldErrors({
        vehicleIds: "Một hoặc nhiều xe vừa không còn trống. Vui lòng chọn lại.",
      })
      return
    }

    setFieldErrors({})

    createWalkInBooking({
      playMode: parsed.data.playMode,
      trackTypeId: parsed.data.trackTypeId,
      slotStart: parsed.data.slotStart,
      slotEnd: parsed.data.slotEnd,
      paymentMethod: parsed.data.paymentMethod,
      vehicleIds: parsed.data.vehicleIds,
      participants: [
        {
          guest_name: parsed.data.customerName,
          guest_phone: parsed.data.customerPhone,
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
      ["ACTIVE", "EXTENDING", "CHECKING_OUT", "CHECKED_IN"].includes(s.status),
    )
    if (session?.status === "ACTIVE" || session?.status === "EXTENDING")
      return 0
    if (session?.status === "CHECKING_OUT" || session?.status === "CHECKED_IN")
      return 1
    if (booking.status === "CONFIRMED") return 2
    if (booking.status === "PENDING") return 3
    const hasPending = booking.payment_components?.some(
      (c: any) => c.status === "PENDING",
    )
    if (booking.status === "COMPLETED" && hasPending) return 4
    if (booking.status === "COMPLETED") return 5
    return 6 // CANCELLED, NO_SHOW
  }

  const visibleBookings = displayBookings
    .filter((booking: any) => {
      const matchSearch =
        searchTerm === "" ||
        getCustomerName(booking)
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      const matchStatus =
        statusFilter === "ALL" || booking.status === statusFilter
      return matchSearch && matchStatus
    })
    .sort((a: any, b: any) => {
      const priorityDiff = getStatusSortPriority(a) - getStatusSortPriority(b)
      if (priorityDiff !== 0) return priorityDiff
      return (
        new Date(getSlotStart(a)).getTime() -
        new Date(getSlotStart(b)).getTime()
      )
    })

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <StaffHeader
        title={
          activeTab === "LIST"
            ? "Đặt Lịch Trong Ngày"
            : "Đăng Ký Khách Vãng Lai"
        }
        subtitle={
          activeTab === "LIST"
            ? "Quản lý check-in, giám sát tiến độ hoạt động các lượt đua trong ca trực"
            : "Thiết lập nhanh ca đua trực tiếp cho khách hàng vãng lai thanh toán tại quầy"
        }
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
              : "border-transparent text-[#6b7280] hover:text-[#1c1b1b]",
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
              : "border-transparent text-[#6b7280] hover:text-[#1c1b1b]",
          )}
        >
          <Plus className="size-4" />
          Tạo đơn trực tiếp tại quầy
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
                      : "bg-white text-[#6b7280] border-[#e5e2e1] hover:bg-[#fcf8f8] hover:text-[#1c1b1b]",
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
              {showQrPanel ? (
                <ChevronUp className="size-4 text-[#a09e9d]" />
              ) : (
                <ChevronDown className="size-4 text-[#a09e9d]" />
              )}
            </button>

            {showQrPanel && (
              <div className="px-4 pb-4 space-y-4 border-t border-[#f0eeee] pt-4">
                <QrCheckinUploader
                  onDecoded={(id) => {
                    setQrBookingId(id)
                    setQrInputValue(id)
                  }}
                />

                <div className="relative flex items-center">
                  <div className="flex-grow border-t border-[#e5e2e1]" />
                  <span className="mx-3 text-xs font-bold text-[#a09e9d] bg-white px-1">
                    hoặc
                  </span>
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
                      onClick={() => {
                        setQrBookingId("")
                        setQrInputValue("")
                      }}
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
                          <StaffBadge
                            variant={
                              qrBookingData.status === "CONFIRMED"
                                ? "info"
                                : qrBookingData.status === "COMPLETED"
                                  ? "success"
                                  : "neutral"
                            }
                          >
                            {qrBookingData.status}
                          </StaffBadge>
                        </div>
                        <div className="text-xs space-y-1 text-[#4c4a49] font-semibold">
                          <p>
                            <span className="text-[#a09e9d]">Khách:</span>{" "}
                            {qrBookingData.participants?.[0]?.resolvedName ??
                              "—"}
                          </p>
                          <p>
                            <span className="text-[#a09e9d]">Giờ:</span>{" "}
                            {new Date(
                              qrBookingData.slotStart,
                            ).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {" – "}
                            {new Date(qrBookingData.slotEnd).toLocaleTimeString(
                              "vi-VN",
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </p>
                          <p>
                            <span className="text-[#a09e9d]">Chế độ:</span>{" "}
                            {qrBookingData.playMode === "RENTAL"
                              ? "Thuê xe"
                              : "Xe tự mang"}
                          </p>
                        </div>
                        {qrBookingData.status !== "CONFIRMED" && (
                          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">
                            {qrBookingData.status === "COMPLETED"
                              ? "Booking này đã hoàn thành."
                              : qrBookingData.status === "CANCELLED"
                                ? "Booking này đã bị hủy."
                                : qrBookingData.status === "NO_SHOW"
                                  ? "Booking này đã quá hạn (No Show)."
                                  : qrBookingData.status === "PENDING"
                                    ? "Booking chưa thanh toán, không thể check-in."
                                    : "Không thể check-in với trạng thái hiện tại."}
                          </div>
                        )}
                        {qrBookingData.status === "CONFIRMED" &&
                          qrBookingData.session && (
                            <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-700">
                              Đã check-in lúc{" "}
                              {qrBookingData.session.actualStartAt
                                ? new Date(
                                    qrBookingData.session.actualStartAt,
                                  ).toLocaleTimeString("vi-VN")
                                : "—"}
                              .
                            </div>
                          )}
                        {qrBookingData.status === "CONFIRMED" &&
                          !qrBookingData.session && (
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
              {visibleBookings.map((b: any) => {
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
                const fnbOnsiteAmount = getFnbOnsiteAmount(b)
                const activeSession = ![
                  "COMPLETED",
                  "CANCELLED",
                  "NO_SHOW",
                ].includes(b.status)
                  ? b.sessions?.find((session: any) =>
                      [
                        "ACTIVE",
                        "CHECKED_IN",
                        "EXTENDING",
                        "CHECKING_OUT",
                      ].includes(session.status),
                    )
                  : undefined
                const completedSession =
                  b.status === "COMPLETED"
                    ? b.sessions?.find(
                        (session: any) => session.status === "COMPLETED",
                      )
                    : undefined
                const sessionStatusLabel: Record<string, string> = {
                  CHECKED_IN: "ĐANG CHECK-IN",
                  ACTIVE: "ĐANG CHƠI",
                  EXTENDING: "GIA HẠN",
                  CHECKING_OUT: "ĐANG CHECKOUT",
                }
                const hasPendingSettlement =
                  b.status === "COMPLETED" &&
                  (b as any).payment_components?.some(
                    (c: any) => c.status === "PENDING",
                  )
                const bookingStatusLabel: Record<string, string> = {
                  PENDING: "CHỜ THANH TOÁN",
                  CONFIRMED: "ĐÃ XÁC NHẬN",
                  NO_SHOW: "KHÔNG ĐẾN",
                  COMPLETED: hasPendingSettlement
                    ? "CHỜ QUYẾT TOÁN"
                    : "HOÀN THÀNH",
                  CANCELLED: "ĐÃ HỦY",
                }
                const displayLabel = activeSession
                  ? (sessionStatusLabel[activeSession.status] ??
                    activeSession.status)
                  : (bookingStatusLabel[b.status] ?? b.status)
                const badgeVariant =
                  activeSession?.status === "ACTIVE" ||
                  activeSession?.status === "EXTENDING"
                    ? "success"
                    : activeSession?.status === "CHECKED_IN" ||
                        activeSession?.status === "CHECKING_OUT"
                      ? "warning"
                      : b.status === "CONFIRMED"
                        ? "info"
                        : b.status === "COMPLETED" && !hasPendingSettlement
                          ? "success"
                          : b.status === "CANCELLED" || b.status === "NO_SHOW"
                            ? "neutral"
                            : "warning"

                const hasFnb = fnbAmount > 0
                const hasOnsiteFnb = fnbOnsiteAmount > 0
                const countdown = activeSession
                  ? null
                  : getSlotCountdown(slotStart)
                const remainingMs = activeSession
                  ? new Date(slotEnd).getTime() - nowTime
                  : null
                const remainingMinutes =
                  remainingMs !== null ? Math.ceil(remainingMs / 60000) : null

                return (
                  <StaffCard key={bookingId} className="space-y-3">
                    {/* Row 1 — ID + status + remaining + detail link */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-[#a09e9d] font-mono font-bold">
                          #{bookingId.slice(0, 8).toUpperCase()}
                        </span>
                        <StaffBadge variant={badgeVariant}>
                          {displayLabel}
                        </StaffBadge>
                        {remainingMinutes !== null && remainingMinutes > 0 && (
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-0.5 text-[10px] font-bold border",
                              remainingMinutes <= 10
                                ? "bg-red-50 text-red-600 border-red-200"
                                : remainingMinutes <= 20
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200",
                            )}
                          >
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
                      <h4 className="text-base font-bold text-[#1c1b1b] leading-tight">
                        {customerName}
                      </h4>
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
                          {new Date(slotStart).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })}
                          {" – "}
                          {new Date(slotEnd).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })}
                        </span>
                        {countdown && (
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-bold",
                              countdown.urgent
                                ? "bg-red-50 text-red-600 border border-red-200"
                                : "bg-[#f5f3f2] text-[#6b7280]",
                            )}
                          >
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
                      {hasOnsiteFnb && (
                        <span className="flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-1 text-[11px] font-bold text-amber-700">
                          <UtensilsCrossed className="size-3" />
                          F&B gọi tại ca · {formatCurrency(fnbOnsiteAmount)}
                        </span>
                      )}
                      <div className="ml-auto">
                        {activeSession ? (
                          <StaffButton
                            onClick={() =>
                              navigate(
                                `/staff/sessions/${activeSession.sessionId}`,
                              )
                            }
                            variant="outline"
                            size="sm"
                          >
                            Mở phiên
                            <ArrowRight className="size-3.5" />
                          </StaffButton>
                        ) : b.status === "CONFIRMED" ? (
                          <StaffButton
                            onClick={() => handleStartCheckIn(b)}
                            variant="primary"
                            size="sm"
                          >
                            Check-In bàn giao
                            <ArrowRight className="size-3.5" />
                          </StaffButton>
                        ) : completedSession ? (
                          <StaffButton
                            onClick={() =>
                              navigate(
                                `/staff/sessions/${completedSession.sessionId}`,
                              )
                            }
                            variant="outline"
                            size="sm"
                          >
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
                  <p className="text-sm font-bold">
                    Không có đơn đặt lịch nào hôm nay
                  </p>
                  <p className="text-xs">
                    Nhấn{" "}
                    <strong className="text-[#ea580c]">
                      Đăng ký khách vãng lai
                    </strong>{" "}
                    để lập nhanh lượt chơi mới tại quầy.
                  </p>
                </StaffCard>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. DYNAMIC WALK-IN REGISTRATION FORM */}
      {activeTab === "WALKIN" && (
        <div className="mx-auto w-full max-w-[1440px]">
          <StaffCard className="p-5 md:p-7">
            <div className="mb-6 flex items-center gap-3 border-b border-[#e5e2e1] pb-5">
              <div className="flex size-11 items-center justify-center rounded-xl border border-[#ffdbca] bg-[#fff3eb] text-[#ea580c]">
                <Plus className="size-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1c1b1b]">
                  Đăng ký ca trực tiếp tại quầy
                </h3>
                <p className="text-xs text-[#6b7280]">
                  Thiết lập nhanh ca chơi và thanh toán cho khách tại quầy
                </p>
              </div>
            </div>

            <form onSubmit={handleWalkinSubmit} className="space-y-6">
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
                <section className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Customer Name */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#4c4a49] mb-1.5">
                        Tên Khách Hàng <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Nhập tên khách hàng"
                        value={customerName}
                        onChange={(e) => {
                          setCustomerName(e.target.value)
                          setFieldErrors((p) => ({
                            ...p,
                            customerName: undefined,
                          }))
                        }}
                        className={cn(
                          "w-full rounded-lg border bg-white px-4 py-2.5 text-sm font-semibold text-[#1c1b1b] focus:outline-none focus:ring-1",
                          fieldErrors.customerName
                            ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500"
                            : "border-[#e5e2e1] focus:border-[#ea580c] focus:ring-[#ea580c]",
                        )}
                      />
                      {fieldErrors.customerName && (
                        <p className="mt-1 text-xs text-rose-500">
                          {fieldErrors.customerName}
                        </p>
                      )}
                    </div>

                    {/* Customer Phone */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#4c4a49] mb-1.5">
                        Số điện thoại <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        placeholder="Nhập số điện thoại khách hàng"
                        value={customerPhone}
                        onChange={(e) => {
                          setCustomerPhone(e.target.value)
                          setFieldErrors((p) => ({
                            ...p,
                            customerPhone: undefined,
                          }))
                        }}
                        className={cn(
                          "w-full rounded-lg border bg-white px-4 py-2.5 text-sm font-semibold text-[#1c1b1b] focus:outline-none focus:ring-1",
                          fieldErrors.customerPhone
                            ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500"
                            : "border-[#e5e2e1] focus:border-[#ea580c] focus:ring-[#ea580c]",
                        )}
                      />
                      {fieldErrors.customerPhone && (
                        <p className="mt-1 text-xs text-rose-500">
                          {fieldErrors.customerPhone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {/* Play Mode */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#4c4a49] mb-1.5">
                        Chế độ chơi <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={playMode}
                        onChange={(e) => {
                          setPlayMode(e.target.value as "RENTAL" | "BYOC")
                          setSelectedVehicles([])
                          setSelectedSlot("")
                          setSelectedSlotEnd(null)
                          setFieldErrors((current) => ({
                            ...current,
                            playMode: undefined,
                            vehicleIds: undefined,
                            slotStart: undefined,
                            slotEnd: undefined,
                          }))
                        }}
                        className={cn(
                          "w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm font-semibold text-[#1c1b1b] focus:outline-none focus:ring-1",
                          fieldErrors.playMode
                            ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500"
                            : "border-[#e5e2e1] focus:border-[#ea580c] focus:ring-[#ea580c]",
                        )}
                      >
                        <option value="RENTAL">Thuê xe của hàng</option>
                        <option value="BYOC">Tự mang xe</option>
                      </select>
                      {fieldErrors.playMode && (
                        <p className="mt-1 text-xs text-rose-500">
                          {fieldErrors.playMode}
                        </p>
                      )}
                    </div>

                    {/* Track selector */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#4c4a49] mb-1.5">
                        Đường đua hoạt động{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={selectedTrackCode}
                        onChange={(e) => {
                          const match = trackConfigs.find(
                            (c) => c.track_type?.code === e.target.value,
                          )
                          if (match) {
                            const targetTrackCode = match.track_type?.code ?? ""
                            setSelectedTrackCode(targetTrackCode)
                            setSelectedTrackName(match.track_type?.name ?? "")
                            setSelectedSlot("")
                            setSelectedSlotEnd(null)
                            setFieldErrors((current) => ({
                              ...current,
                              trackTypeId: undefined,
                              slotStart: undefined,
                              slotEnd: undefined,
                              vehicleIds: undefined,
                            }))
                            // Filter out incompatible vehicles
                            setSelectedVehicles((prev) =>
                              prev.filter((v) => {
                                const compat = v.catalog?.compatibleTrackTypes
                                return (
                                  !compat ||
                                  compat.length === 0 ||
                                  compat.some((t) =>
                                    typeof t === "string"
                                      ? t === targetTrackCode
                                      : t.code === targetTrackCode ||
                                        t.id === targetTrackCode,
                                  )
                                )
                              }),
                            )
                          }
                        }}
                        className={cn(
                          "w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm font-semibold text-[#1c1b1b] focus:outline-none focus:ring-1",
                          fieldErrors.trackTypeId
                            ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500"
                            : "border-[#e5e2e1] focus:border-[#ea580c] focus:ring-[#ea580c]",
                        )}
                      >
                        {trackConfigs
                          .filter((c) => c.is_active)
                          .map((c) => (
                            <option key={c.id} value={c.track_type?.code ?? ""}>
                              {c.track_type?.name ?? c.id}
                            </option>
                          ))}
                      </select>
                      {fieldErrors.trackTypeId && (
                        <p className="mt-1 text-xs text-rose-500">
                          {fieldErrors.trackTypeId}
                        </p>
                      )}
                    </div>

                    {/* Payment Method */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#4c4a49] mb-1.5">
                        Thanh toán tại quầy{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => {
                          setPaymentMethod(
                            e.target.value as "CASH" | "BANK_TRANSFER",
                          )
                          setFieldErrors((current) => ({
                            ...current,
                            paymentMethod: undefined,
                          }))
                        }}
                        className={cn(
                          "w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm font-semibold text-[#1c1b1b] focus:outline-none focus:ring-1",
                          fieldErrors.paymentMethod
                            ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500"
                            : "border-[#e5e2e1] focus:border-[#ea580c] focus:ring-[#ea580c]",
                        )}
                      >
                        <option value="CASH">Tiền mặt</option>
                        <option value="BANK_TRANSFER">Chuyển khoản</option>
                      </select>
                      {fieldErrors.paymentMethod && (
                        <p className="mt-1 text-xs text-rose-500">
                          {fieldErrors.paymentMethod}
                        </p>
                      )}
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
                        Khách vãng lai trong ngày
                      </span>
                    </div>

                    {isClosedToday && (
                      <div className="rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-700">
                        Cửa hàng hôm nay đóng cửa (Theo lịch hoạt động). Không
                        thể khởi tạo ca chơi trực tiếp.
                      </div>
                    )}

                    {!isLoadingCafe &&
                      !isClosedToday &&
                      !isScheduleConfigured && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3.5 text-xs font-bold text-amber-800">
                          Cơ sở chưa cấu hình giờ hoạt động hoặc thời lượng slot
                          hợp lệ. Không thể tạo đơn tại quầy.
                        </div>
                      )}

                    <div
                      className={cn(
                        "transition-opacity",
                        (isLoadingAvailability ||
                          isClosedToday ||
                          !isScheduleConfigured) &&
                          "pointer-events-none opacity-40",
                      )}
                    >
                      {isLoadingAvailability && (
                        <div className="flex items-center gap-2 text-xs text-[#6b7280] mb-2 animate-pulse font-semibold">
                          <Loader2 className="size-3.5 animate-spin text-[#ea580c]" />
                          Đang cập nhật danh sách slot trống...
                        </div>
                      )}

                      {isLoadingCafe ? (
                        <div className="h-52 animate-pulse rounded-lg bg-muted" />
                      ) : isScheduleConfigured ? (
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
                            setFieldErrors((current) => ({
                              ...current,
                              slotStart: undefined,
                              slotEnd: undefined,
                              vehicleIds: undefined,
                            }))
                          }}
                        />
                      ) : (
                        <div className="rounded-lg border border-dashed border-amber-200 bg-amber-50/50 px-4 py-6 text-center text-xs text-amber-800">
                          Chưa có lịch hoạt động hợp lệ để hiển thị slot.
                        </div>
                      )}
                    </div>
                    {(fieldErrors.slotStart ||
                      fieldErrors.slotEnd ||
                      fieldErrors.slotDurationMinutes ||
                      fieldErrors.scheduleConfigured) && (
                      <p className="text-xs font-medium text-rose-600">
                        {fieldErrors.slotStart ??
                          fieldErrors.slotEnd ??
                          fieldErrors.slotDurationMinutes ??
                          fieldErrors.scheduleConfigured}
                      </p>
                    )}
                  </div>
                </section>

                <aside className="space-y-4 xl:sticky xl:top-5 xl:self-start">
                  {/* VEHICLE FLEET MULTI SELECTOR */}
                  {playMode !== "BYOC" && (
                    <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#4c4a49]">
                        Chọn xe cho thuê ({selectedSelectableVehicles.length} đã
                        chọn) <span className="text-rose-500">*</span>
                      </label>

                      {!selectedSlot ? (
                        <div className="rounded-xl border border-dashed border-[#e5e2e1] bg-[#fcf8f8] px-4 py-6 text-center text-xs text-[#6b7280]">
                          Chọn slot trước để xem các xe thực sự còn có thể thuê.
                        </div>
                      ) : loadingVehicles ||
                        isLoadingSelectedSlotAvailability ? (
                        <div className="h-20 animate-pulse bg-[#fcf8f8] border border-[#e5e2e1] rounded-xl" />
                      ) : (
                        <div
                          className={cn(
                            "max-h-[26rem] space-y-2 overflow-y-auto rounded-xl border bg-[#fcf8f8] p-2",
                            fieldErrors.vehicleIds
                              ? "border-rose-400"
                              : "border-[#e5e2e1]",
                          )}
                        >
                          {selectableVehicles.map((unit) => {
                            const isSelected = selectedSelectableVehicles.some(
                              (v) => v.id === unit.id,
                            )
                            const hourlyRate = unit.catalog?.hourlyRate

                            return (
                              <button
                                type="button"
                                key={unit.id}
                                aria-pressed={isSelected}
                                onClick={() => {
                                  toggleVehicle(unit)
                                  setFieldErrors((current) => ({
                                    ...current,
                                    vehicleIds: undefined,
                                  }))
                                }}
                                className={cn(
                                  "flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ea580c]",
                                  isSelected
                                    ? "border-[#ea580c] bg-[#fff3eb] shadow-sm"
                                    : "border-[#e5e2e1] bg-white hover:border-[#f1a77d] hover:bg-[#fffaf7]",
                                )}
                              >
                                <VehicleThumbnail unit={unit} />
                                <div className="min-w-0 flex-1 space-y-1">
                                  <div className="flex min-w-0 items-center justify-between gap-2">
                                    <p className="truncate text-sm font-bold text-[#1c1b1b]">
                                      {unit.catalog?.name || unit.identifier}
                                    </p>
                                    {isSelected && (
                                      <span className="shrink-0 rounded-full bg-[#ea580c] px-2 py-0.5 text-[10px] font-bold text-white">
                                        Đã chọn
                                      </span>
                                    )}
                                  </div>
                                  <p
                                    className="truncate text-xs font-medium text-[#6b7280]"
                                    title={unit.identifier}
                                  >
                                    Mã xe: {unit.identifier}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                                    {unit.color && (
                                      <span className="rounded-full bg-[#f5f3f2] px-2 py-0.5 font-medium text-[#4c4a49]">
                                        {unit.color}
                                      </span>
                                    )}
                                    <span className="font-bold text-[#ea580c]">
                                      {hourlyRate != null
                                        ? `${formatCurrency(hourlyRate)}/giờ`
                                        : "Chưa cập nhật giá"}
                                    </span>
                                  </div>
                                </div>
                              </button>
                            )
                          })}

                          {selectableVehicles.length === 0 && (
                            <p className="py-6 text-center text-xs text-[#6b7280] italic">
                              Không còn xe phù hợp và trống cho slot/sân này.
                              Vui lòng chọn slot hoặc sân khác.
                            </p>
                          )}
                        </div>
                      )}
                      {fieldErrors.vehicleIds && (
                        <p className="text-xs font-medium text-rose-600">
                          {fieldErrors.vehicleIds}
                        </p>
                      )}
                      <p className="text-[11px] leading-relaxed text-[#6b7280]">
                        Chỉ hiển thị xe có thể chọn trong khung giờ này.
                      </p>
                    </div>
                  )}

                  {/* CAPACITY WARNING */}
                  <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-700">
                      <ShieldCheck className="size-4 text-blue-600" />
                      Kiểm tra an toàn & Công suất đường đua
                    </div>
                    <p className="text-[11px] text-blue-900 leading-relaxed font-semibold">
                      Hệ thống tự động kiểm tra tính sẵn sàng của đường đua{" "}
                      <strong>{selectedTrackName || "đã chọn"}</strong> để tránh
                      chồng chéo các ca chạy cùng lúc.
                    </p>
                  </div>

                  {/* BILLING BREAKDOWN PREVIEW */}
                  <div className="rounded-lg border border-[#e5e2e1] bg-[#fcf8f8] p-4 space-y-2">
                    <h5 className="text-xs font-extrabold uppercase tracking-wider text-[#6b7280]">
                      Chi tiết hóa đơn dự kiến
                    </h5>

                    {isLoadingCafe ? (
                      <div className="flex items-center gap-2 text-xs text-[#6b7280] py-2 animate-pulse font-semibold">
                        <Loader2 className="size-3.5 animate-spin text-[#ea580c]" />
                        Đang tải thông tin giá...
                      </div>
                    ) : (
                      <div className="space-y-1.5 text-xs font-bold">
                        <div className="flex justify-between text-[#4c4a49]">
                          <span>
                            Phí giờ chơi ({slotCount} slots x{" "}
                            {slotFeeRate.toLocaleString("vi-VN")} đ)
                          </span>
                          <span>{slotFeeTotal.toLocaleString("vi-VN")} đ</span>
                        </div>
                        {playMode !== "BYOC" && (
                          <div className="flex justify-between text-[#4c4a49]">
                            <span>
                              Phí thuê xe ({selectedSelectableVehicles.length}{" "}
                              xe)
                            </span>
                            <span>
                              {rentalFeeTotal.toLocaleString("vi-VN")} đ
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between text-[#1c1b1b] border-t border-[#e5e2e1] pt-2">
                          <span>Tổng thanh toán tại quầy:</span>
                          <span className="text-[#ea580c] text-sm font-black">
                            {totalAmount.toLocaleString("vi-VN")} đ
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </aside>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col-reverse gap-3 border-t border-[#e5e2e1] pt-5 sm:flex-row">
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
                <StaffButton
                  type="submit"
                  variant="primary"
                  className="flex-1 uppercase tracking-wider"
                  disabled={
                    isLoadingCafe ||
                    !cafeDetails ||
                    isClosedToday ||
                    !isScheduleConfigured
                  }
                >
                  {isLoadingCafe ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Đang tải...
                    </>
                  ) : (
                    "Khởi tạo & Nhận ca chạy"
                  )}
                </StaffButton>
              </div>
            </form>
          </StaffCard>
        </div>
      )}
    </div>
  )
}

function buildSlotsFromAvailability(
  hourlyData: HourlySlotAvailability[],
  playMode: "RENTAL" | "BYOC",
): DailySlot[] {
  return hourlyData.map(({ hour, data }) => {
    const startTime = `${String(hour).padStart(2, "0")}:00`
    const endTime = `${String(hour + 1).padStart(2, "0")}:00`
    if (!data) {
      return {
        id: startTime,
        startTime,
        endTime,
        status: "booked" as DailySlotStatus,
        remaining: 0,
        rentalCount: 0,
        byocRemaining: 0,
        capacityKind: playMode === "RENTAL" ? "rental_vehicle" : "byoc_spot",
      }
    }

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
      capacityKind: playMode === "RENTAL" ? "rental_vehicle" : "byoc_spot",
    }
  })
}
