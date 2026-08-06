import React, { useState, useEffect, useMemo, useCallback } from "react"
import { useParams, useNavigate, Link } from "react-router"
import { useQuery } from "@tanstack/react-query"
import {
  Clock,
  Car,
  Coffee,
  Plus,
  ArrowLeftRight,
  ChevronLeft,
  AlertTriangle,
  ClipboardCheck,
  FileText,
  HelpCircle,
  Banknote,
  CheckCircle2,
  Trophy,
  X,
} from "lucide-react"
import { routePaths } from "@/app/router/route-paths"
import { useStaffOperations } from "./context/StaffOperationContext"
import { staffApi } from "@/features/staff/api/staff.api"
import { vehicleApi } from "@/features/vehicles/api/vehicle.api"
import { menuApi } from "@/features/menu/api/menu.api"
import type { VehicleUnit } from "@/features/vehicles/types"
import type { MenuItem } from "@/features/menu/types"
import type { BookingFinancialSummary } from "@/features/booking/types/booking.types"
import { UNCATEGORIZED_LABEL } from "@/features/menu/types"
import { getApiErrorInfo } from "@/shared/lib/utils"
import { getSessionOperationalTiming } from "@/features/booking/lib/session-operational-timing"
import { useWebSocket, type WsMessage } from "@/features/notifications/hooks/useWebSocket"
import { ZoomableInspectionImage } from "@/shared/components/ZoomableInspectionImage"
import { ExtensionAuditCard } from "@/features/customer-session/components/ExtensionAuditCard"
import { toast } from "sonner"
import {
  StaffCard,
  StaffBadge,
  StaffButton,
} from "./components/StaffUI"
import type {
  CustomerBookingDetail,
  MockDamageClaim,
  MockSessionDetail,
} from "@/shared/data/customer-operational-mock-data"

type SessionView = Omit<MockSessionDetail, "damageClaim"> & {
  damageClaim?: MockDamageClaim & {
    finalCharge?: number
    damageMultiplier?: number
  }
}

type ApiBooking = Partial<CustomerBookingDetail> & {
  id?: string
  cafe?: { id?: string; name?: string; address?: string; phone?: string }
  track?: { name?: string; type?: string }
  mode?: CustomerBookingDetail["playMode"]
  paymentComponents?: CustomerBookingDetail["payment_components"]
  financial_summary?: BookingFinancialSummary
}

type SessionApiData = Partial<SessionView> & {
  sessionId?: string
  id?: string
  bookingId?: string
  actualStartAt?: string
  actualEndAt?: string
  slotEnd?: string
  booking?: ApiBooking
  financialSummary?: BookingFinancialSummary
}

export default function StaffSessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const {
    bookings,
    sessions,
    fleetStates,
    proposeExtension,
    addFnbOrder,
    updateFnbOrderStatus,
    swapSessionVehicle,
    refreshData,
  } = useStaffOperations()

  // Find corresponding session and booking from context (may be missing for COMPLETED sessions)
  const contextSession = sessions.find((s) => s.sessionId === sessionId)
  const contextBooking = contextSession ? bookings.find((b) => b.bookingId === contextSession.bookingId) : null

  // The API is authoritative for this screen. Context only renders the first
  // frame while the detail request is in flight; it can otherwise be stale
  // after an inspection, checkout, or counter-payment operation.
  const { data: apiData, isLoading: apiLoading, refetch: refetchSessionDetail } = useQuery<SessionApiData>({
    queryKey: ["staff", "session-detail", sessionId],
    queryFn: () => staffApi.getSessionDetail(sessionId!) as Promise<SessionApiData>,
    enabled: Boolean(sessionId),
    retry: false,
    refetchInterval: 15_000,
  })

  // Merge: always prefer the live API response once available.
  const session = useMemo<SessionView | null>(() => apiData ? {
    sessionId: apiData.sessionId ?? apiData.id ?? sessionId ?? "",
    bookingId: apiData.bookingId ?? apiData.booking?.bookingId ?? "",
    status: apiData.status ?? "COMPLETED",
    staffName: apiData.staffName ?? "",
    actualStart: apiData.actualStartAt ?? apiData.actualStart,
    actualEnd: apiData.actualEndAt ?? apiData.actualEnd,
    plannedEnd: apiData.plannedEnd ?? apiData.slotEnd ?? "",
    participants: apiData.participants ?? [],
    vehicles: apiData.vehicles ?? [],
    inspections: apiData.inspections ?? [],
    extensionProposal: apiData.extensionProposal,
    approvedExtensionFee: apiData.approvedExtensionFee,
    approvedExtensionMinutes: apiData.approvedExtensionMinutes,
    approvedExtensions: apiData.approvedExtensions ?? [],
    extensionPricingOptions: apiData.extensionPricingOptions ?? [],
    damageClaim: apiData.damageClaim,
    fnbOrders: apiData.fnbOrders ?? [],
  } : contextSession ?? null, [apiData, contextSession, sessionId])

  const apiBooking = apiData?.booking
  const booking = useMemo<CustomerBookingDetail | null>(() => apiBooking ? {
    bookingId: apiBooking.bookingId ?? apiBooking.id ?? "",
    shortCode: apiBooking.shortCode ?? "",
    cafeId: apiBooking.cafeId ?? apiBooking.cafe?.id ?? "",
    cafeName: apiBooking.cafeName ?? apiBooking.cafe?.name ?? "",
    cafeAddress: apiBooking.cafeAddress ?? apiBooking.cafe?.address ?? "",
    cafePhone: apiBooking.cafePhone ?? apiBooking.cafe?.phone ?? "",
    trackName: apiBooking.trackName ?? apiBooking.track?.name ?? "",
    trackType: apiBooking.trackType ?? apiBooking.track?.type ?? "",
    bookingMode: apiBooking.bookingMode ?? "SINGLE",
    playMode: apiBooking.playMode ?? apiBooking.mode ?? "RENTAL",
    status: apiBooking.status ?? "COMPLETED",
    slotStart: apiBooking.slotStart ?? "",
    slotEnd: apiBooking.slotEnd ?? "",
    slotCount: apiBooking.slotCount ?? 1,
    depositAmount: Number(apiBooking.depositAmount ?? 0),
    slotFee: Number(apiBooking.slotFee ?? 0),
    rentalFee: Number(apiBooking.rentalFee ?? 0),
    fnbPreorderFee: Number(apiBooking.fnbPreorderFee ?? 0),
    discountAmount: Number(apiBooking.discountAmount ?? 0),
    totalAmount: Number(apiBooking.totalAmount ?? 0),
    paymentStatus: apiBooking.paymentStatus ?? "UNPAID",
    source: apiBooking.source ?? "",
    payment_components: apiBooking.payment_components ?? apiBooking.paymentComponents ?? [],
    plannedParticipants: apiBooking.plannedParticipants ?? [],
    plannedVehicles: apiBooking.plannedVehicles ?? [],
    sessions: [],
  } : contextBooking ?? null, [apiBooking, contextBooking])

  // Keep the extension card responsive while the authoritative session query
  // is being refreshed. The broader "today bookings" refresh is much slower.
  const [submittedExtension, setSubmittedExtension] = useState<{ extraMinutes: number } | null>(null)
  const [submittingExtension, setSubmittingExtension] = useState(false)

  const handleSessionRealtime = useCallback((message: WsMessage) => {
    const payload = message.data as { sessionId?: string; bookingId?: string } | undefined
    if (payload?.sessionId && payload.sessionId !== sessionId) return

    if (
      [
        "CUSTOMER_CHECKOUT_CONFIRMED",
        "SESSION_CHECKOUT_COMPLETED",
        "CUSTOMER_PAYMENT_CONFIRMED",
        "BOOKING_PAYMENT_UPDATED",
        "SESSION_UPDATED",
        "SESSION_FNB_ORDER_ADDED",
        "FNB_ORDER_UPDATED",
        "CUSTOMER_INSPECTION_DISPUTED",
        "CUSTOMER_EXTENSION_APPROVED",
        "CUSTOMER_EXTENSION_REJECTED",
      ].includes(message.event)
    ) {
      if (["CUSTOMER_EXTENSION_APPROVED", "CUSTOMER_EXTENSION_REJECTED"].includes(message.event)) {
        setSubmittedExtension(null)
      }
      void refetchSessionDetail()
    }
  }, [refetchSessionDetail, sessionId])

  useWebSocket(handleSessionRealtime, Boolean(sessionId))

  const isWalkInBooking = booking?.source === "STAFF_MANUAL"
  const canDirectExtend = isWalkInBooking

  // Contest linkage — booking source CONTEST (WF-A/WF-B), contestId exposed by staff API
  const contestId =
    (contextBooking as { contestId?: string | null } | null)?.contestId ??
    (apiData as { contestId?: string | null } | undefined)?.contestId ??
    null
  const isContestBooking =
    booking?.source === "CONTEST" ||
    (apiData as { bookingSource?: string } | undefined)?.bookingSource ===
      "CONTEST" ||
    Boolean(contestId)

  // Local state controls
  const [timeLeft, setTimeLeft] = useState("")
  const [currentTime, setCurrentTime] = useState(() => Date.now())
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loadingMenu, setLoadingMenu] = useState(false)

  // Gom món theo danh mục do Provider đặt, giữ nguyên thứ tự API trả về.
  // Nhóm "Chưa phân loại" tự nằm cuối vì backend đã sắp món chưa phân loại xuống cuối.
  const menuItemGroups = useMemo(() => {
    const groups: Array<{ label: string; items: MenuItem[] }> = []
    const indexByLabel = new Map<string, number>()
    for (const item of menuItems) {
      const label = item.categoryName ?? UNCATEGORIZED_LABEL
      const existing = indexByLabel.get(label)
      if (existing === undefined) {
        indexByLabel.set(label, groups.length)
        groups.push({ label, items: [item] })
      } else {
        groups[existing].items.push(item)
      }
    }
    return groups
  }, [menuItems])
  const [availableFleet, setAvailableFleet] = useState<VehicleUnit[]>([])
  const [settlingPayment, setSettlingPayment] = useState(false)
  const [confirmSettleOpen, setConfirmSettleOpen] = useState(false)
  const [settledBookingId, setSettledBookingId] = useState<string | null>(null)

  // F&B local form state
  const [selectedItemId, setSelectedItemId] = useState("")
  const [selectedVariantId, setSelectedVariantId] = useState("")
  const [selectedQty, setSelectedQty] = useState(1)
  const [selectedFnbNote, setSelectedFnbNote] = useState("")

  // Extension mode: false = propose to customer, true = direct (staff confirms in-person)
  const [directExtensionMode, setDirectExtensionMode] = useState(false)
  const [pendingDirectExtension, setPendingDirectExtension] = useState<{ mins: number; fee: number; newPlannedEnd: string } | null>(null)
  const effectiveDirectExtensionMode = canDirectExtend && directExtensionMode

  // Swap Vehicle local modal state
  const [swapModalOpen, setSwapModalOpen] = useState(false)
  const [swappingVehicleId, setSwappingVehicleId] = useState("") // old vehicle ID
  const [selectedSwapNewUnitId, setSelectedSwapNewUnitId] = useState("")
  const [oldVehicleNewStatus, setOldVehicleNewStatus] = useState<"AVAILABLE" | "MAINTENANCE">("MAINTENANCE")

  // Real-time countdown timer
  useEffect(() => {
    if (!session || (session.status !== "ACTIVE" && session.status !== "EXTENDING")) {
      queueMicrotask(() => setTimeLeft(""))
      return
    }

    const updateTimer = () => {
      setCurrentTime(Date.now())
      const planned = new Date(session.plannedEnd).getTime()
      const diff = planned - Date.now()
      if (diff <= 0) {
        setTimeLeft("")
      } else {
        const minutes = Math.floor(diff / 60000)
        const seconds = Math.floor((diff % 60000) / 1000)
        setTimeLeft(`${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [session])

  useEffect(() => {
    queueMicrotask(() => {
      setDirectExtensionMode(isWalkInBooking)
      setPendingDirectExtension(null)
    })
  }, [isWalkInBooking])

  // Fetch branch catalog data (Menu & Fleet)
  useEffect(() => {
    if (booking?.cafeId) {
      // Menu Items
      queueMicrotask(() => setLoadingMenu(true))
      menuApi
        .listMenuItems(booking.cafeId)
        .then((res) => {
          setMenuItems(res.data)
          if (res.data.length > 0) {
            setSelectedItemId(res.data[0].id)
          }
        })
        .catch((err) => console.error("Error loading menu:", err))
        .finally(() => setLoadingMenu(false))

      // Fleet Units for Swap
      vehicleApi
        .listUnits(booking.cafeId)
        .then((units) => {
          setAvailableFleet(units)
        })
        .catch((err) => console.error("Error loading vehicles list for swap:", err))
    }
  }, [booking?.cafeId])

  if (!session || !booking) {
    if (apiLoading) {
      return (
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-sm text-[#6b7280] font-semibold animate-pulse">Đang tải thông tin ca chơi...</p>
        </div>
      )
    }
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-4">
        <AlertTriangle className="size-12 text-[#6b7280] mb-3 animate-bounce" />
        <h3 className="text-lg font-bold text-[#1c1b1b]">Không tìm thấy thông tin ca chơi</h3>
        <p className="text-xs text-[#6b7280] mt-1 font-semibold">Vui lòng kiểm tra lại mã phiên hoặc danh sách hôm nay.</p>
        <StaffButton
          onClick={() => navigate("/staff/today-bookings")}
          variant="primary"
          className="mt-4"
        >
          Trở lại danh sách
        </StaffButton>
      </div>
    )
  }

  // Handle adding custom F&B order
  const handleAddFnb = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItemId) return

    const created = await addFnbOrder(session.sessionId, [
      {
        menu_item_id: selectedItemId,
        variant_id: selectedVariantId || undefined,
        quantity: selectedQty,
        notes: selectedFnbNote.trim() || undefined,
      },
    ])
    if (created) {
      setSelectedQty(1)
      setSelectedFnbNote("")
      void refetchSessionDetail()
    }
  }

  const handleCancelFnbOrder = async (orderId: string) => {
    try {
      await staffApi.updateFnbOrder(orderId, "CANCELLED")
      updateFnbOrderStatus(orderId, "CANCELLED")
      void refreshData()
      await refetchSessionDetail()
      toast.success("Đã huỷ món")
    } catch {
      toast.error("Không thể huỷ món — vui lòng thử lại")
    }
  }

  const handleSettlePayment = async () => {
    if (!booking) return
    try {
      setSettlingPayment(true)
      await staffApi.settlePendingPayments(booking.bookingId)
      toast.success("Xác nhận thanh toán thành công!")
      setSettledBookingId(booking.bookingId)
      await refreshData()
      await refetchSessionDetail()
    } catch (err: unknown) {
      const message = getApiErrorInfo(err).message || (err instanceof Error ? err.message : String(err))
      toast.error("Không thể quyết toán thanh toán: " + message)
    } finally {
      setSettlingPayment(false)
    }
  }

  // Handle Swap Vehicle confirmation
  const handleConfirmSwap = () => {
    if (!selectedSwapNewUnitId) {
      toast.error("Vui lòng chọn xe thay thế!")
      return
    }

    const newUnit = availableFleet.find((u) => u.id === selectedSwapNewUnitId)
    if (!newUnit) return

    swapSessionVehicle(
      session.sessionId,
      swappingVehicleId,
      newUnit.id,
      oldVehicleNewStatus,
      {
        name: newUnit.catalog?.name || newUnit.identifier,
        imageUrl: newUnit.distinctive_image_url || undefined,
      }
    )

    setSwapModalOpen(false)
    setSelectedSwapNewUnitId("")
  }

  // Compute Badge variant dynamically
  const sessionBadgeVariant =
    session.status === "ACTIVE"
      ? "success"
      : session.status === "CHECKED_IN"
      ? "info"
      : session.status === "EXTENDING"
      ? "orange"
      : session.status === "CHECKING_OUT"
      ? "warning"
      : "neutral"

  const checkInInspection = session.inspections.find((inspection) => inspection.type === "CHECK_IN")
  const checkOutInspection = session.inspections.find((inspection) => inspection.type === "CHECK_OUT")
  const checkInDisputed = Boolean(checkInInspection && !checkInInspection.customerConfirmed && checkInInspection.customerConfirmedAt)
  const checkOutDisputed = Boolean(checkOutInspection && !checkOutInspection.customerConfirmed && checkOutInspection.customerConfirmedAt)
  const extensionPending =
    session.extensionProposal?.status === "PENDING" ||
    (Boolean(submittedExtension) &&
      (!apiData?.extensionProposal || apiData.extensionProposal.status === "PENDING"))
  const pendingExtensionMinutes = session.extensionProposal?.extraMinutes ?? submittedExtension?.extraMinutes
  const approvedExtensions = session.approvedExtensions ??
    (session.extensionProposal?.status === "APPROVED" ? [session.extensionProposal] : [])
  const approvedExtensionFee = Number(
    session.approvedExtensionFee ??
    approvedExtensions.reduce((sum, ext) => sum + Number(ext.additionalFee), 0)
  )

  const currentPlannedEndMs = new Date(session.plannedEnd ?? booking.slotEnd).getTime()
  const operationalTiming = getSessionOperationalTiming(
    session.plannedEnd ?? booking.slotEnd,
    session.status,
    currentTime,
  )
  const extensionWindowClosed = operationalTiming.state === "OVERDUE"
  const approvedExtensionMinutes = Number(
    session.approvedExtensionMinutes ??
    (session.extensionProposal?.status === "APPROVED" ? session.extensionProposal.extraMinutes : 0)
  )
  const currentDurationMinutes =
    (currentPlannedEndMs - new Date(booking.slotStart).getTime()) / 60000
  const baseDurationMinutes = Math.max(currentDurationMinutes - approvedExtensionMinutes, 1)
  const slotRatePerMinute = booking.slotFee / baseDurationMinutes
  const calcExtensionFee = (mins: number) =>
    Math.round((slotRatePerMinute * mins) / 1000) * 1000
  const maxExtensionFee = Infinity
  const remainingCap = Math.max(0, maxExtensionFee - approvedExtensionFee)
  const quotedExtensionOptions = session.extensionPricingOptions ?? []
  const extensionOptions = ([15, 30, 60] as const).map((mins) => {
    const quoted = quotedExtensionOptions.find((option) => option.extraMinutes === mins)
    const fee = Number(quoted?.additionalFee ?? calcExtensionFee(mins))
    const newPlannedEnd = quoted?.newPlannedEnd ?? new Date(currentPlannedEndMs + mins * 60000).toISOString()
    const blockedReason = quoted?.available === false ? quoted.blockedReason ?? "Không khả dụng" : undefined
    return { mins, fee, newPlannedEnd, blockedReason, blocked: Boolean(blockedReason) || fee > remainingCap }
  })
  const handleExtension = async (mins: number, fee: number, newPlannedEnd: string) => {
    if (effectiveDirectExtensionMode) {
      setPendingDirectExtension({ mins, fee, newPlannedEnd })
    } else {
      setSubmittingExtension(true)
      const created = await proposeExtension(session.sessionId, mins, fee)
      if (created) {
        setSubmittedExtension({ extraMinutes: mins })
        void refetchSessionDetail()
      }
      setSubmittingExtension(false)
    }
  }
  const formatPlannedEnd = (value: string | number) =>
    new Date(value).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  const onsiteFnbOrders = (session.fnbOrders || [])
    .filter((order) => order.orderType !== "PRE_ORDER" && order.status !== "CANCELLED")
  const preorderFnbOrders = (session.fnbOrders || [])
    .filter((order) => order.orderType === "PRE_ORDER" && order.status !== "CANCELLED")

  // The API summary, not the operational F&B/order lists, is the financial
  // source of truth. This keeps staff and customer totals identical after a
  // checkout or payment changes state.
  const financialSummary = apiData?.financialSummary ?? apiBooking?.financial_summary
  const fallbackPrepaidLines = [
    { componentId: "slot-fee", label: "Phí lịch chơi", amount: Number(booking.slotFee ?? 0) },
    { componentId: "rental-fee", label: "Phí thuê xe", amount: Number(booking.rentalFee ?? 0) },
    { componentId: "fnb-preorder", label: "Đồ ăn & thức uống đặt trước", amount: Number(booking.fnbPreorderFee ?? 0) },
  ].filter((line) => line.amount > 0)
  const fallbackAdditionalLines = (booking.payment_components ?? [])
    .filter((component) =>
      !["SLOT_FEE", "RENTAL_FEE"].includes(component.type) &&
      !((component.type === "FNB_PREORDER" || component.type === "FB_PREORDER") && component.status === "HELD"),
    )
    .map((component) => ({
      componentId: component.id,
      label:
        component.type === "FNB_ON_SITE" || component.type === "FNB_PREORDER" || component.type === "FB_PREORDER"
          ? "Đồ ăn & thức uống gọi tại quầy"
          : component.type === "EXTENSION_FEE"
            ? "Phí gia hạn ca chơi"
            : component.type === "DAMAGE_CHARGE"
              ? "Phí bồi thường hư hỏng"
              : "Khoản phát sinh khác",
      amount: Number(component.amount),
      status: component.status,
      payment: undefined,
    }))
  const prepaidLines = financialSummary?.prepaidLines ?? fallbackPrepaidLines
  const additionalLines = financialSummary?.additionalLines ?? fallbackAdditionalLines
  const prepaidDiscountAmount = financialSummary?.prepaidDiscountAmount ?? Number(booking.discountAmount ?? 0)
  const prepaidPaidAmount = financialSummary?.prepaidPaidAmount ?? Math.max(
    0,
    fallbackPrepaidLines.reduce((sum, line) => sum + line.amount, 0) - prepaidDiscountAmount,
  )
  const additionalTotal = financialSummary?.additionalTotal ?? additionalLines.reduce(
    (sum, line) => sum + Number(line.amount),
    0,
  )
  const additionalOutstandingAmount = financialSummary?.additionalOutstandingAmount ?? additionalLines
    .filter((line) => line.status === "PENDING")
    .reduce((sum, line) => sum + Number(line.amount), 0)
  const totalPaidAmount = financialSummary?.totalPaidAmount ?? prepaidPaidAmount
  const counterSettled = settledBookingId === booking.bookingId
  const hasPendingCounterPayment = !counterSettled && additionalOutstandingAmount > 0
  const isFullySettled = session.status === "COMPLETED" && !hasPendingCounterPayment

  return (
    <div className="space-y-6">
      {/* 1. Header Navigation Bar */}
      <div className="flex items-center gap-3">
        <StaffButton
          onClick={() => navigate("/staff/today-bookings")}
          variant="outline"
          size="sm"
          className="p-2 min-w-0 rounded-lg"
        >
          <ChevronLeft className="size-5 text-[#6b7280]" />
        </StaffButton>
        <h2 className="text-xl font-extrabold text-[#1c1b1b] tracking-tight">Chi Tiết Ca Chạy Xe</h2>
      </div>

      {/* 2. SESSION INFO CARD */}
      <StaffCard className="relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/5 bg-gradient-to-l from-[#fff3eb]/15 to-transparent pointer-events-none" />

        {/* Top row: status badge + track name + timer */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <StaffBadge variant={sessionBadgeVariant}>
              {session.status === "ACTIVE" && "ĐANG CHƠI"}
              {session.status === "CHECKED_IN" && "ĐANG BÀN GIAO XE"}
              {session.status === "EXTENDING" && "YÊU CẦU GIA HẠN"}
              {session.status === "CHECKING_OUT" && "ĐANG TRẢ XE"}
              {session.status === "COMPLETED" && "ĐÃ ĐÓNG"}
            </StaffBadge>
            {isContestBooking &&
              (contestId ? (
                <Link
                  to={routePaths.staffContestCheckIn.replace(
                    ":contestId",
                    contestId,
                  )}
                  className="flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-[10px] font-bold text-violet-700 transition-colors hover:bg-violet-100"
                >
                  <Trophy className="size-3" />
                  Giải đấu
                </Link>
              ) : (
                <span className="flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-[10px] font-bold text-violet-700">
                  <Trophy className="size-3" />
                  Giải đấu
                </span>
              ))}
            <div>
              <h3 className="text-xl font-black text-[#1c1b1b] tracking-tight leading-tight">{booking.trackName}</h3>
            </div>
          </div>

          {(session.status === "ACTIVE" || session.status === "EXTENDING") && (
            <div className="bg-[#fff3eb] border border-[#ffdbca] rounded-xl px-5 py-2 text-center min-w-32 shrink-0 shadow-sm">
              <span className="text-[10px] font-extrabold text-[#ea580c] uppercase tracking-wider block">
                {operationalTiming.state === "ON_TIME"
                  ? "Còn lại"
                  : operationalTiming.state === "DUE_FOR_CHECKOUT"
                    ? "Đến giờ trả xe"
                    : operationalTiming.state === "OVERDUE"
                      ? "Quá giờ"
                      : "Phiên chạy"}
              </span>
              <span className="text-2xl font-mono font-black text-[#ea580c] tracking-tight">
                {operationalTiming.state === "ON_TIME"
                  ? timeLeft
                  : operationalTiming.state === "OVERDUE"
                    ? `+${operationalTiming.minutesPastPlannedEnd}p`
                    : "Xử lý trả xe"}
              </span>
            </div>
          )}
        </div>

        {/* Bottom metadata strip */}
        <div className="mt-4 pt-3 border-t border-[#e5e2e1] grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 text-xs font-semibold">
          <div className="col-span-2 sm:col-span-2">
            <span className="text-[#6b7280] block mb-1">
              Người chơi ({booking.participantDetails?.length ?? booking.plannedParticipants.length})
            </span>
            <div className="space-y-0.5">
              {(booking.participantDetails
                ? booking.participantDetails
                : booking.plannedParticipants.map((name) => ({ name, phone: undefined, isBooker: false }))
              ).map((p, i) => (
                <div key={i} className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[#1c1b1b] font-bold">{p.name}</span>
                  {p.isBooker && (
                    <span className="text-[9px] font-extrabold uppercase tracking-wide bg-[#fff3eb] text-[#ea580c] border border-[#ffdbca] rounded px-1 py-0.5 leading-none">
                      Người đặt
                    </span>
                  )}
                  {p.phone && (
                    <span className="text-[#9b8fa8] font-normal">{p.phone}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div>
            <span className="text-[#6b7280] block mb-0.5">Giờ chơi</span>
            <span className="text-[#1c1b1b] font-bold">
              {new Date(booking.slotStart).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
              {" – "}
              {new Date(booking.slotEnd).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <div>
            <span className="text-[#6b7280] block mb-0.5">Nhân viên trực</span>
            <span className="text-[#1c1b1b] font-bold">{session.staffName}</span>
          </div>
        </div>
      </StaffCard>

      {/* 3. PRE-SESSION INFO STRIP — show before session goes ACTIVE */}
      {(session.status === "CHECKED_IN") && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Play mode */}
          <div className="rounded-xl border border-[#e5e2e1] bg-white px-4 py-3">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#6b7280] mb-1">Chế độ chơi</p>
            <p className="text-sm font-extrabold text-[#1c1b1b]">
              {booking.playMode === "RENTAL" ? "Thuê xe tại quán" : booking.playMode === "BYOC" ? "Mang xe cá nhân" : booking.playMode}
            </p>
            {booking.playMode === "RENTAL" && (
              <p className="text-[11px] text-[#ea580c] font-semibold mt-1">Cần bàn giao xe cho khách</p>
            )}
            {booking.playMode === "BYOC" && (
              <p className="text-[11px] text-[#6b7280] font-semibold mt-1">Khách tự mang xe</p>
            )}
          </div>

          {/* Track type */}
          <div className="rounded-xl border border-[#e5e2e1] bg-white px-4 py-3 min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#6b7280] mb-1">Loại đường đua</p>
            <p className="text-sm font-extrabold text-[#1c1b1b] truncate">{booking.trackName}</p>
          </div>

          {/* Vehicles with image */}
          <div className="rounded-xl border border-[#e5e2e1] bg-white px-4 py-3 min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#6b7280] mb-2">
              Xe bàn giao ({session.vehicles.length || booking.plannedVehicles.length})
            </p>
            {session.vehicles.length > 0 ? (
              <div className="space-y-2">
                {session.vehicles.map((v) => (
                  <div key={v.vehicleId} className="flex items-center gap-2">
                    {v.imageUrl ? (
                      <ZoomableInspectionImage
                        src={v.imageUrl}
                        alt={v.name}
                        className="size-10 rounded-lg border border-[#e5e2e1] object-cover shrink-0"
                        buttonClassName="size-10 shrink-0 rounded-lg"
                      />
                    ) : (
                      <div className="flex size-10 items-center justify-center rounded-lg bg-[#f5f3f2] border border-[#e5e2e1] shrink-0">
                        <Car className="size-4 text-[#9b8fa8]" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#1c1b1b] truncate">{v.name}</p>
                      <p className="text-[10px] text-[#9b8fa8] font-semibold truncate">#{v.vehicleId.slice(0, 8).toUpperCase()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : booking.plannedVehicles.length > 0 ? (
              <div className="space-y-0.5">
                {booking.plannedVehicles.map((v, i) => (
                  <p key={i} className="text-xs font-bold text-[#1c1b1b] truncate">{v}</p>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#9b8fa8] font-semibold">Chưa chỉ định xe</p>
            )}
          </div>

          {/* Pre-ordered F&B */}
          <div className="rounded-xl border border-[#e5e2e1] bg-white px-4 py-3">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#6b7280] mb-1">Đồ ăn & thức uống đặt trước</p>
            {booking.fnbPreorderFee > 0 ? (
              <>
                <p className="text-sm font-extrabold text-amber-700">{booking.fnbPreorderFee.toLocaleString("vi-VN")} đ</p>
                <p className="text-[11px] text-amber-600 font-semibold mt-1">Chuẩn bị trước khi bắt đầu ca</p>
                <div className="mt-2 space-y-1 border-t border-amber-100 pt-2 text-[11px] text-[#4c4a49]">
                  {preorderFnbOrders.flatMap((order) => order.items).map((item, index) => (
                    <div key={`${item.name}-${index}`}>
                      <span className="font-bold">{item.name}{item.variantName ? ` · ${item.variantName}` : ""}</span>
                      <span className="text-[#6b7280]"> ×{item.qty}</span>
                      {item.notes && <p className="mt-0.5 text-amber-700">Ghi chú: {item.notes}</p>}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-xs text-[#9b8fa8] font-semibold">Khách không đặt món trước</p>
            )}
          </div>
        </div>
      )}

      {/* 4. CORE ACTION MODULES (F&B / Extensions / Fleet controls) */}
      {(session.status === "ACTIVE" || session.status === "EXTENDING") && (
        <>
          {/* Active Vehicles — position 2, right below session info */}
          <StaffCard className="space-y-4">
            {(() => {
              const participantNames = booking.participantDetails?.map((p) => p.name)
                ?? booking.plannedParticipants
              const isByocMode = booking.playMode === "BYOC"
              const displayVehicles = isByocMode && session.vehicles.length < participantNames.length
                ? [
                    ...session.vehicles,
                    ...participantNames.slice(session.vehicles.length).map((name, i) => ({
                      vehicleId: `byoc-placeholder-${i}`,
                      name: `Xe tự mang của ${name}`,
                      type: "BYOC" as const,
                      imageUrl: undefined,
                    })),
                  ]
                : session.vehicles

              const checkInPhotos = session.inspections.find((i) => i.type === "CHECK_IN")?.photos ?? []
              const byocDirections = ["FRONT", "BACK", "LEFT", "RIGHT"] as const

              return (
                <>
                  <h4 className="text-sm font-bold text-[#1c1b1b] uppercase tracking-wider flex items-center gap-2">
                    <Car className="size-4.5 text-[#ea580c]" />
                    Xe đang chạy trên làn đua ({displayVehicles.length})
                  </h4>

                  <div className="space-y-2">
                    {displayVehicles.map((v, idx) => {
                      const photoUrl = v.type === "RENT"
                        ? v.imageUrl
                        : checkInPhotos.find((p) => p.direction === byocDirections[idx])?.url
                      return (
                        <div
                          key={v.vehicleId}
                          className="flex items-center justify-between rounded-lg bg-[#fcf8f8] p-3 border border-[#e5e2e1]"
                        >
                          <div className="flex items-center gap-3">
                            {photoUrl ? (
                              <ZoomableInspectionImage
                                src={photoUrl}
                                alt={v.name}
                                className="size-9 rounded-lg border border-[#e5e2e1] object-cover"
                                buttonClassName="size-9 shrink-0 rounded-lg"
                              />
                            ) : (
                              <div className="flex size-9 items-center justify-center rounded-lg bg-white border border-[#e5e2e1] shrink-0">
                                <Car className="size-4.5 text-[#6b7280]" />
                              </div>
                            )}
                            <div>
                              <p className="text-xs font-bold text-[#1c1b1b]">{v.name}</p>
                              <p className="text-[10px] text-[#6b7280] font-semibold">Mã xe: {v.vehicleId}</p>
                            </div>
                          </div>
                          {v.type === "RENT" && (
                            <StaffButton
                              onClick={() => {
                                setSwappingVehicleId(v.vehicleId)
                                setSwapModalOpen(true)
                              }}
                              variant="secondary"
                              size="sm"
                              className="py-1 px-2.5 text-[10px] font-bold rounded-lg"
                            >
                              <ArrowLeftRight className="size-3" />
                              Đổi Xe Khác
                            </StaffButton>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              )
            })()}
          </StaffCard>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Module 1: Extension Controls / overdue return handling */}
            <StaffCard className={extensionWindowClosed ? "space-y-3 md:col-span-2" : "space-y-3"}>
              {extensionWindowClosed ? (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-sm font-bold text-[#991b1b] uppercase tracking-wider flex items-center gap-2">
                      <AlertTriangle className="size-4 text-red-600" />
                      Phiên quá giờ
                    </h4>
                    <span className="text-[11px] font-semibold text-red-700">
                      +{operationalTiming.minutesPastPlannedEnd} phút
                    </span>
                  </div>
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-relaxed text-red-900">
                    <p className="font-bold">Gia hạn đã được khóa để tránh tính phí hồi tố.</p>
                    <p className="mt-1 text-red-800">
                      Nếu khách đã trả xe đúng giờ nhưng nhân viên xử lý muộn, khách không bị thu thêm. Hãy kiểm tra và xử lý trả xe; chỉ khoản phụ phí đã được thỏa thuận riêng mới được thu sau đó.
                    </p>
                  </div>
                  <StaffButton
                    onClick={() => navigate(`/staff/inspections/${session.sessionId}?type=CHECK_OUT`)}
                    variant="primary"
                    className="w-fit px-5 bg-amber-600 hover:bg-amber-700 text-xs uppercase tracking-wider"
                  >
                    <ClipboardCheck className="size-4" />
                    Xử lý trả xe
                  </StaffButton>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-[#1c1b1b] uppercase tracking-wider flex items-center gap-2">
                      <Clock className="size-4 text-[#ea580c]" />
                      Gia hạn ca chạy
                    </h4>
                    <span className="text-[11px] font-semibold text-[#6b7280]">
                      Kết thúc lúc{" "}
                      <span className="text-[#1c1b1b] font-extrabold">
                        {formatPlannedEnd(currentPlannedEndMs)}
                      </span>
                    </span>
                  </div>

              {extensionPending ? (
                <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 text-xs font-semibold text-orange-800 flex items-center gap-2">
                  <Clock className="size-3.5 shrink-0" />
                  Đang chờ khách phản hồi đề xuất gia hạn {pendingExtensionMinutes} phút…
                </div>
              ) : canDirectExtend && pendingDirectExtension ? (
                <div className="rounded-xl border border-[#ea580c] bg-[#fff3eb] p-3 space-y-2.5">
                  <p className="text-xs font-bold text-[#1c1b1b]">
                    Xác nhận gia hạn trực tiếp: <span className="text-[#ea580c]">+{pendingDirectExtension.mins < 60 ? `${pendingDirectExtension.mins} phút` : "1 giờ"}</span>
                    {" "}({pendingDirectExtension.fee.toLocaleString("vi-VN")} đ) → {formatPlannedEnd(pendingDirectExtension.newPlannedEnd)}
                  </p>
                  <p className="text-[10px] text-[#6b7280] font-semibold">Khách đã đồng ý tại chỗ — gia hạn ngay, không cần xác nhận qua ứng dụng.</p>
                  <div className="flex gap-2">
                    <StaffButton
                      variant="primary"
                      size="sm"
                      className="flex-1 text-xs"
                      disabled={submittingExtension}
                      onClick={async () => {
                        setSubmittingExtension(true)
                        const created = await proposeExtension(
                          session.sessionId,
                          pendingDirectExtension.mins,
                          pendingDirectExtension.fee,
                          canDirectExtend,
                        )
                        if (created) {
                          setPendingDirectExtension(null)
                          await refetchSessionDetail()
                        }
                        setSubmittingExtension(false)
                      }}
                    >
                      Xác nhận gia hạn
                    </StaffButton>
                    <StaffButton
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => setPendingDirectExtension(null)}
                    >
                      Huỷ
                    </StaffButton>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {extensionOptions.map(({ mins, fee, newPlannedEnd, blockedReason, blocked }) => (
                    <button
                      key={mins}
                      type="button"
                      disabled={blocked || submittingExtension}
                      onClick={() => !blocked && !submittingExtension && void handleExtension(mins, fee, newPlannedEnd)}
                      title={
                        blocked
                          ? blockedReason ?? `Vượt giới hạn gia hạn (tối đa ${(maxExtensionFee === Infinity ? "—" : (maxExtensionFee).toLocaleString("vi-VN") + " đ")})`
                          : undefined
                      }
                      className={`rounded-xl border transition-all p-2.5 text-center group ${
                        blocked || submittingExtension
                          ? "border-[#e5e2e1] bg-[#f5f3f2] opacity-50 cursor-not-allowed"
                          : "border-[#e5e2e1] bg-white hover:border-[#ea580c] hover:bg-[#fff3eb] cursor-pointer"
                      }`}
                    >
                      <span className={`block text-sm font-extrabold ${blocked || submittingExtension ? "text-[#9b8fa8]" : "text-[#ea580c]"}`}>
                        +{mins < 60 ? `${mins} phút` : "1 giờ"}
                      </span>
                      <span className="block text-[10px] text-[#6b7280] font-semibold mt-0.5">
                        → {formatPlannedEnd(newPlannedEnd)}
                      </span>
                      <span className={`block text-[10px] font-bold mt-1 ${blocked || submittingExtension ? "text-[#9b8fa8]" : "text-[#1c1b1b]"}`}>
                        {blockedReason ?? `${fee.toLocaleString("vi-VN")} đ`}
                      </span>
                    </button>
                  ))}
                </div>
              )}

                  <p className="text-[10px] text-[#9b8fa8] leading-relaxed">
                    {isWalkInBooking
                      ? "Đơn tại quầy: nhân viên xác nhận trực tiếp tại quầy."
                      : "Đơn đặt trước: hệ thống gửi thông báo và chờ khách phản hồi qua ứng dụng."}
                  </p>
                </>
              )}
            </StaffCard>

            {/* Do not add a new service while an overdue session is being reconciled. */}
            {!extensionWindowClosed && (
            <StaffCard className="space-y-4">
            <h4 className="text-sm font-bold text-[#1c1b1b] uppercase tracking-wider flex items-center gap-2">
              <Coffee className="size-4.5 text-[#ea580c]" />
              Gọi đồ ăn & thức uống
            </h4>

            {loadingMenu ? (
              <div className="h-44 animate-pulse bg-[#fcf8f8] border border-[#e5e2e1] rounded-xl" />
            ) : (
              <form onSubmit={handleAddFnb} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4c4a49] mb-1.5">
                    Chọn món ăn/nước uống
                  </label>
                  <select
                    value={selectedItemId}
                    onChange={(e) => {
                      setSelectedItemId(e.target.value)
                      setSelectedVariantId("")
                    }}
                    className="w-full rounded-lg border border-[#e5e2e1] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#1c1b1b] focus:border-[#ea580c] focus:outline-none focus:ring-1 focus:ring-[#ea580c]"
                  >
                    {menuItemGroups.map((group) => (
                      <optgroup key={group.label} label={group.label}>
                        {group.items.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} - {item.variants?.length ? `từ ${Math.min(...item.variants.map((variant) => Number(variant.price))).toLocaleString("vi-VN")}` : Number(item.price).toLocaleString("vi-VN")} đ
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {(() => {
                  const selectedItem = menuItems.find((item) => item.id === selectedItemId)
                  const variants = selectedItem?.variants?.filter((variant) => variant.isAvailable) ?? []
                  if (!variants.length) return null
                  return (
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4c4a49] mb-1.5">
                        Size / lựa chọn
                      </label>
                      <select
                        value={selectedVariantId}
                        onChange={(e) => setSelectedVariantId(e.target.value)}
                        className="w-full rounded-lg border border-[#e5e2e1] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#1c1b1b] focus:border-[#ea580c] focus:outline-none focus:ring-1 focus:ring-[#ea580c]"
                        required
                      >
                        <option value="">Chọn lựa chọn</option>
                        {variants.map((variant) => (
                          <option key={variant.id} value={variant.id}>
                            {variant.name} - {Number(variant.price).toLocaleString("vi-VN")} đ
                          </option>
                        ))}
                      </select>
                    </div>
                  )
                })()}

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4c4a49] mb-1.5">
                    Số lượng
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={selectedQty}
                    onChange={(e) => setSelectedQty(Number(e.target.value))}
                    className="w-full rounded-lg border border-[#e5e2e1] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#1c1b1b] focus:border-[#ea580c] focus:outline-none focus:ring-1 focus:ring-[#ea580c]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4c4a49] mb-1.5">
                    Ghi chú bếp (tuỳ chọn)
                  </label>
                  <input
                    value={selectedFnbNote}
                    maxLength={500}
                    onChange={(e) => setSelectedFnbNote(e.target.value)}
                    placeholder="Ví dụ: ít đá, giao bàn số 2"
                    className="w-full rounded-lg border border-[#e5e2e1] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#1c1b1b] focus:border-[#ea580c] focus:outline-none focus:ring-1 focus:ring-[#ea580c]"
                  />
                </div>

                <StaffButton
                  type="submit"
                  variant="primary"
                  className="w-full text-xs uppercase tracking-wider"
                >
                  <Plus className="size-4" />
                  Thêm món & Báo chế biến
                </StaffButton>
              </form>
            )}
            </StaffCard>
            )}
          </div>
        </>
      )}

      {/* 4. RENDER INSPECTION BANNER */}
      {session.status === "CHECKED_IN" && !checkInInspection && (
        <StaffCard variant="warning" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-900">
              Yêu cầu chụp ảnh kiểm xe bàn giao
            </h4>
            <p className="text-xs text-amber-800 leading-relaxed">
              Nhân viên cần chụp ảnh thực tế 4 góc của xe để đối chiếu trước khi cho khách khởi động lượt chạy.
            </p>
          </div>
          <StaffButton
            onClick={() => navigate(`/staff/inspections/${session.sessionId}?type=CHECK_IN`)}
            variant="primary"
            className="bg-amber-600 hover:bg-amber-700 font-bold uppercase tracking-wider text-xs shadow-sm shrink-0"
          >
            <ClipboardCheck className="size-4" />
            Lập biên bản bàn giao xe
          </StaffButton>
        </StaffCard>
      )}

      {checkInDisputed && ["CHECKED_IN", "ACTIVE", "EXTENDING"].includes(session.status) && (
        <StaffCard className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-blue-200 bg-blue-50">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-blue-900">Khách phản hồi sai lệch biên bản nhận xe</h4>
            <p className="text-xs text-blue-800 leading-relaxed">
              Kiểm tra trực tiếp với khách và lập lại biên bản bàn giao nếu cần. Xe vẫn đang thuộc phiên chạy này.
            </p>
          </div>
          <StaffButton
            onClick={() => navigate(`/staff/inspections/${session.sessionId}?type=CHECK_IN`)}
            variant="primary"
            className="bg-blue-600 hover:bg-blue-700 font-bold uppercase tracking-wider text-xs shadow-sm shrink-0"
          >
            <ClipboardCheck className="size-4" />
            Lập lại biên bản bàn giao
          </StaffButton>
        </StaffCard>
      )}

      {(session.status === "ACTIVE" || session.status === "EXTENDING") && !checkOutDisputed && !extensionWindowClosed && (
        <StaffCard variant="warning" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-900">
              {operationalTiming.state === "OVERDUE"
                ? `Phiên đã quá giờ ${operationalTiming.minutesPastPlannedEnd} phút`
                : operationalTiming.state === "DUE_FOR_CHECKOUT"
                  ? "Đã đến giờ trả xe"
                  : "Yêu cầu lập biên bản trả xe"}
            </h4>
            <p className="text-xs text-amber-800 leading-relaxed">
              {operationalTiming.state === "OVERDUE"
                ? "Xe vẫn đang được giữ ở phiên này. Hãy lập biên bản trả xe để kiểm tra, chốt phí và đưa xe về trạng thái phù hợp."
                : "Thực hiện chụp ảnh đối chiếu tình trạng xe sau khi hoàn thành lượt chạy để phát hiện hư hại (nếu có)."}
            </p>
          </div>
          <StaffButton
            onClick={() => navigate(`/staff/inspections/${session.sessionId}?type=CHECK_OUT`)}
            variant="primary"
            className="bg-amber-600 hover:bg-amber-700 font-bold uppercase tracking-wider text-xs shadow-sm shrink-0"
          >
            <ClipboardCheck className="size-4" />
            {operationalTiming.state === "ON_TIME" ? "Kiểm tra trả xe" : "Xử lý trả xe"}
          </StaffButton>
        </StaffCard>
      )}

      {(session.status === "ACTIVE" || session.status === "EXTENDING") && checkOutDisputed && (
        <StaffCard variant="warning" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-900">Khách phản hồi sai lệch biên bản trả xe</h4>
            <p className="text-xs text-amber-800 leading-relaxed">
              Cần đối chiếu lại ảnh, tình trạng xe và lập biên bản trả xe mới trước khi đóng phiên.
            </p>
          </div>
          <StaffButton
            onClick={() => navigate(`/staff/inspections/${session.sessionId}?type=CHECK_OUT`)}
            variant="primary"
            className="bg-amber-600 hover:bg-amber-700 font-bold uppercase tracking-wider text-xs shadow-sm shrink-0"
          >
            <ClipboardCheck className="size-4" />
            Lập lại biên bản trả xe
          </StaffButton>
        </StaffCard>
      )}

      {session.status === "CHECKING_OUT" && !checkOutInspection && (
        <StaffCard className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-orange-200 bg-orange-50">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-orange-900">Cần kiểm tra xe trước khi trả</h4>
            <p className="text-xs text-orange-800 leading-relaxed">
              Thực hiện kiểm tra xe và lập biên bản trả xe cho khách.
            </p>
          </div>
          <StaffButton
            size="sm"
            variant="primary"
            onClick={() => navigate(`/staff/sessions/${session.sessionId}/checkout-summary`)}
          >
            Xem biên bản & xác nhận
          </StaffButton>
        </StaffCard>
      )}

      {session.status === "CHECKING_OUT" && checkOutInspection && (
        <StaffCard className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-amber-200 bg-amber-50">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-900">Chờ khách thanh toán tại quầy</h4>
            <p className="text-xs text-amber-800 leading-relaxed">
              Biên bản đã xác nhận. Thu phí dịch vụ tại quầy rồi xác nhận thanh toán bên dưới.
            </p>
          </div>
          <StaffButton
            size="sm"
            variant="outline"
            onClick={() => navigate(`/staff/sessions/${session.sessionId}/checkout-summary`)}
          >
            Xem lại biên bản
          </StaffButton>
        </StaffCard>
      )}

      {/* 5. RENDER BILLING AND ORDER HISTORY — only after session starts */}
      {(session.status === "ACTIVE" || session.status === "EXTENDING" || session.status === "CHECKING_OUT" || session.status === "COMPLETED") && (
      <ExtensionAuditCard
        extensions={approvedExtensions}
        initialPlannedEnd={booking.slotEnd}
        currentProposal={session.extensionProposal}
        className="border-[#e5e2e1]"
      />
      )}

      {(session.status === "ACTIVE" || session.status === "EXTENDING" || session.status === "CHECKING_OUT" || session.status === "COMPLETED") && (
      <div className="grid md:grid-cols-5 gap-4 items-start">
        {/* F&B Ordered Items — narrow column */}
        <StaffCard className="md:col-span-2 space-y-3">
          <h4 className="text-sm font-bold text-[#1c1b1b] uppercase tracking-wider flex items-center gap-2">
            <Coffee className="size-4 text-[#ea580c]" />
            Đồ ăn & thức uống gọi trong phiên chơi
          </h4>

          <div className="space-y-1.5">
            {onsiteFnbOrders.map((order) => (
              <div
                key={order.orderId}
                className="rounded-lg bg-[#fcf8f8] px-3 py-2 border border-[#e5e2e1] text-xs flex justify-between items-start gap-2 font-semibold"
              >
                <div className="space-y-0.5 flex-1 min-w-0">
                  {order.items.map((i, idx) => (
                    <span key={idx} className="block text-[#1c1b1b]">
                      {i.name}{i.variantName ? ` · ${i.variantName}` : ""} <span className="text-[#6b7280] font-normal">×{i.qty}</span>
                      {i.notes && <span className="block mt-0.5 text-[10px] text-[#b45309] font-medium">Ghi chú: {i.notes}</span>}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-extrabold text-[#ea580c]">{order.total.toLocaleString("vi-VN")} đ</span>
                  {(session.status === "ACTIVE" || session.status === "EXTENDING") && (
                    <button
                      type="button"
                      onClick={() => void handleCancelFnbOrder(order.orderId)}
                      title="Huỷ món này"
                      className="flex size-5 items-center justify-center rounded-full bg-[#f5f3f2] hover:bg-rose-100 hover:text-rose-600 text-[#9b8fa8] transition-colors"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {onsiteFnbOrders.length === 0 && (
              <p className="text-xs text-[#6b7280] italic py-4 text-center">Chưa gọi món.</p>
            )}
          </div>
        </StaffCard>

        {/* Financial summary is shared with the customer booking detail. */}
        <StaffCard className="md:col-span-3 space-y-4">
          <h4 className="text-sm font-bold text-[#1c1b1b] uppercase tracking-wider flex items-center gap-2">
            <FileText className="size-4.5 text-[#ea580c]" />
            Quyết toán phiên chơi
          </h4>

          {hasPendingCounterPayment && (
            <div className="flex items-start gap-2.5 rounded-xl bg-orange-50 border border-orange-200 px-3.5 py-3">
              <Banknote className="size-4 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-extrabold text-orange-900">Còn khoản phát sinh cần thanh toán</p>
                <p className="text-[11px] text-orange-700 mt-0.5 leading-relaxed">
                  Khách cần thanh toán {additionalOutstandingAmount.toLocaleString("vi-VN")} đ cho các khoản dưới đây.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4 text-xs font-semibold">
            <section className="space-y-1.5 pb-3 border-b border-[#e5e2e1]/60">
              <span className="text-[10px] font-extrabold text-[#6b7280] uppercase tracking-wider block">
                Đã thanh toán khi đặt lịch
              </span>
              {prepaidLines.map((line) => (
                <div key={line.componentId} className="flex justify-between gap-4 text-[#4c4a49]">
                  <span>{line.label}</span>
                  <span className="text-[#1c1b1b] font-bold shrink-0">{Number(line.amount).toLocaleString("vi-VN")} đ</span>
                </div>
              ))}
              {prepaidDiscountAmount > 0 && (
                <div className="flex justify-between gap-4 text-emerald-700">
                  <span>Ưu đãi áp dụng</span>
                  <span className="font-bold shrink-0">−{prepaidDiscountAmount.toLocaleString("vi-VN")} đ</span>
                </div>
              )}
              <div className="flex justify-between gap-4 border-t border-[#e5e2e1]/60 pt-2 mt-2 text-[#1c1b1b]">
                <span className="font-bold">Đã thanh toán trước</span>
                <span className="font-extrabold shrink-0">{prepaidPaidAmount.toLocaleString("vi-VN")} đ</span>
              </div>
            </section>

            <section className="space-y-2 pb-3 border-b border-[#e5e2e1]/60">
              <span className="text-[10px] font-extrabold text-[#ea580c] uppercase tracking-wider block">
                Chi phí phát sinh tại quầy
              </span>
              {additionalLines.length > 0 ? additionalLines.map((line) => {
                const paid = line.status === "DISBURSED" || line.status === "CAPTURED"
                const gateway = line.payment?.gateway === "VNPAY"
                  ? "VNPAY"
                  : line.payment?.gateway === "DIRECT"
                    ? "tiền mặt"
                    : undefined
                return (
                  <div key={line.componentId} className="rounded-lg bg-[#fcf8f8] px-2.5 py-2">
                    <div className="flex justify-between gap-4 text-[#4c4a49]">
                      <span>{line.label}</span>
                      <span className="text-[#ea580c] font-extrabold shrink-0">+{Number(line.amount).toLocaleString("vi-VN")} đ</span>
                    </div>
                    <p className={`mt-1 text-[10px] ${paid ? "text-emerald-700" : "text-orange-700"}`}>
                      {paid ? `Đã thanh toán${gateway ? ` · ${gateway}` : ""}` : "Chờ thanh toán"}
                    </p>
                  </div>
                )
              }) : (
                <p className="text-[11px] text-[#6b7280] italic">Không phát sinh chi phí tại quầy.</p>
              )}
              <div className="flex justify-between gap-4 border-t border-[#e5e2e1]/60 pt-2 text-[#1c1b1b]">
                <span className="font-bold">Tổng phí phát sinh</span>
                <span className="text-[#ea580c] font-extrabold shrink-0">{additionalTotal.toLocaleString("vi-VN")} đ</span>
              </div>
            </section>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-3">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Tổng khách đã thanh toán</p>
                <p className="mt-0.5 text-base font-extrabold text-slate-900">{totalPaidAmount.toLocaleString("vi-VN")} đ</p>
              </div>
              {hasPendingCounterPayment ? (
                <StaffButton
                  onClick={() => setConfirmSettleOpen(true)}
                  disabled={settlingPayment}
                  variant="primary"
                  className="w-fit px-4 py-2.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                >
                  <Banknote className="size-4" />
                  {settlingPayment ? "Đang xử lý..." : "Xác nhận đã thu tiền mặt"}
                </StaffButton>
              ) : isFullySettled ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-700 text-xs font-bold">
                  <CheckCircle2 className="size-4" /> Đã quyết toán hoàn tất
                </span>
              ) : null}
            </div>
          </div>
        </StaffCard>
      </div>
      )}

      {/* Helpful Operational tips */}
      <div className="rounded-lg border border-[#e5e2e1] bg-[#f5f3f2]/30 p-4 space-y-1">
        <div className="flex items-center gap-2 text-xs font-bold text-[#4c4a49]">
          <HelpCircle className="size-4 text-[#6b7280]" />
          Lưu ý vận hành ca chơi
        </div>
        <p className="text-[11px] text-[#6b7280] leading-relaxed">
          Nếu khách chơi gặp sự cố ngoài đường đua hoặc xe gặp lỗi cơ khí cần đổi nhanh sang xe mới, sử dụng tính năng <strong className="text-[#1c1b1b]">Đổi Xe Khác</strong> để thu hồi xe hỏng về khu vực kỹ thuật bảo trì và bàn giao xe thay thế phù hợp.
        </p>
      </div>

      {/* SETTLE PAYMENT CONFIRMATION MODAL */}
      {confirmSettleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex size-10 items-center justify-center rounded-full bg-emerald-100">
                <Banknote className="size-5 text-emerald-700" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Xác nhận quyết toán</h3>
                <p className="text-[11px] text-slate-500">Đảm bảo đã thực hiện xong với khách tại quầy</p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2.5 text-xs font-semibold">
              {additionalLines.filter((line) => line.status === "PENDING").map((line) => (
                <div key={line.componentId} className="flex items-center justify-between gap-4">
                  <span className="text-slate-600">{line.label}</span>
                  <span className="text-orange-700 font-extrabold shrink-0">{Number(line.amount).toLocaleString("vi-VN")} đ</span>
                </div>
              ))}
              <div className="border-t border-slate-200 pt-2.5 flex justify-between items-center">
                <span className="text-slate-800 font-extrabold text-sm">Khách trả thêm tại quầy</span>
                <span className="font-extrabold text-base text-orange-700">
                  {additionalOutstandingAmount.toLocaleString("vi-VN")} đ
                </span>
              </div>
            </div>

            <div className="flex gap-2.5">
              <StaffButton
                onClick={() => setConfirmSettleOpen(false)}
                variant="outline"
                className="flex-1"
              >
                Huỷ bỏ
              </StaffButton>
              <StaffButton
                onClick={() => { setConfirmSettleOpen(false); void handleSettlePayment() }}
                variant="primary"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle2 className="size-4" />
                Đã thu xong
              </StaffButton>
            </div>
          </div>
        </div>
      )}

      {/* VEHICLE SWAP MODAL */}
      {swapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#e5e2e1] bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-[#ea580c] mb-2">
              <ArrowLeftRight className="size-5" />
              <h3 className="font-bold text-base text-[#1c1b1b]">Đổi xe đang chơi</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4c4a49] mb-1.5">
                  Tình trạng xe cũ (Mã ID: {swappingVehicleId})
                </label>
                <select
                  value={oldVehicleNewStatus}
                  onChange={(e) => setOldVehicleNewStatus(e.target.value as "AVAILABLE" | "MAINTENANCE")}
                  className="w-full rounded-lg border border-[#e5e2e1] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#1c1b1b] focus:border-[#ea580c] focus:outline-none focus:ring-1 focus:ring-[#ea580c]"
                >
                  <option value="MAINTENANCE">Xe bị hỏng hóc (Chuyển vào bảo trì)</option>
                  <option value="AVAILABLE">Xe bình thường (Đưa lại kho trống)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4c4a49] mb-1.5">
                  Chọn xe thay thế khả dụng
                </label>
                <select
                  value={selectedSwapNewUnitId}
                  onChange={(e) => setSelectedSwapNewUnitId(e.target.value)}
                  className="w-full rounded-lg border border-[#e5e2e1] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#1c1b1b] focus:border-[#ea580c] focus:outline-none focus:ring-1 focus:ring-[#ea580c]"
                >
                  <option value="">-- Chọn xe trống khả dụng --</option>
                  {availableFleet
                    .filter((u) => {
                      const st = fleetStates[u.id] || u.status
                      return st === "AVAILABLE" && u.id !== swappingVehicleId
                    })
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.catalog?.name || u.identifier} (Mã: {u.identifier} | {u.color})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <StaffButton
                onClick={() => {
                  setSwapModalOpen(false)
                  setSelectedSwapNewUnitId("")
                }}
                variant="outline"
                className="flex-1"
              >
                Hủy bỏ
              </StaffButton>
              <StaffButton
                onClick={handleConfirmSwap}
                variant="primary"
                className="flex-1"
              >
                Xác nhận đổi
              </StaffButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
