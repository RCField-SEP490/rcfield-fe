import { ChevronLeft } from "lucide-react"
import { useMemo, useState, useEffect } from "react"
import { Link, useSearchParams } from "react-router"
import type { BookingMode } from "@/features/booking/data/booking-options"
import { bookingCatalog } from "@/features/booking/data/booking-options"
import type {
  CheckoutStep,
  CustomerPaymentMethod,
  CustomerPlayMode,
  PaymentComponentLine,
} from "@/features/customer-booking/data/customer-booking-demo"
import { menuApi, menuQueryKeys } from "@/features/menu/api/menu.api"
import type { Cafe } from "@/shared/data/explore-data"
import { Button } from "@/shared/ui/button"
import { useQuery } from "@tanstack/react-query"
import { cafeApi, cafeQueryKeys } from "@/features/cafes/api/cafe.api"
import { vehicleApi } from "@/features/vehicles/api/vehicle.api"
import { vehicleKeys } from "@/features/vehicles/constants/queryKeys"
import {
  mapCafeToExploreCafe,
  mapCatalogToExploreVehicle,
} from "@/features/cafes/lib/cafe.mappers"
import { useAuthStore } from "@/features/auth/stores/auth.store"
import {
  pricingApi,
  pricingQueryKeys,
} from "@/features/pricing/api/pricing.api"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog"
import { CheckoutStepper } from "./components/checkout/CheckoutStepper"
import { CheckoutSummaryCard } from "./components/checkout/CheckoutSummaryCard"
import { FnbStep } from "./components/checkout/FnbStep"
import {
  ParticipantsStep,
  type Companion,
  isPhoneOkOrEmpty,
} from "./components/checkout/ParticipantsStep"
import { PaymentStep } from "./components/checkout/PaymentStep"
import { TrackSelectionStep } from "./components/checkout/TrackSelectionStep"
import { BookingPackageSelector } from "./components/checkout/BookingPackageSelector"
import type { AppliedPromo } from "./components/checkout/PromoCodeInput"
import type { TrackConfig } from "@/features/cafes/types"
import {
  useAvailability,
  useCreateBooking,
  useCreateCheckout,
  toVietnamSlotISOString,
} from "@/features/booking/hooks/use-booking"
import { bookingApi } from "@/features/booking/api/booking.api"
import { toast } from "sonner"
import { LoginPromptDialog } from "./components/LoginPromptDialog"

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const
const EMPTY_BOOKING_CAFE: Cafe = {
  id: "",
  name: "",
  slug: "",
  rating: 0,
  reviewsCount: 0,
  address: "",
  district: "",
  city: "",
  image: "",
  priceRange: "",
  trackTypes: [],
  features: [],
  description: "",
  coordinates: { x: 0, y: 0 },
  availableVehicles: [],
  operatingHours: {},
}

function getVietnamToday(): string {
  return new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

// "track" step now includes date + slot selection — no separate "schedule" step
const ALL_STEPS: CheckoutStep[] = ["track", "participants", "fnb", "payment"]
const STEPS_WITHOUT_SCHEDULE: CheckoutStep[] = ALL_STEPS

export function CreateBookingPage() {
  const [searchParams] = useSearchParams()
  const authRole = useAuthStore((state) => state.role)
  const requestedCafeId = searchParams.get("cafeId")
  const cafeId = requestedCafeId ?? ""
  const vehicleId = searchParams.get("vehicleId") ?? undefined
  const modeParam = searchParams.get("mode") as BookingMode | null

  const isMockId = cafeId.startsWith("cafe-")

  // Fetch real cafe data if not a mock ID
  const {
    data: realCafe,
    isLoading: isLoadingRealCafe,
    isError: isRealCafeError,
  } = useQuery({
    queryKey: cafeQueryKeys.detail(isMockId ? undefined : cafeId),
    queryFn: () => cafeApi.getCafe(cafeId),
    enabled: !isMockId && !!cafeId,
  })

  // Fetch cafe images if real cafe is loaded
  const { data: cafeImages = [] } = useQuery({
    queryKey: cafeQueryKeys.images(isMockId ? undefined : cafeId),
    queryFn: () => cafeApi.listCafeImages(cafeId),
    enabled: !isMockId && !!cafeId,
  })

  // Fetch real catalogs data
  const { data: catalogs = [] } = useQuery({
    queryKey: ["cafe-catalogs", isMockId ? undefined : cafeId],
    queryFn: () => vehicleApi.listCatalogs(cafeId),
    enabled: !isMockId && !!cafeId,
  })

  // Fetch units for thumbnail strip in vehicle picker
  const { data: pickerUnits = [], isLoading: isLoadingPickerUnits } = useQuery({
    queryKey: vehicleKeys.units(cafeId, { status: "AVAILABLE" }),
    queryFn: () => vehicleApi.listUnits(cafeId, { status: "AVAILABLE" }),
    enabled: !isMockId && !!cafeId,
  })

  // Fetch real menu items
  const { data: menuData, isLoading: menuLoading } = useQuery({
    queryKey: menuQueryKeys.list(isMockId ? undefined : cafeId, {
      available: true,
    }),
    queryFn: () =>
      menuApi.listMenuItems(cafeId, { available: true, limit: 50 }),
    enabled: !isMockId && !!cafeId,
  })
  const menuItems = useMemo(() => menuData?.data ?? [], [menuData?.data])

  const cafe = useMemo(() => {
    if (!isMockId && realCafe) {
      const mapped = mapCafeToExploreCafe(realCafe, cafeImages)
      if (catalogs && catalogs.length > 0) {
        mapped.availableVehicles = catalogs.map(mapCatalogToExploreVehicle)
      }
      return mapped
    }
    // Chỉ là giá trị trung tính để các hook luôn được gọi theo đúng thứ tự.
    // Nó không bao giờ được render hoặc dùng để tạo đơn.
    return EMPTY_BOOKING_CAFE
  }, [isMockId, realCafe, cafeImages, catalogs])

  // Parse F&B quantities from URL e.g. "fnb-1:2,fnb-2:1"
  const parseFnbParam = (param: string | null): Record<string, number> => {
    if (!param) return {}
    const res: Record<string, number> = {}
    param.split(",").forEach((pair) => {
      const [id, qtyStr] = pair.split(":")
      if (id && qtyStr) {
        const qty = parseInt(qtyStr, 10)
        if (!isNaN(qty) && qty > 0) {
          res[id] = qty
        }
      }
    })
    return res
  }

  // Khi có date + slot từ cafe detail → bỏ schedule step
  const hasPreselectedSlot = !!(
    searchParams.get("date") && searchParams.get("slot")
  )
  const orderedSteps = hasPreselectedSlot ? STEPS_WITHOUT_SCHEDULE : ALL_STEPS

  const stepParam = searchParams.get("step") as CheckoutStep | null
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(
    orderedSteps.includes(stepParam!) ? stepParam! : orderedSteps[0],
  )
  const [mode] = useState<BookingMode>(modeParam ?? "hourly")
  const [planId] = useState(getDefaultPlanId(modeParam ?? "hourly"))
  const [date, setDate] = useState(
    searchParams.get("date") ?? getVietnamToday(),
  )
  const [time, setTime] = useState(
    searchParams.get("slot") ?? bookingCatalog.timeOptions[0],
  )
  const [preselectedSlotEnd, setPreselectedSlotEnd] = useState(
    searchParams.get("slotEnd") ?? null,
  )
  const [playMode, setPlayMode] = useState<CustomerPlayMode>("RENTAL")
  const [participants, setParticipants] = useState(1)
  const [companions, setCompanions] = useState<Companion[]>([])
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>(
    vehicleId ? [vehicleId] : [],
  )
  const [fnbQuantities, setFnbQuantities] = useState<Record<string, number>>(
    () => parseFnbParam(searchParams.get("fnb")),
  )
  const [paymentMethod, setPaymentMethod] =
    useState<CustomerPaymentMethod>("vnpay")
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
    null,
  )
  const [selectedTrackConfig, setSelectedTrackConfig] =
    useState<TrackConfig | null>(null)
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null)

  const [pendingPlayMode, setPendingPlayMode] =
    useState<CustomerPlayMode | null>(null)
  const configuredSlotDuration = Number(cafe.slotDurationMinutes)
  const slotDurationMinutes =
    Number.isInteger(configuredSlotDuration) && configuredSlotDuration > 0
      ? configuredSlotDuration
      : 0

  const { openHour, closeHour, isScheduleConfigured } = useMemo(() => {
    const dayKey = DAY_KEYS[new Date(date).getDay()]
    const hours = (
      cafe.operatingHours as
        | Record<string, { open?: string; close?: string }>
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
    const configuredCloseHour = parseHour(hours?.close)
    return {
      openHour: configuredOpenHour ?? 0,
      closeHour: configuredCloseHour ?? 0,
      isScheduleConfigured:
        configuredOpenHour !== null &&
        configuredCloseHour !== null &&
        configuredCloseHour > configuredOpenHour &&
        slotDurationMinutes > 0,
    }
  }, [date, cafe.operatingHours, slotDurationMinutes])

  // Deselect incompatible vehicles when track config changes
  useEffect(() => {
    if (selectedTrackConfig && selectedVehicleIds.length > 0) {
      queueMicrotask(() => {
        setSelectedVehicleIds((prev) =>
          prev.filter((vehicleId) => {
            const catalogId =
              pickerUnits.find((unit) => unit.id === vehicleId)?.catalogId ??
              vehicleId
            const vehicle = cafe.availableVehicles.find(
              (v) => v.id === catalogId,
            )
            if (!vehicle) return false
            const compat = vehicle.compatibleTrackTypes
            return (
              !compat ||
              compat.length === 0 ||
              compat.some(
                (t) =>
                  t.id === selectedTrackConfig.track_type_id ||
                  t.code === selectedTrackConfig.track_type?.code,
              )
            )
          }),
        )
      })
    }
  }, [
    selectedTrackConfig,
    selectedVehicleIds.length,
    cafe.availableVehicles,
    pickerUnits,
  ])

  const handlePlayModeChange = (mode: CustomerPlayMode) => {
    if (mode === "BYOC" && selectedVehicleIds.length > 0) {
      setPendingPlayMode("BYOC")
      return
    }
    setPlayMode(mode)
    if (mode === "BYOC") setSelectedVehicleIds([])
  }

  const confirmSwitchToBYOC = () => {
    setPlayMode("BYOC")
    setSelectedVehicleIds([])
    setPendingPlayMode(null)
  }

  const createBookingMutation = useCreateBooking()
  const createCheckoutMutation = useCreateCheckout()
  const isSubmitting =
    createBookingMutation.isPending || createCheckoutMutation.isPending

  // BYOC capacity check — only for real cafes when a time slot is selected
  const slotStartForCheck = toVietnamSlotISOString(date, time)
  const slotEndForCheck = preselectedSlotEnd
    ? toVietnamSlotISOString(date, preselectedSlotEnd)
    : buildSlotEnd(date, time, mode, planId)
  const hasValidSelectedSlot = !!slotStartForCheck && !!slotEndForCheck
  const { data: availabilityData } = useAvailability(
    cafeId,
    {
      slot_start: slotStartForCheck,
      slot_end: slotEndForCheck,
      play_mode: "BYOC",
      ...(selectedTrackConfig
        ? { track_config_id: selectedTrackConfig.id }
        : {}),
    },
    !isMockId && hasValidSelectedSlot,
  )
  const {
    data: rentalAvailabilityData,
    isLoading: isLoadingRentalAvailability,
  } = useAvailability(
    cafeId,
    {
      slot_start: slotStartForCheck,
      slot_end: slotEndForCheck,
      play_mode: "RENTAL",
      ...(selectedTrackConfig
        ? { track_config_id: selectedTrackConfig.id }
        : {}),
    },
    !isMockId && hasValidSelectedSlot && !!selectedTrackConfig,
  )
  const byocRemaining = availabilityData?.byoc_remaining
  const isByocFull =
    playMode === "BYOC" && byocRemaining !== undefined && byocRemaining === 0
  const effectiveParticipants =
    playMode === "BYOC" && byocRemaining !== undefined
      ? Math.min(participants, Math.max(1, byocRemaining))
      : participants
  const effectiveCompanions = companions.slice(0, effectiveParticipants - 1)

  const selectableVehicleIds = useMemo(
    () =>
      rentalAvailabilityData?.vehicles.map((vehicle) => vehicle.vehicle_id) ??
      [],
    [rentalAvailabilityData],
  )
  const selectableVehicleIdSet = useMemo(
    () => new Set(selectableVehicleIds),
    [selectableVehicleIds],
  )
  const selectablePickerUnits = useMemo(
    () => pickerUnits.filter((unit) => selectableVehicleIdSet.has(unit.id)),
    [pickerUnits, selectableVehicleIdSet],
  )

  useEffect(() => {
    if (!rentalAvailabilityData || selectedVehicleIds.length === 0) return
    queueMicrotask(() => {
      setSelectedVehicleIds((current) =>
        current.filter((id) => selectableVehicleIdSet.has(id)),
      )
    })
  }, [
    rentalAvailabilityData,
    selectableVehicleIdSet,
    selectedVehicleIds.length,
  ])

  // Dynamic pricing preview — fetch when slot is selected on a real cafe
  const { data: pricingPreview } = useQuery({
    queryKey: pricingQueryKeys.preview(
      cafeId,
      slotStartForCheck,
      slotEndForCheck,
    ),
    queryFn: () =>
      pricingApi.getPricingPreview(cafeId, slotStartForCheck, slotEndForCheck),
    enabled: !isMockId && hasValidSelectedSlot,
  })
  const slotMultiplier = pricingPreview?.multiplier ?? 1
  const pricingLabel = pricingPreview?.label ?? null
  const effectivePricePerHour =
    pricingPreview?.effective_price_per_hour ?? cafe.slotFeeRate ?? 0

  const selectedVehicles = useMemo(
    () =>
      selectedVehicleIds.flatMap((id) => {
        const catalogId =
          pickerUnits.find((unit) => unit.id === id)?.catalogId ?? id
        const catalog = cafe.availableVehicles.find(
          (vehicle) => vehicle.id === catalogId,
        )
        return catalog ? [catalog] : []
      }),
    [cafe.availableVehicles, pickerUnits, selectedVehicleIds],
  )
  const fnbTotal = useMemo(
    () =>
      menuItems.reduce((sum, item) => {
        const price =
          typeof item.price === "string" ? parseFloat(item.price) : item.price
        return sum + price * (fnbQuantities[item.id] ?? 0)
      }, 0),
    [fnbQuantities, menuItems],
  )

  const numSlots = useMemo(() => {
    if (!time || !preselectedSlotEnd) return 1
    const [sh, sm] = time.split(":").map(Number)
    const [eh, em] = preselectedSlotEnd.split(":").map(Number)
    const diffMinutes = eh * 60 + em - (sh * 60 + sm)
    if (!slotDurationMinutes) return 0
    return Math.max(1, Math.round(diffMinutes / slotDurationMinutes))
  }, [time, preselectedSlotEnd, slotDurationMinutes])

  const paymentComponents = useMemo(() => {
    const components = buildPaymentComponents({
      mode,
      planId,
      slotFeeRate: effectivePricePerHour,
      selectedVehicles,
      fnbTotal,
      numSlots,
      playerCount: effectiveParticipants,
      slotDurationMinutes,
    })
    if (selectedPackageId) {
      return components.map((c) => {
        if (c.type !== "SLOT_FEE") return c
        const perPersonFee =
          effectiveParticipants > 0 ? c.amount / effectiveParticipants : 0
        const companionFee =
          perPersonFee * Math.max(0, effectiveParticipants - 1)
        const label =
          effectiveParticipants > 1
            ? `Phí lịch chơi (×${effectiveParticipants - 1} người) + Gói slot`
            : c.label + " (Gói slot)"
        return { ...c, amount: companionFee, label }
      })
    }
    return components
  }, [
    effectivePricePerHour,
    fnbTotal,
    mode,
    planId,
    selectedVehicles,
    slotDurationMinutes,
    numSlots,
    effectiveParticipants,
    selectedPackageId,
  ])

  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  const handleNext = () => {
    if (currentStep === "track" && !isScheduleConfigured) {
      toast.error(
        "Cơ sở chưa cấu hình giờ hoạt động hoặc thời lượng slot hợp lệ.",
      )
      return
    }
    if (currentStep === "track" && !hasValidSelectedSlot) {
      toast.error("Vui lòng chọn ngày và khung giờ hợp lệ.")
      return
    }
    if (!authRole) {
      setShowLoginPrompt(true)
      return
    }
    if (authRole !== "customer") {
      toast.error("Vui lòng đăng nhập bằng tài khoản khách hàng để đặt lịch.")
      return
    }
    const index = orderedSteps.indexOf(currentStep)
    setCurrentStep(orderedSteps[Math.min(index + 1, orderedSteps.length - 1)])
  }

  const handleBack = () => {
    const index = orderedSteps.indexOf(currentStep)
    setCurrentStep(orderedSteps[Math.max(index - 1, 0)])
  }

  const handleConfirmPayment = async () => {
    if (authRole !== "customer") {
      toast.error(
        "TÃ i khoáº£n hiá»‡n táº¡i khÃ´ng cÃ³ quyá»n Ä‘áº·t lá»‹ch. Vui lÃ²ng Ä‘Äƒng nháº­p báº±ng tÃ i khoáº£n khÃ¡ch hÃ ng.",
      )
      return
    }
    if (isMockId) {
      toast.error(
        "Không thể đặt lịch với dữ liệu demo. Vui lòng chọn một cơ sở thực tế.",
      )
      return
    }
    if (!isScheduleConfigured) {
      toast.error(
        "Cơ sở chưa cấu hình giờ hoạt động hoặc thời lượng slot hợp lệ.",
      )
      return
    }
    if (!hasValidSelectedSlot) {
      toast.error("Vui lòng chọn ngày và khung giờ hợp lệ.")
      return
    }
    if (
      playMode === "BYOC" &&
      byocRemaining !== undefined &&
      byocRemaining === 0
    ) {
      toast.error(
        "Khung giờ này đã hết chỗ cho xe tự mang. Vui lòng chọn khung giờ khác.",
      )
      return
    }
    try {
      const slotStart = toVietnamSlotISOString(date, time)
      const slotEnd = preselectedSlotEnd
        ? toVietnamSlotISOString(date, preselectedSlotEnd)
        : buildSlotEnd(date, time, mode, planId)
      const vehicleIds = selectedVehicleIds.filter((id) => UUID_REGEX.test(id))

      // Build companion participants — booker is auto-inserted by backend as BOOKER type
      const participantList = effectiveCompanions.map((c) => ({
        participant_type: "WALK_IN_GUEST" as const,
        ...(c.name ? { guest_name: c.name } : {}),
        ...(c.phone ? { guest_phone: c.phone } : {}),
      }))

      const booking = await createBookingMutation.mutateAsync({
        cafe_id: cafeId,
        play_mode: playMode === "RENTAL" ? "RENTAL" : "BYOC",
        slot_start: slotStart,
        slot_end: slotEnd,
        vehicle_ids: vehicleIds,
        participants: participantList,
        fnb_items: Object.entries(fnbQuantities)
          .filter(([, qty]) => qty > 0)
          .map(([menu_item_id, quantity]) => ({ menu_item_id, quantity })),
        ...(selectedTrackConfig
          ? {
              track_type_id: selectedTrackConfig.track_type_id,
              track_config_id: selectedTrackConfig.id,
            }
          : {}),
        ...(selectedPackageId
          ? { customer_package_id: selectedPackageId }
          : {}),
        ...(appliedPromo ? { promotion_code: appliedPromo.code } : {}),
      })

      const checkout = await createCheckoutMutation.mutateAsync(
        booking.booking_id,
      )
      if (checkout.confirmed) {
        // Zero-total: package covered slot_fee and no other charges — already confirmed
        toast.success("Đặt lịch thành công! Gói slot đã được áp dụng.")
        window.location.href = "/customer/bookings"
        return
      }
      window.location.href = checkout.payment_url!
    } catch (err) {
      let message = "Vui lòng thử lại."
      // Check backend error codes for specific user-facing messages
      const axiosErr = err as {
        response?: {
          data?: {
            code?: string
            message?: string
            errors?: Array<{ field?: string; message?: string }>
          }
        }
      }
      const code = axiosErr?.response?.data?.code
      const backendMessage = axiosErr?.response?.data?.message
      const validationMessage = axiosErr?.response?.data?.errors
        ?.map((item) => `${item.field}: ${item.message}`)
        .join(", ")
      message =
        backendMessage ??
        validationMessage ??
        (err instanceof Error ? err.message : message)
      if (
        code === "UNAUTHORIZED" ||
        code === "TOKEN_INVALID" ||
        code === "TOKEN_EXPIRED"
      ) {
        toast.error(
          "PhiÃªn Ä‘Äƒng nháº­p khÃ´ng há»£p lá»‡. Vui lÃ²ng Ä‘Äƒng nháº­p láº¡i báº±ng tÃ i khoáº£n khÃ¡ch hÃ ng.",
        )
        return
      }
      if (code === "FORBIDDEN") {
        toast.error(
          "TÃ i khoáº£n hiá»‡n táº¡i khÃ´ng cÃ³ quyá»n Ä‘áº·t lá»‹ch. Vui lÃ²ng dÃ¹ng tÃ i khoáº£n khÃ¡ch hÃ ng.",
        )
        return
      }
      if (code === "VEHICLE_TRACK_INCOMPATIBLE") {
        toast.error(
          "Xe bạn chọn không tương thích với loại sân này. Vui lòng chọn xe khác.",
        )
        return
      }
      if (code === "TRACK_CONFIG_NOT_FOUND") {
        toast.error(
          "Loại sân không còn hoạt động. Vui lòng quay lại và chọn loại sân khác.",
        )
        return
      }
      if (code === "BYOC_CAPACITY_FULL") {
        toast.error(
          "Khung giờ này đã hết chỗ cho xe tự mang. Vui lòng chọn giờ khác.",
        )
        return
      }
      if (code === "MIN_BOOKING_NOTICE_NOT_MET") {
        toast.error(
          `Cơ sở yêu cầu đặt trước tối thiểu ${cafe.minBookingNoticeMinutes ?? 0} phút. Vui lòng chọn slot khác.`,
        )
        return
      }
      toast.error(`Không thể tạo đơn đặt lịch. ${message}`)
      console.error("[CreateBooking]", err)
    }
  }

  const handleMockPayment = async () => {
    if (authRole !== "customer") {
      toast.error("Vui lòng đăng nhập bằng tài khoản khách hàng.")
      return
    }
    if (isMockId) {
      toast.error(
        "Không thể đặt lịch với dữ liệu demo. Vui lòng chọn một cơ sở thực tế.",
      )
      return
    }
    if (!isScheduleConfigured) {
      toast.error(
        "Cơ sở chưa cấu hình giờ hoạt động hoặc thời lượng slot hợp lệ.",
      )
      return
    }
    if (!hasValidSelectedSlot) {
      toast.error("Vui lòng chọn ngày và khung giờ hợp lệ.")
      return
    }
    try {
      const slotStart = toVietnamSlotISOString(date, time)
      const slotEnd = preselectedSlotEnd
        ? toVietnamSlotISOString(date, preselectedSlotEnd)
        : buildSlotEnd(date, time, mode, planId)
      const vehicleIds = selectedVehicleIds.filter((id) => UUID_REGEX.test(id))
      const participantList = effectiveCompanions.map((c) => ({
        participant_type: "WALK_IN_GUEST" as const,
        ...(c.name ? { guest_name: c.name } : {}),
        ...(c.phone ? { guest_phone: c.phone } : {}),
      }))

      const booking = await createBookingMutation.mutateAsync({
        cafe_id: cafeId,
        play_mode: playMode === "RENTAL" ? "RENTAL" : "BYOC",
        slot_start: slotStart,
        slot_end: slotEnd,
        vehicle_ids: vehicleIds,
        participants: participantList,
        fnb_items: Object.entries(fnbQuantities)
          .filter(([, qty]) => qty > 0)
          .map(([menu_item_id, quantity]) => ({ menu_item_id, quantity })),
        ...(selectedTrackConfig
          ? {
              track_type_id: selectedTrackConfig.track_type_id,
              track_config_id: selectedTrackConfig.id,
            }
          : {}),
        ...(selectedPackageId
          ? { customer_package_id: selectedPackageId }
          : {}),
        ...(appliedPromo ? { promotion_code: appliedPromo.code } : {}),
      })

      await bookingApi.mockCheckout(booking.booking_id)
      toast.success("Mock thanh toán thành công!", {
        description: "Booking đã được xác nhận.",
      })
      window.location.href = "/customer/bookings"
    } catch (err) {
      const response = (
        err as { response?: { data?: { code?: string; message?: string } } }
      )?.response?.data
      if (response?.code === "MIN_BOOKING_NOTICE_NOT_MET") {
        toast.error(
          `Cơ sở yêu cầu đặt trước tối thiểu ${cafe.minBookingNoticeMinutes ?? 0} phút. Vui lòng chọn slot khác.`,
        )
        return
      }
      const msg = response?.message
      toast.error(msg ?? "Mock thanh toán thất bại. Vui lòng thử lại.")
      console.error("[MockPayment]", err)
    }
  }

  if (!requestedCafeId) {
    return (
      <BookingUnavailableState message="Vui lòng chọn một cơ sở trước khi bắt đầu đặt lịch." />
    )
  }

  if (isMockId) {
    return (
      <BookingUnavailableState message="Dữ liệu minh họa không hỗ trợ tạo đơn. Vui lòng chọn một cơ sở thực tế." />
    )
  }

  if (isLoadingRealCafe) {
    return <BookingUnavailableState message="Đang tải thông tin cơ sở..." />
  }

  if (isRealCafeError || !realCafe) {
    return (
      <BookingUnavailableState message="Không tìm thấy cơ sở này hoặc cơ sở hiện không thể nhận đặt lịch." />
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <section className="border-b bg-background">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 md:px-6">
          <Button asChild variant="ghost" className="-ml-3 mb-3 gap-2">
            <Link to={`/cafes/${cafe.slug}`}>
              <ChevronLeft className="h-4 w-4" /> Quay lại cơ sở
            </Link>
          </Button>
          <div className="mb-4">
            <p className="text-sm font-medium text-muted-foreground">
              RCField Checkout
            </p>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Hoàn tất đặt lịch chạy RC
            </h1>
          </div>
          <CheckoutStepper
            currentStep={currentStep}
            visibleSteps={orderedSteps}
          />
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-5 md:px-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <main className="min-w-0">
          {currentStep !== "track" && !isMockId && (
            <BookingPackageSelector
              cafeId={cafeId}
              playMode={playMode === "RENTAL" ? "RENTAL" : "BYOC"}
              slotsNeeded={numSlots}
              slotFeeRate={cafe.slotFeeRate ?? 0}
              selectedPackageId={selectedPackageId}
              onPackageSelect={setSelectedPackageId}
            />
          )}
          {currentStep === "track" &&
            (selectedVehicleIds.length > 0 ||
              Object.values(fnbQuantities).some((q) => q > 0)) && (
              <PreSelectionBanner
                vehicleName={selectedVehicles[0]?.name}
                vehicleCount={selectedVehicleIds.length}
                fnbCount={Object.values(fnbQuantities).reduce(
                  (s, q) => s + q,
                  0,
                )}
              />
            )}
          {currentStep === "track" && (
            <TrackSelectionStep
              cafeId={isMockId ? "" : cafeId}
              date={date}
              setDate={setDate}
              selectedSlot={time}
              setSelectedSlot={setTime}
              selectedSlotEnd={preselectedSlotEnd}
              setSelectedSlotEnd={setPreselectedSlotEnd}
              selectedTrackConfig={selectedTrackConfig}
              onSelectTrack={setSelectedTrackConfig}
              slotDurationMinutes={slotDurationMinutes}
              minBookingNoticeMinutes={cafe.minBookingNoticeMinutes ?? 0}
              playMode={playMode === "RENTAL" ? "RENTAL" : "BYOC"}
              onPlayModeChange={handlePlayModeChange}
              effectivePricePerHour={
                isMockId ? undefined : effectivePricePerHour
              }
              pricingLabel={isMockId ? undefined : pricingLabel}
              openHour={openHour}
              closeHour={closeHour}
              isScheduleConfigured={isScheduleConfigured}
            />
          )}
          {currentStep === "participants" && (
            <ParticipantsStep
              cafe={cafe}
              playMode={playMode}
              onPlayModeChange={handlePlayModeChange}
              participants={effectiveParticipants}
              onParticipantsChange={setParticipants}
              companions={effectiveCompanions}
              onCompanionsChange={setCompanions}
              selectedVehicleIds={selectedVehicleIds}
              onVehicleSelect={setSelectedVehicleIds}
              byocRemaining={byocRemaining}
              selectedTrackConfig={selectedTrackConfig}
              catalogUnits={isMockId ? undefined : selectablePickerUnits}
              selectableVehicleIds={isMockId ? undefined : selectableVehicleIds}
              isVehicleAvailabilityLoading={
                !isMockId &&
                (isLoadingRentalAvailability || isLoadingPickerUnits)
              }
            />
          )}
          {currentStep === "fnb" && (
            <FnbStep
              menuItems={menuItems}
              isLoading={menuLoading}
              quantities={fnbQuantities}
              onQuantityChange={(itemId, quantity) =>
                setFnbQuantities((current) => ({
                  ...current,
                  [itemId]: quantity,
                }))
              }
            />
          )}
          {currentStep === "payment" && (
            <PaymentStep
              paymentMethod={paymentMethod}
              onPaymentMethodChange={setPaymentMethod}
              selectedPackageId={selectedPackageId}
              cafeId={isMockId ? undefined : cafeId}
              playMode={playMode === "RENTAL" ? "RENTAL" : "BYOC"}
              slotStart={slotStartForCheck}
              subtotal={paymentComponents
                .filter((c) => c.type === "SLOT_FEE" || c.type === "RENTAL_FEE")
                .reduce((s, c) => s + c.amount, 0)}
              appliedPromo={appliedPromo}
              onPromoApply={setAppliedPromo}
              onMockPayment={() => void handleMockPayment()}
            />
          )}
        </main>

        <CheckoutSummaryCard
          cafe={cafe}
          mode={mode}
          playMode={playMode}
          date={date}
          time={preselectedSlotEnd ? `${time} – ${preselectedSlotEnd}` : time}
          selectedVehicles={selectedVehicles}
          fnbTotal={fnbTotal}
          components={paymentComponents}
          currentStep={currentStep}
          onNext={handleNext}
          onBack={handleBack}
          onConfirmPayment={() => void handleConfirmPayment()}
          isSubmitting={isSubmitting}
          pricingLabel={isMockId ? null : pricingLabel}
          slotMultiplier={isMockId ? 1 : slotMultiplier}
          discountAmount={appliedPromo?.discount_amount ?? 0}
          promoCode={appliedPromo?.code ?? null}
          isNextDisabled={
            (currentStep === "track" &&
              (!selectedTrackConfig ||
                !hasValidSelectedSlot ||
                !isScheduleConfigured)) ||
            (currentStep === "participants" && isByocFull) ||
            (currentStep === "participants" &&
              effectiveCompanions.some((c) => !c.name.trim())) ||
            (currentStep === "participants" &&
              effectiveCompanions.some((c) => !isPhoneOkOrEmpty(c.phone))) ||
            (currentStep === "participants" &&
              playMode === "RENTAL" &&
              selectedVehicleIds.length < participants)
          }
          selectedTrackConfig={selectedTrackConfig}
        />
      </div>

      <AlertDialog
        open={!!pendingPlayMode}
        onOpenChange={(open) => !open && setPendingPlayMode(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Chuyển sang mang xe riêng?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn đang có{" "}
              <strong>
                {selectedVehicles.length > 0
                  ? selectedVehicles.map((v) => v.name).join(", ")
                  : `${selectedVehicleIds.length} xe`}
              </strong>{" "}
              đã chọn để thuê. Chuyển sang chế độ mang xe riêng sẽ xóa toàn bộ
              lựa chọn xe thuê này.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingPlayMode(null)}>
              Giữ lại xe thuê
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSwitchToBYOC}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Chuyển sang mang xe riêng
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <LoginPromptDialog
        open={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        onSuccess={() => {
          const index = orderedSteps.indexOf(currentStep)
          setCurrentStep(
            orderedSteps[Math.min(index + 1, orderedSteps.length - 1)],
          )
        }}
      />
    </div>
  )
}

function PreSelectionBanner({
  vehicleName,
  vehicleCount,
  fnbCount,
}: {
  vehicleName?: string
  vehicleCount: number
  fnbCount: number
}) {
  const parts: string[] = []
  if (vehicleCount > 0) parts.push(vehicleName ?? `${vehicleCount} xe`)
  if (fnbCount > 0) parts.push(`${fnbCount} món F&B`)
  return (
    <div className="mb-4 flex items-center gap-2 rounded-xl border border-orange-100 bg-orange-50/60 px-4 py-2.5 text-sm text-orange-800">
      <span>
        🛒 Giỏ của bạn có sẵn <strong>{parts.join(" và ")}</strong> — chọn sân &
        giờ là đặt được ngay!
      </span>
    </div>
  )
}

function BookingUnavailableState({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md rounded-2xl border bg-background p-6 text-center shadow-sm">
        <h1 className="text-lg font-semibold">Chưa thể mở trang đặt lịch</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <Button asChild className="mt-5">
          <Link to="/cafes">Chọn cơ sở</Link>
        </Button>
      </div>
    </div>
  )
}

function buildSlotEnd(
  date: string,
  time: string,
  mode: BookingMode,
  planId: string,
): string {
  let hours = 1
  if (mode === "hourly") {
    hours =
      bookingCatalog.hourlyPlans.find((p) => p.id === planId)?.durationHours ??
      1
  } else if (mode === "slotPackage") {
    const pkg = bookingCatalog.slotPackages.find((p) => p.id === planId)
    hours = pkg ? pkg.minutesPerSlot / 60 : 1
  }
  const [hh, mm] = time.split(":").map(Number)
  const totalMinutes = hh * 60 + mm + Math.round(hours * 60)
  const endHH = String(Math.floor(totalMinutes / 60)).padStart(2, "0")
  const endMM = String(totalMinutes % 60).padStart(2, "0")
  return toVietnamSlotISOString(date, `${endHH}:${endMM}`)
}

function getDefaultPlanId(mode: BookingMode) {
  if (mode === "slotPackage") return bookingCatalog.slotPackages[0].id
  if (mode === "recurring") return bookingCatalog.recurringPlans[0].id
  return bookingCatalog.hourlyPlans[0].id
}

function buildPaymentComponents({
  mode,
  planId,
  slotFeeRate,
  selectedVehicles,
  fnbTotal,
  numSlots = 1,
  playerCount = 1,
  slotDurationMinutes,
}: {
  mode: BookingMode
  planId: string
  slotFeeRate: number
  selectedVehicles: import("@/shared/data/explore-data").Vehicle[]
  fnbTotal: number
  numSlots?: number
  playerCount?: number
  slotDurationMinutes: number
}): PaymentComponentLine[] {
  const baseSlotFee =
    mode === "hourly"
      ? slotFeeRate * numSlots
      : getPlanPrice(mode, planId, slotFeeRate)
  const slotFee = baseSlotFee * playerCount
  const slotLabel =
    playerCount > 1
      ? `Phí lịch chơi (×${playerCount} người)`
      : numSlots > 1
        ? `Phí lịch chơi (${numSlots} slot)`
        : "Phí lịch chơi"
  const lines: PaymentComponentLine[] = [
    {
      id: "slot",
      type: "SLOT_FEE",
      label: slotLabel,
      amount: slotFee,
      status: "PENDING",
    },
  ]

  if (selectedVehicles.length > 0) {
    const rentalPerHour = selectedVehicles.reduce(
      (sum, v) => sum + v.pricePerHour,
      0,
    )
    // Rental fee is prorated to actual slot duration, not per-slot as 1 hour
    const totalDurationHours = numSlots * (slotDurationMinutes / 60)
    const rentalTotal = Math.round(rentalPerHour * totalDurationHours)
    const vehicleLabel =
      selectedVehicles.length === 1
        ? selectedVehicles[0].name
        : `${selectedVehicles.length} xe`
    lines.push({
      id: "rental",
      type: "RENTAL_FEE",
      label: `Phí thuê ${vehicleLabel}`,
      amount: rentalTotal,
      status: "PENDING",
    })
  }

  if (fnbTotal > 0) {
    lines.push({
      id: "fnb",
      type: "FNB_PREORDER",
      label: "F&B preorder",
      amount: fnbTotal,
      status: "PENDING",
    })
  }

  return lines
}

function getPlanPrice(mode: BookingMode, planId: string, slotFeeRate: number) {
  if (mode === "slotPackage") {
    const pkg = bookingCatalog.slotPackages.find((p) => p.id === planId)
    return pkg ? slotFeeRate * ((pkg.slots * pkg.minutesPerSlot) / 60) : 0
  }
  if (mode === "recurring") {
    return bookingCatalog.recurringPlans.find((p) => p.id === planId)
      ?.sessionsPerMonth
      ? slotFeeRate *
          bookingCatalog.recurringPlans.find((p) => p.id === planId)!
            .sessionsPerMonth
      : 0
  }
  const plan = bookingCatalog.hourlyPlans.find((p) => p.id === planId)
  return plan ? slotFeeRate * plan.durationHours : slotFeeRate
}
