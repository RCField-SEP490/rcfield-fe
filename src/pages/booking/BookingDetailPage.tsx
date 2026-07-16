import { useState, useEffect } from "react"
import { env } from "@/shared/lib/env"
import {
  AlertTriangle, CalendarClock, Camera, Car, CheckCircle2, Clock3, Gamepad2,
  Layers, MapPin, Navigation, QrCode, RotateCcw, Users, UtensilsCrossed, XCircle,
} from "lucide-react"
import { Link, useParams } from "react-router"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Separator } from "@/shared/ui/separator"
import { formatCurrency } from "@/shared/lib/format"
import { useBooking, useCancelBooking } from "@/features/booking/hooks/use-booking"
import { customerSessionApi } from "@/features/customer-session/api/customer-session.api"
import { useQuery } from "@tanstack/react-query"
import type { BookingResponse, BookingStatus, PaymentComponentType, PaymentTransactionResponse } from "@/features/booking/types/booking.types"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { bookingApi, bookingQueryKeys } from "@/features/booking/api/booking.api"
import { useAuthStore } from "@/features/auth/stores/auth.store"
import { staffApi } from "@/features/staff/api/staff.api"
import { VehicleImage } from "@/shared/ui/vehicle-image"
import { hasExpiredCheckInWindow } from "@/features/booking/lib/check-in-window"

const DIRECTION_LABELS: Record<string, string> = {
  FRONT: "Trước",
  BACK: "Sau",
  LEFT: "Trái",
  RIGHT: "Phải",
  TOP: "Từ trên",
  BOTTOM: "Từ dưới",
  DETAIL: "Cận cảnh",
  OTHER: "Ảnh tình trạng xe",
}

const PART_TYPE_LABELS: Record<string, string> = {
  TIRE_WHEEL: "Bánh xe / Lốp",
  SPOILER: "Cánh gió",
  CHASSIS: "Khung gầm",
  MOTOR: "Motor / Động cơ",
  SHELL: "Vỏ nhựa (Shell)",
  SERVO: "Servo / Tay lái",
  REMOTE: "Remote / Điều khiển",
  OTHER: "Khác",
}

const TIER_LABELS: Record<string, string> = {
  STANDARD: "Tiêu chuẩn",
  PREMIUM: "Cao cấp",
  RESTRICTED: "Đặc biệt",
}

const STATUS_LABELS: Record<BookingStatus, { label: string; className: string }> = {
  PENDING: { label: "Chờ thanh toán", className: "bg-amber-100 text-amber-700" },
  CONFIRMED: { label: "Đã xác nhận", className: "bg-emerald-100 text-emerald-700" },
  NO_SHOW: { label: "Không đến", className: "bg-orange-100 text-orange-700" },
  COMPLETED: { label: "Hoàn thành", className: "bg-indigo-100 text-indigo-700" },
  CANCELLED: { label: "Đã hủy", className: "bg-red-100 text-red-700" },
}

function estimateRefund(booking: BookingResponse): { slotFee: number; rest: number; total: number; policy: string } {
  const hoursUntilSlot = (new Date(booking.slotStart).getTime() - Date.now()) / 3_600_000
  const slotFeeComponent = booking.payment_components.find((c) => c.type === "SLOT_FEE")
  const slotFee = Number(slotFeeComponent?.amount ?? 0)
  const rest = booking.payment_components
    .filter((c) => c.type !== "SLOT_FEE")
    .reduce((sum, c) => sum + Number(c.amount), 0)

  let slotFeeRefund: number
  let policy: string
  if (hoursUntilSlot > 24) {
    slotFeeRefund = slotFee
    policy = "Hoàn 100% phí lịch (hủy trước 24h)"
  } else if (hoursUntilSlot > 12) {
    slotFeeRefund = slotFee * 0.5
    policy = "Hoàn 50% phí lịch (hủy trong 12–24h)"
  } else {
    slotFeeRefund = 0
    policy = "Không hoàn phí lịch (hủy dưới 12h)"
  }
  return { slotFee: slotFeeRefund, rest, total: slotFeeRefund + rest, policy }
}

function CancelDialog({
  booking, onConfirm, onCancel, isPending,
}: {
  booking: BookingResponse
  onConfirm: () => void
  onCancel: () => void
  isPending: boolean
}) {
  const refund = estimateRefund(booking)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="h-12 w-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-black text-slate-950">Xác nhận hủy đặt lịch?</h3>
          <p className="text-xs font-semibold text-slate-500">{refund.policy}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Hoàn phí lịch</span>
            <span className="font-mono font-semibold">{formatCurrency(refund.slotFee)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Hoàn phí khác (thuê xe, F&B)</span>
            <span className="font-mono font-semibold">{formatCurrency(refund.rest)}</span>
          </div>
          <div className="border-t border-dashed border-slate-200 pt-1.5 flex justify-between font-bold text-slate-800">
            <span>Ước tính hoàn lại</span>
            <span className="font-mono text-emerald-600">{formatCurrency(refund.total)}</span>
          </div>
          <p className="text-[10px] text-slate-400">* Số tiền thực tế sẽ được xử lý trong 3-5 ngày làm việc.</p>
        </div>
        <div className="flex items-center gap-3 justify-end pt-1">
          <Button variant="outline" className="border-slate-200 font-bold h-10 text-xs rounded-xl" onClick={onCancel}>
            Không, giữ lịch
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white font-bold h-10 text-xs rounded-xl"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? "Đang hủy..." : "Có, xác nhận hủy"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function BookingDetailPage() {
  const params = useParams()
  const bookingId = params.bookingId ?? params.id
  const { data: booking, isLoading, error, isError } = useBooking(bookingId)
  const cancelMutation = useCancelBooking()
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const queryClient = useQueryClient()
  const role = useAuthStore((s) => s.role)
  const [confirmingRefund, setConfirmingRefund] = useState(false)

  const backUrl =
    role === "staff"
      ? "/staff/today-bookings"
      : role === "provider"
      ? "/provider/bookings"
      : role === "admin"
      ? "/admin/dashboard"
      : "/customer/bookings"

  const handleSettleCash = async () => {
    if (!bookingId) return
    try {
      setSettlingCash(true)
      await staffApi.settlePendingPayments(bookingId)
      toast.success("Đã xác nhận thanh toán tiền mặt thành công")
      void queryClient.invalidateQueries({ queryKey: bookingQueryKeys.detail(bookingId) })
    } catch (err) {
      const axiosError = err as { response?: { data?: { message?: string } } }
      toast.error(axiosError.response?.data?.message || "Không thể xác nhận thanh toán")
    } finally {
      setSettlingCash(false)
    }
  }

  const handleConfirmRefund = async () => {
    if (!bookingId) return
    try {
      setConfirmingRefund(true)
      await staffApi.confirmRefund(bookingId)
      toast.success("Đã xác nhận hoàn tiền thủ công thành công")
      void queryClient.invalidateQueries({ queryKey: bookingQueryKeys.detail(bookingId) })
    } catch (err) {
      const axiosError = err as { response?: { data?: { message?: string } } }
      toast.error(axiosError.response?.data?.message || "Không thể xác nhận hoàn tiền")
    } finally {
      setConfirmingRefund(false)
    }
  }

  const sessionId = booking?.session?.id
  const { data: sessionDetail } = useQuery({
    queryKey: ["session-detail", sessionId],
    queryFn: () => customerSessionApi.getSessionDetail(sessionId!),
    enabled: !!sessionId,
    staleTime: 60_000,
  })
  const checkInPhotos = sessionDetail?.inspections
    ?.filter((ins) => ins.type === "CHECK_IN" && ins.photos.length > 0)
    .flatMap((ins) => ins.photos) ?? []

  const checkOutPhotos = sessionDetail?.inspections
    ?.filter((ins) => ins.type === "CHECK_OUT" && ins.photos.length > 0)
    .flatMap((ins) => ins.photos) ?? []

  const [secondsLeft, setSecondsLeft] = useState(0)
  const [totalDuration, setTotalDuration] = useState(1)

  useEffect(() => {
    if (sessionDetail && (sessionDetail.status === "ACTIVE" || sessionDetail.status === "EXTENDING")) {
      const plannedTime = new Date(sessionDetail.plannedEnd).getTime()
      const actualStart = sessionDetail.actualStart ? new Date(sessionDetail.actualStart).getTime() : Date.now()
      const now = Date.now()
      queueMicrotask(() => {
        setSecondsLeft(Math.max(0, Math.floor((plannedTime - now) / 1000)))
        setTotalDuration(Math.max(1, Math.floor((plannedTime - actualStart) / 1000)))
      })
    } else {
      queueMicrotask(() => {
        setSecondsLeft(0)
        setTotalDuration(1)
      })
    }
  }, [sessionDetail])

  useEffect(() => {
    if (secondsLeft <= 0) return
    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [secondsLeft])

  const [payingAdditional, setPayingAdditional] = useState(false)
  const [settlingCash, setSettlingCash] = useState(false)

  const handlePayAdditionalFees = async () => {
    if (!bookingId) return
    try {
      setPayingAdditional(true)
      const res = await bookingApi.createCheckoutAdditionalPayment(bookingId)
      if (res.payment_url) {
        toast.info("Đang chuyển hướng sang cổng thanh toán VNPAY...")
        window.location.href = res.payment_url
      } else {
        toast.success("Thanh toán thành công (Bypass)")
        void queryClient.invalidateQueries({ queryKey: bookingQueryKeys.detail(bookingId) })
      }
    } catch (err) {
      const axiosError = err as { response?: { data?: { message?: string } } }
      toast.error(axiosError.response?.data?.message || "Không thể khởi tạo thanh toán")
    } finally {
      setPayingAdditional(false)
    }
  }

  const snapshot = booking?.snapshot as Record<string, unknown> | null
  const snapshotSlotFee = Number(snapshot?.slot_fee_total ?? snapshot?.slot_fee ?? 0)
  const snapshotRentalFee = Number(
    (snapshot?.vehicles as Array<Record<string, unknown>> | undefined)?.reduce((sum: number, v: Record<string, unknown>) => sum + Number(v.rental_fee ?? 0), 0) ??
    snapshot?.rental_fee ??
    0
  )
  const snapshotFnbPreorder = Number(snapshot?.fnb_total ?? snapshot?.fnb_preorder_fee ?? 0)

  const slotFee = Number(booking?.payment_components?.find((c) => c.type === "SLOT_FEE")?.amount ?? snapshotSlotFee)
  const rentalFee = Number(booking?.payment_components?.find((c) => c.type === "RENTAL_FEE")?.amount ?? snapshotRentalFee)
  const discountAmount = Number(booking?.discountAmount ?? 0)
  const depositAmount = 0
  const fnbPreorderFee = Number(
    booking?.payment_components?.find(
      (c) =>
        (c.type === "FB_PREORDER" || c.type === "FNB_PREORDER") &&
        (c.status === "HELD" || c.status === "REFUNDED")
    )?.amount ?? snapshotFnbPreorder
  )

  // On-site incurred service components (F&B/extension/damage that are NOT prepaid HELD)
  // Exclude: SLOT_FEE, RENTAL_FEE, SECURITY_DEPOSIT, and any FNB_PREORDER with status HELD/REFUNDED (prepaid)
  const onsiteComponents = booking?.payment_components?.filter((c) =>
    !["SLOT_FEE", "RENTAL_FEE", "SECURITY_DEPOSIT"].includes(c.type) &&
    !((c.type === "FNB_PREORDER" || c.type === "FB_PREORDER") && (c.status === "HELD" || c.status === "REFUNDED"))
  ) || []


  // Damage charge component specifically (for deposit reconciliation)
  const damageComponent = onsiteComponents.find((c) => c.type === "DAMAGE_CHARGE")
  const damageCharge = Number(damageComponent?.amount ?? 0)

  // Fallback: when no DAMAGE_CHARGE component exists yet (e.g. session is CHECKING_OUT and
  // backend hasn't billed it yet), read damage from booking.damage_breakdown or sessionDetail.damageClaim
  const breakdownDamageCharge = Number(booking?.damage_breakdown?.totalDamageCharge ?? 0)
  const sessionClaimCharge = Number(sessionDetail?.damageClaim?.totalDamageCharge ?? 0)
  const effectiveDamageCharge =
    damageCharge > 0
      ? damageCharge
      : booking?.session?.status === "CHECKING_OUT"
        ? (breakdownDamageCharge || sessionClaimCharge)
        : 0

  // ── Best Practice: Deposit ONLY offsets vehicle damage ──
  const depositConsumedByDamage = Math.min(depositAmount, effectiveDamageCharge)
  const depositRefundAmount = depositAmount - depositConsumedByDamage
  const damageExceedingDeposit = Math.max(0, effectiveDamageCharge - depositAmount)

  // Counter bill = F&B onsite + Extension + damage exceeding deposit
  const counterComponents = onsiteComponents.filter((c) => c.type !== "DAMAGE_CHARGE")
  const totalCounterServiceBill = counterComponents.reduce((sum, c) => sum + Number(c.amount), 0)
  const totalCounterBill = totalCounterServiceBill + damageExceedingDeposit

  // settleSessionCheckoutBilling already created a FB_PREORDER PENDING component for on-site F&B
  // — hide the raw onsiteFnbTotal row to avoid double-counting
  const hasSettledFnbComponent = counterComponents.some(
    (c) => c.type === "FB_PREORDER" || c.type === "FNB_PREORDER"
  )

  // Mark unpaid when there's a PENDING component OR when damage exists that isn't billed yet
  const hasUnbilledDamage = effectiveDamageCharge > 0 && !damageComponent
  const isPaid = !booking?.payment_components?.some((c) => c.status === "PENDING") && !hasUnbilledDamage

  const transactions: PaymentTransactionResponse[] = booking?.payment_transactions ?? []
  const gatewayLabel = (gateway: string) =>
    gateway === "DIRECT" ? "Tiền mặt" : gateway === "MOCK" ? "DEV Mock" : "VNPay Online"
  const prepaidTx = transactions.find((t) => t.type === "PAYMENT" && t.gateway !== "DIRECT" && t.status === "SUCCESS")
  const counterTx = transactions.find((t) => t.type === "PAYMENT" && t.gateway === "DIRECT" && t.status === "SUCCESS")
  const additionalVnpayTx = transactions.filter(
    (t) => t.type === "PAYMENT" && t.gateway !== "DIRECT" && t.status === "SUCCESS"
  ).length > 1
    ? transactions.filter((t) => t.type === "PAYMENT" && t.gateway !== "DIRECT" && t.status === "SUCCESS").at(-1)
    : undefined

  const refundComponents = booking?.payment_components?.filter(
    (c) => c.status === "PENDING_REFUND" || c.status === "REFUNDED"
  ) || []
  const hasRefund = refundComponents.length > 0
  const isRefundPending = refundComponents.some((c) => c.status === "PENDING_REFUND")
  const totalRefundAmount = refundComponents.reduce((sum, c) => sum + Number(c.refundedAmount ?? 0), 0)

  const refundSlotFee = refundComponents.filter(c => c.type === "SLOT_FEE").reduce((sum, c) => sum + Number(c.refundedAmount ?? 0), 0)
  const refundRentalFee = refundComponents.filter(c => c.type === "RENTAL_FEE").reduce((sum, c) => sum + Number(c.refundedAmount ?? 0), 0)
  const refundDeposit = refundComponents.filter(c => c.type === "SECURITY_DEPOSIT").reduce((sum, c) => sum + Number(c.refundedAmount ?? 0), 0)
  const refundFnb = refundComponents.filter(c => c.type === "FNB_PREORDER" || c.type === "FB_PREORDER").reduce((sum, c) => sum + Number(c.refundedAmount ?? 0), 0)

  const checkInWindowExpired = booking ? hasExpiredCheckInWindow(booking) : false
  const effectiveBookingStatus: BookingStatus | undefined = checkInWindowExpired
    ? "NO_SHOW"
    : booking?.status

  const isActiveSession = !!booking?.session &&
    ["ACTIVE", "EXTENDING", "CHECKED_IN", "CHECKING_OUT"].includes(booking.session!.status) &&
    !checkInWindowExpired &&
    !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(booking!.status)

  // F&B on-site orders from session (paid at counter, not a payment_component)
  const onsiteFnbTotal = (sessionDetail?.fnbOrders ?? [])
    .filter(o => o.orderType === "ON_SITE")
    .reduce((sum, o) => sum + Number(o.total ?? 0), 0)

  // Total estimated counter bill = payment_component-tracked fees + on-site F&B
  const totalEstimatedCounterBill = totalCounterBill + onsiteFnbTotal

  const statusInfo = effectiveBookingStatus
    ? (STATUS_LABELS[effectiveBookingStatus] ?? STATUS_LABELS.PENDING)
    : null

  const sessionBadgeOverride = booking?.session && !checkInWindowExpired ? (() => {
    switch (booking.session.status) {
      case "CHECKED_IN": return { label: "Đang check-in", className: "bg-amber-100 text-amber-700" }
      case "ACTIVE":     return { label: "Đang chơi",     className: "bg-orange-100 text-orange-700" }
      case "EXTENDING":  return { label: "Đang gia hạn",  className: "bg-orange-100 text-orange-700" }
      case "CHECKING_OUT": return { label: "Đang checkout", className: "bg-blue-100 text-blue-700" }
      default: return null
    }
  })() : null

  const displayStatusInfo = sessionBadgeOverride ?? statusInfo

  const handleCancelConfirm = () => {
    if (!booking) return
    cancelMutation.mutate(
      { bookingId: booking.id },
      {
        onSuccess: () => { setShowCancelDialog(false); toast.success("Đã hủy đơn đặt lịch") },
        onError: () => toast.error("Không thể hủy đơn. Vui lòng thử lại."),
      },
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Đang tải...</p>
      </div>
    )
  }

  if (isError || !booking) {
    const errMsg = 
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 
      (error as Error)?.message || 
      "Không tìm thấy dữ liệu hoặc không có quyền truy cập."
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <div className="text-center space-y-2">
          <p className="text-red-500 font-bold">Không tìm thấy đơn đặt lịch</p>
          <p className="text-xs text-slate-500 font-mono">ID: {bookingId ?? "Không có ID"}</p>
          <p className="text-xs text-red-500 bg-red-50 px-4 py-2.5 rounded-xl border border-red-100 max-w-md mx-auto">
            Chi tiết lỗi: {errMsg}
          </p>
        </div>
        <Button asChild variant="outline"><Link to={backUrl}>Quay lại</Link></Button>
      </div>
    )
  }

  const slotStart = new Date(booking.slotStart)
  const slotEnd = new Date(booking.slotEnd)
  const slotLabel = `${formatTime(slotStart)} - ${formatTime(slotEnd)}, ${formatDate(slotStart)}`
  const paymentExpiry = booking.paymentExpiresAt ? new Date(booking.paymentExpiresAt) : null
  const playerCount = booking.participants.length || 1

  const percentage = Math.min(100, Math.max(0, (secondsLeft / totalDuration) * 100))
  const strokeDashoffset = 283 - (283 * percentage) / 100

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-6 md:px-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="text-sm text-muted-foreground">
          <Link to={backUrl} className="hover:text-foreground">Quay lại danh sách</Link>
          <span className="mx-2">/</span>
          <span>Đơn đặt #{booking.id.substring(0, 8).toUpperCase()}</span>
        </div>

         <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <main className="space-y-4">
            {booking.session && !checkInWindowExpired && ["ACTIVE", "CHECKED_IN", "EXTENDING", "CHECKING_OUT"].includes(booking.session.status) && !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(booking.status) && (
              (booking.session.status === "ACTIVE" || booking.session.status === "EXTENDING") ? (
                <Card className="rounded-xl shadow-sm overflow-hidden border-orange-100">
                  <div className="h-1 bg-gradient-to-r from-orange-500 to-orange-600" />
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row items-center gap-5">
                      {/* Circular Countdown */}
                      <div className="relative h-36 w-36 flex-shrink-0 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="45" className="stroke-slate-100 fill-none" strokeWidth="6" />
                          <circle
                            cx="50" cy="50" r="45"
                            className="stroke-orange-500 fill-none transition-all duration-1000 ease-linear"
                            strokeWidth="6"
                            strokeDasharray="283"
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center space-y-0.5">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">CÒN LẠI</span>
                          <span className="text-2xl font-black text-slate-950 tracking-tight tabular-nums">
                            {secondsLeft > 0 ? formatCountdown(secondsLeft) : "00:00"}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-500">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                            ĐANG CHƠI
                          </span>
                        </div>
                      </div>

                      {/* Session info */}
                      <div className="flex-1 space-y-3 text-center sm:text-left">
                        <div>
                          <h4 className="font-black text-slate-950 text-base">Phiên chơi đang diễn ra</h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {booking.session.status === "EXTENDING" ? "Phiên đang được gia hạn thêm" : "Phiên chơi đang hoạt động bình thường"}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-slate-50 rounded-lg p-2.5 text-left">
                            <p className="text-slate-400 uppercase text-[9px] font-black tracking-wide">Giờ bắt đầu</p>
                            <p className="font-bold text-slate-900 mt-0.5">
                              {sessionDetail?.actualStart
                                ? new Date(sessionDetail.actualStart).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
                                : "--:--"}
                            </p>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-2.5 text-left">
                            <p className="text-slate-400 uppercase text-[9px] font-black tracking-wide">Kết thúc dự kiến</p>
                            <p className="font-bold text-slate-900 mt-0.5">
                              {sessionDetail?.plannedEnd
                                ? new Date(sessionDetail.plannedEnd).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
                                : new Date(booking.session.plannedEndAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                        {role === "staff" && (
                          <Button asChild size="sm" className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs">
                            <Link to={`/staff/sessions/${booking.session.id}`}>Quản lý phiên chơi</Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-amber-200 bg-amber-50/50 shadow-sm rounded-xl">
                  <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                        <Clock3 className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">
                          {booking.session.status === "CHECKED_IN" ? "Phiên chơi chuẩn bị diễn ra" : "Đang hoàn tất checkout"}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {booking.session.status === "CHECKED_IN"
                            ? "Nhân viên đang hoàn tất thủ tục bàn giao xe"
                            : "Vui lòng chờ nhân viên hoàn tất kiểm tra trả xe"}
                        </p>
                      </div>
                    </div>
                    {role === "staff" && (
                      <Button asChild className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold px-5">
                        <Link to={`/staff/sessions/${booking.session.id}`}>Quản lý phiên chơi</Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            )}

            {/* Header card */}
            <Card className="rounded-xl shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-3xl">Đơn đặt #{booking.id.substring(0, 8).toUpperCase()}</CardTitle>
                  <p className="mt-2 text-muted-foreground">Ngày tạo: {formatDateTime(new Date(booking.createdAt))}</p>
                </div>
                {displayStatusInfo && (
                  <Badge className={`${displayStatusInfo.className} hover:${displayStatusInfo.className}`}>{displayStatusInfo.label}</Badge>
                )}
              </CardHeader>
              <CardContent>
                {(() => {
                  const sess = checkInWindowExpired ? null : booking.session
                  const sessStatus = sess?.status
                  const timelineStatus = checkInWindowExpired ? "NO_SHOW" : booking.status

                  // Check-in step
                  const checkinDone = !checkInWindowExpired && !!sess
                  const checkinActive = sessStatus === "CHECKED_IN"
                  const checkinTitle = checkInWindowExpired ? "Quá giờ check-in"
                    : !sess ? "Chờ check-in"
                    : sessStatus === "CHECKED_IN" ? "Đang check-in"
                    : "Đã check-in"
                  const checkinStaff = sessionDetail?.staffName
                  const checkinDesc = checkInWindowExpired
                    ? "Đơn đã quá thời hạn check-in 30 phút và được ghi nhận là không đến."
                    : !sess
                    ? `Dự kiến: ${slotLabel}`
                    : sessStatus === "CHECKED_IN"
                    ? checkinStaff
                      ? `Nhân viên ${checkinStaff} đang xác nhận tình trạng xe bàn giao`
                      : "Nhân viên đang xác nhận tình trạng xe bàn giao"
                    : sess.actualStartAt
                    ? `Bắt đầu lúc ${new Date(sess.actualStartAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}${checkinStaff ? ` · NV: ${checkinStaff}` : ""}`
                    : checkinStaff
                    ? `Đã check-in bởi ${checkinStaff}`
                    : "Đã hoàn tất check-in"

                  // Playing step
                  const showPlayStep = !!sess && sessStatus !== "CHECKED_IN"
                  const playDone = sessStatus === "CHECKING_OUT" || timelineStatus === "COMPLETED"
                  const playActive = sessStatus === "ACTIVE" || sessStatus === "EXTENDING"
                  const playTitle = sessStatus === "EXTENDING" ? "Đang gia hạn"
                    : sessStatus === "CHECKING_OUT" ? "Đang hoàn tất checkout"
                    : sessStatus === "COMPLETED" || timelineStatus === "COMPLETED" ? "Đã kết thúc phiên chơi"
                    : "Đang chơi"
                  const playDesc = (sessStatus === "ACTIVE" || sessStatus === "EXTENDING")
                    ? `Kết thúc dự kiến: ${new Date(sess!.plannedEndAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`
                    : sessStatus === "CHECKING_OUT"
                    ? "Nhân viên đang kiểm tra tình trạng xe trả"
                    : sess?.actualEndAt
                    ? `Kết thúc lúc ${new Date(sess.actualEndAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`
                    : "Phiên chơi đã kết thúc"

                  // Completion step
                  const completedDesc = timelineStatus === "NO_SHOW"
                    ? "Khách không đến check-in đúng hạn"
                    : timelineStatus === "COMPLETED" && sess?.actualEndAt
                    ? formatDateTime(new Date(sess.actualEndAt))
                    : "Sau khi check-out hoàn tất"

                  return (
                    <div className="relative space-y-6 pl-8">
                      <div className="absolute left-3 top-3 h-[calc(100%-24px)] w-px bg-border" />
                      <TimelineItem
                        icon={CheckCircle2}
                        title="Đặt thành công"
                        description={formatDateTime(new Date(booking.createdAt))}
                        done={timelineStatus !== "PENDING"}
                      />
                      {timelineStatus === "PENDING" && paymentExpiry && (
                        <TimelineItem
                          icon={Clock3}
                          title="Chờ thanh toán"
                          description={`Hết hạn: ${formatDateTime(paymentExpiry)}`}
                        />
                      )}
                      <TimelineItem
                        icon={checkInWindowExpired ? XCircle : checkinDone ? CheckCircle2 : Clock3}
                        title={checkinTitle}
                        description={checkinDesc}
                        done={checkinDone && !checkinActive}
                        active={checkinActive}
                      />
                      {showPlayStep && (
                        <TimelineItem
                          icon={playDone ? CheckCircle2 : Gamepad2}
                          title={playTitle}
                          description={playDesc}
                          done={playDone}
                          active={playActive}
                        />
                      )}
                      <TimelineItem
                        icon={CalendarClock}
                        title={timelineStatus === "NO_SHOW" ? "Không đến" : "Hoàn thành"}
                        description={completedDesc}
                        done={timelineStatus === "COMPLETED"}
                      />
                    </div>
                  )
                })()}
              </CardContent>
            </Card>

            {/* Booking details */}
            <Card className="rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle>Thông tin đặt sân</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Cafe info */}
                {booking.cafe && (
                  <div className="flex gap-3">
                    <MapPin className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Chi nhánh</p>
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{booking.cafe.name}</p>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${booking.cafe.name} ${booking.cafe.address} ${booking.cafe.city}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600 hover:bg-blue-100 transition-colors"
                        >
                          <Navigation className="h-3 w-3" />
                          Chỉ đường
                        </a>
                      </div>
                      <p className="text-sm text-muted-foreground">{booking.cafe.address}{booking.cafe.city ? `, ${booking.cafe.city}` : ""}</p>
                    </div>
                  </div>
                )}

                <div className="grid gap-5 sm:grid-cols-2">
                  <DetailLine icon={Clock3} label="Thời gian" value={slotLabel} />
                  <DetailLine
                    icon={Car}
                    label="Chế độ chơi"
                    value={booking.playMode === "RENTAL" ? "Thuê xe quán" : "Mang xe riêng"}
                  />
                  {booking.track_type_name && (
                    <DetailLine icon={MapPin} label="Loại sân" value={booking.track_type_name} />
                  )}
                  <DetailLine
                    icon={Users}
                    label="Số người chơi"
                    value={`${playerCount} người`}
                  />
                  {booking.playMode === "RENTAL" && booking.vehicles.length > 0 && (
                    <DetailLine
                      icon={Car}
                      label="Xe thuê"
                      value={`${booking.vehicles.length} xe`}
                    />
                  )}
                </div>

                {/* Participants list */}
                {booking.participants.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Danh sách người chơi</p>
                      <div className="space-y-2">
                        {booking.participants.map((p, i) => {
                          const isBooker = p.isPrimaryResponsible || p.participantType === "BOOKER"
                          const name = p.resolvedName ?? (isBooker ? "Người đặt" : `Khách ${i}`)
                          const phone = p.resolvedPhone
                          return (
                            <div key={p.id} className="flex items-center gap-2 text-sm">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                                {i + 1}
                              </span>
                              <span className="font-medium">{name}</span>
                              {phone && <span className="text-muted-foreground">· {phone}</span>}
                              {isBooker && (
                                <span className="ml-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-600">
                                  Người đặt
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Rental vehicles detail */}
            {booking.playMode === "RENTAL" && booking.vehicles.length > 0 && (
              <Card className="rounded-xl shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    Xe thuê
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {booking.vehicles.map((v, i) => (
                    <div key={v.id} className="flex items-center gap-4 rounded-xl border p-3">
                      <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                        <VehicleImage
                          imageUrl={v.coverImageUrl}
                          alt={v.catalogName ?? "Xe thuê"}
                          className="h-full w-full object-cover"
                          fallbackClassName="bg-muted text-muted-foreground/50"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{v.catalogName ?? `Xe ${i + 1}`}</p>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {v.tier && <span className="capitalize">{TIER_LABELS[v.tier] ?? v.tier}</span>}
                          {v.color && <span>{v.color}</span>}
                          {v.identifier && <span>#{v.identifier}</span>}
                        </div>
                      </div>
                      {v.rentalFeeSnapshot != null && (
                        <div className="text-right text-sm shrink-0">
                          <p className="text-xs text-muted-foreground">Phí thuê</p>
                          <p className="font-semibold">{formatCurrency(Number(v.rentalFeeSnapshot))}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* F&B order */}
            {booking.fnb_order && booking.fnb_order.items.length > 0 && (
              <Card className="rounded-xl shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UtensilsCrossed className="h-5 w-5" />
                    Đồ ăn & thức uống
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {booking.fnb_order.items.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.itemName ?? "Sản phẩm"}</p>
                        {item.notes && (
                          <p className="text-xs text-muted-foreground">{item.notes}</p>
                        )}
                      </div>
                      <div className="text-right text-sm">
                        <p className="text-muted-foreground">×{item.quantity} · {formatCurrency(Number(item.unitPrice))}</p>
                        <p className="font-semibold">{formatCurrency(Number(item.subtotal))}</p>
                      </div>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Tổng F&B</span>
                    <span>{formatCurrency(booking.fnb_order.items.reduce((s, i) => s + Number(i.subtotal), 0))}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Check-in handover photos */}
            {checkInPhotos.length > 0 && (
              <Card className="rounded-xl shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Ảnh bàn giao xe (Check-in)
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Tình trạng xe tại thời điểm bàn giao — nhân viên chụp trước khi phiên chơi bắt đầu.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {checkInPhotos.map((photo, idx) => (
                      <div key={idx} className="overflow-hidden rounded-xl border border-border">
                        <img
                          src={photo.url}
                          alt={DIRECTION_LABELS[photo.direction] ?? photo.direction}
                          className="w-full aspect-video object-cover"
                        />
                        <div className="bg-muted/50 px-2.5 py-1.5">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                            {DIRECTION_LABELS[photo.direction] ?? photo.direction}
                          </p>
                          {photo.notes && (
                            <p className="mt-0.5 text-[11px] leading-tight text-foreground">{photo.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Check-out return photos */}
            {checkOutPhotos.length > 0 && (
              <Card className="rounded-xl shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Ảnh trả xe (Check-out)
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Tình trạng xe sau khi phiên chơi kết thúc — làm căn cứ đối chiếu hư hỏng (nếu có).
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {checkOutPhotos.map((photo, idx) => (
                      <div key={idx} className="overflow-hidden rounded-xl border border-border">
                        <img
                          src={photo.url}
                          alt={DIRECTION_LABELS[photo.direction] ?? photo.direction}
                          className="w-full aspect-video object-cover"
                        />
                        <div className="bg-muted/50 px-2.5 py-1.5">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                            {DIRECTION_LABELS[photo.direction] ?? photo.direction}
                          </p>
                          {photo.notes && (
                            <p className="mt-0.5 text-[11px] leading-tight text-foreground">{photo.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </main>

          <aside className="space-y-4">
            {booking.status === "CONFIRMED" && !checkInWindowExpired && new Date() < new Date(booking.slotEnd) && (
              <Card className="rounded-xl text-center shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-center gap-2">
                    <QrCode className="h-4 w-4 text-orange-500" />
                    Mã Check-in
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Quét mã này tại quầy để nhận xe</p>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-3">
                  <div className="p-3 bg-white border rounded-xl shadow-sm">
                    <img
                      src={`${env.apiUrl}/v1/bookings/${bookingId}/qr`}
                      width={180}
                      height={180}
                      alt="QR Check-in"
                      className="rounded"
                    />
                  </div>
                  <Badge variant="secondary" className="font-mono tracking-widest">
                    #{booking.id.substring(0, 8).toUpperCase()}
                  </Badge>
                </CardContent>
              </Card>
            )}

            <Card className="rounded-xl shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Thanh toán</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Block 1: VNPAY prepayment */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span className="text-xs font-bold text-emerald-700">
                      {booking.status === "PENDING"
                        ? "Sẽ thanh toán qua VNPAY"
                        : prepaidTx
                          ? `Đã trả qua ${gatewayLabel(prepaidTx.gateway)}`
                          : "Đã trả qua VNPAY"}
                    </span>
                  </div>
                  <div className="pl-5 space-y-1.5">
                    {slotFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Phí lịch sân</span>
                        <span className="font-semibold tabular-nums">{formatCurrency(slotFee)}</span>
                      </div>
                    )}
                    {rentalFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Phí thuê xe</span>
                        <span className="font-semibold tabular-nums">{formatCurrency(rentalFee)}</span>
                      </div>
                    )}
                    {fnbPreorderFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">F&B đặt trước</span>
                        <span className="font-semibold tabular-nums">{formatCurrency(fnbPreorderFee)}</span>
                      </div>
                    )}
                    {depositAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Tiền cọc xe</span>
                        <span className="font-semibold tabular-nums">{formatCurrency(depositAmount)}</span>
                      </div>
                    )}
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Mã giảm giá</span>
                        <span className="font-semibold text-emerald-600 tabular-nums">−{formatCurrency(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold border-t border-slate-100 pt-1.5">
                      <span className="text-slate-800">Tổng đã trả</span>
                      <span className="text-slate-900 tabular-nums">{formatCurrency(slotFee + rentalFee + fnbPreorderFee + depositAmount - discountAmount)}</span>
                    </div>
                  </div>
                </div>

                {/* Block 2: End-of-session settlement (active or completed) */}
                {(isActiveSession || booking.status === "COMPLETED") && (depositAmount > 0 || totalEstimatedCounterBill > 0) && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Clock3 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="text-xs font-bold text-slate-600">
                          {isActiveSession ? "Khi kết thúc phiên" : "Quyết toán"}
                        </span>
                        {isActiveSession && <span className="text-[9px] text-slate-400">(ước tính)</span>}
                      </div>
                      <div className="pl-5 space-y-1.5">
                        {depositRefundAmount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Hoàn cọc xe</span>
                            <span className="font-semibold text-emerald-600 tabular-nums">+{formatCurrency(depositRefundAmount)}</span>
                          </div>
                        )}
                        {depositConsumedByDamage > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Khấu trừ hư hỏng</span>
                            <span className="font-semibold text-rose-600 tabular-nums">−{formatCurrency(depositConsumedByDamage)}</span>
                          </div>
                        )}
                        {counterComponents.map((c) => (
                          <div key={c.id} className="flex justify-between text-sm">
                            <span className="text-slate-500">{formatComponentType(c.type)}</span>
                            <span className="font-semibold text-orange-600 tabular-nums">+{formatCurrency(Number(c.amount))}</span>
                          </div>
                        ))}
                        {onsiteFnbTotal > 0 && !hasSettledFnbComponent && (
                          <div className="flex justify-between text-sm items-start">
                            <div>
                              <span className="text-slate-500">F&B gọi tại quầy</span>
                              <p className="text-[10px] text-slate-400 leading-tight">thanh toán tiền mặt</p>
                            </div>
                            <span className="font-semibold text-orange-600 tabular-nums">+{formatCurrency(onsiteFnbTotal)}</span>
                          </div>
                        )}
                        {damageExceedingDeposit > 0 && (
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500">{depositAmount > 0 ? "Hư hỏng vượt cọc" : "Phí đền bù hư hỏng xe"}</span>
                              <span className="font-semibold text-rose-600 tabular-nums">+{formatCurrency(damageExceedingDeposit)}</span>
                            </div>
                            {(() => {
                              const lineItems = booking?.damage_breakdown?.lineItems?.length
                                ? booking.damage_breakdown.lineItems.map((item) => ({
                                    id: item.id,
                                    partType: item.partType,
                                    customPartName: item.customPartName,
                                    partsPrice: item.partsPrice,
                                    laborPrice: item.laborPrice,
                                    subtotal: item.subtotal,
                                  }))
                                : (sessionDetail?.damageClaim?.damageLineItems ?? []).map((item) => ({
                                    id: item.id,
                                    partType: item.partType,
                                    customPartName: item.customPartName,
                                    partsPrice: item.partsPrice,
                                    laborPrice: item.laborPrice,
                                    subtotal: item.lineTotal,
                                  }))
                              return lineItems.length > 0 ? (
                                <div className="ml-2 space-y-1 rounded-lg bg-rose-50 border border-rose-100 p-2.5">
                                  {lineItems.map((item) => (
                                    <div key={item.id} className="flex items-start justify-between text-[11px]">
                                      <div className="space-y-0.5">
                                        <p className="font-bold text-rose-900">
                                          {PART_TYPE_LABELS[item.partType] ?? item.partType}
                                          {item.customPartName && <span className="font-normal text-rose-700"> — {item.customPartName}</span>}
                                        </p>
                                        <div className="flex gap-2 text-[10px] text-rose-600">
                                          <span>Linh kiện: {formatCurrency(item.partsPrice)}</span>
                                          {item.laborPrice > 0 && <span>Công: {formatCurrency(item.laborPrice)}</span>}
                                        </div>
                                      </div>
                                      <span className="font-bold text-rose-700 tabular-nums shrink-0 pl-2">{formatCurrency(item.subtotal)}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : null
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <PackageUsedBadge snapshot={booking.snapshot} />

                {/* Status footer */}
                {!isPaid && totalCounterBill > 0 ? (
                  <div className="space-y-3">
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 font-medium leading-relaxed">
                      Còn <strong>{formatCurrency(totalCounterBill)}</strong> phí phát sinh chưa thanh toán
                    </div>
                    {role === "customer" && (
                      <Button
                        onClick={handlePayAdditionalFees}
                        disabled={payingAdditional}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs h-10 rounded-xl"
                      >
                        {payingAdditional ? "Đang khởi tạo..." : "Thanh toán qua VNPAY"}
                      </Button>
                    )}
                    {role === "staff" && (
                      <Button
                        onClick={handleSettleCash}
                        disabled={settlingCash}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-10 rounded-xl"
                      >
                        {settlingCash ? "Đang xác nhận..." : "✓ Xác nhận đã thu tiền mặt"}
                      </Button>
                    )}
                  </div>
                ) : totalCounterBill > 0 && isPaid ? (
                  <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-xs text-emerald-700 font-bold flex items-center gap-1.5 justify-center">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Đã thanh toán đầy đủ
                    {(counterTx || additionalVnpayTx) && (
                      <span className="ml-1 font-normal text-emerald-600">
                        · {gatewayLabel((counterTx ?? additionalVnpayTx)!.gateway)}
                      </span>
                    )}
                  </div>
                ) : booking.status === "PENDING" ? (
                  <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-xs text-amber-700 font-medium text-center">
                    Chờ thanh toán
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {hasRefund && (
              <Card className="rounded-xl shadow-sm border border-emerald-100 bg-emerald-50/10">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-800">
                    <RotateCcw className="h-4 w-4 text-emerald-600" />
                    Thông tin hoàn tiền
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5 text-xs">
                    {refundSlotFee > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Hoàn phí lịch sân (Slot Fee):</span>
                        <span className="font-semibold">{formatCurrency(refundSlotFee)}</span>
                      </div>
                    )}
                    {refundRentalFee > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Hoàn phí thuê xe (Rental Fee):</span>
                        <span className="font-semibold">{formatCurrency(refundRentalFee)}</span>
                      </div>
                    )}
                    {refundDeposit > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Hoàn tiền cọc xe (Deposit):</span>
                        <span className="font-semibold">{formatCurrency(refundDeposit)}</span>
                      </div>
                    )}
                    {refundFnb > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Hoàn F&B đặt trước:</span>
                        <span className="font-semibold">{formatCurrency(refundFnb)}</span>
                      </div>
                    )}
                    <div className="border-t border-dashed border-slate-200 pt-2 flex justify-between font-extrabold text-slate-800 text-sm">
                      <span>Tổng tiền hoàn:</span>
                      <span className="text-emerald-600">{formatCurrency(totalRefundAmount)}</span>
                    </div>
                  </div>

                  {isRefundPending ? (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-850">
                        <Clock3 className="h-3.5 w-3.5 text-amber-600" />
                        Đang chờ hoàn tiền tại quầy
                      </div>
                      <p className="text-[10px] text-amber-700 leading-relaxed font-semibold">
                        Giao dịch hoàn tiền đang được nhân viên xử lý thủ công (tiền mặt/chuyển khoản) tại quầy.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-emerald-100/70 border border-emerald-200 p-3 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        Đã hoàn tiền thành công
                      </div>
                      <p className="text-[10px] text-emerald-700 leading-relaxed font-semibold">
                        Nhân viên đã xác nhận hoàn trả đầy đủ {formatCurrency(totalRefundAmount)} cho quý khách tại quầy.
                      </p>
                    </div>
                  )}

                  {isRefundPending && role === "staff" && (
                    <Button
                      onClick={handleConfirmRefund}
                      disabled={confirmingRefund}
                      className="w-full bg-[#ea580c] hover:bg-[#ea580c]/90 text-white font-extrabold text-xs h-10 rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      {confirmingRefund ? (
                        "Đang xử lý..."
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Xác nhận đã hoàn tiền
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {["PENDING", "CONFIRMED"].includes(booking.status) && !checkInWindowExpired && (
              <>
                <Button variant="outline" className="w-full" disabled>
                  <RotateCcw className="h-4 w-4" /> Thay đổi lịch
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setShowCancelDialog(true)}
                >
                  <XCircle className="h-4 w-4" /> Hủy đơn
                </Button>
              </>
            )}
          </aside>
        </div>
      </div>

      {showCancelDialog && (
        <CancelDialog
          booking={booking}
          onConfirm={handleCancelConfirm}
          onCancel={() => setShowCancelDialog(false)}
          isPending={cancelMutation.isPending}
        />
      )}
    </div>
  )
}

function PackageUsedBadge({ snapshot }: { snapshot: Record<string, unknown> | null }) {
  if (!snapshot) return null
  const pkg = snapshot.package_used as { package_name?: string; slots_used?: number } | undefined
  if (!pkg?.package_name) return null
  return (
    <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs">
      <Layers className="h-3.5 w-3.5 shrink-0 text-orange-500" />
      <div className="flex-1 min-w-0">
        <span className="font-semibold text-orange-800">Gói slot: </span>
        <span className="text-orange-700">{pkg.package_name}</span>
      </div>
      {pkg.slots_used != null && (
        <span className="shrink-0 font-bold text-orange-600">−{pkg.slots_used} slot</span>
      )}
    </div>
  )
}

function TimelineItem({ icon: Icon, title, description, done = false, active = false }: {
  icon: typeof CheckCircle2; title: string; description: string; done?: boolean; active?: boolean
}) {
  return (
    <div className="relative">
      <span className={`absolute -left-8 flex h-7 w-7 items-center justify-center rounded-full border bg-background ${
        done ? "text-emerald-600 border-emerald-200" :
        active ? "text-orange-500 border-orange-200 bg-orange-50" :
        "text-muted-foreground"
      }`}>
        <Icon className="h-4 w-4" />
      </span>
      <p className={`font-semibold ${active ? "text-orange-600" : ""}`}>{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function DetailLine({ icon: Icon, label, value }: { icon: typeof Car; label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 font-semibold">{value}</p>
      </div>
    </div>
  )
}

function formatComponentType(type: PaymentComponentType): string {
  const map: Partial<Record<PaymentComponentType, string>> = {
    SLOT_FEE: "Phí lịch chơi",
    RENTAL_FEE: "Phí thuê xe",
    SECURITY_DEPOSIT: "Cọc xe dự phòng",
    FNB_PREORDER: "Đồ ăn & nước uống",
    FB_PREORDER: "Đồ ăn & nước uống",
    EXTENSION_FEE: "Phí gia hạn",
    DAMAGE_CHARGE: "Phí thiệt hại",
    PLATFORM_FEE: "Phí nền tảng",
  }
  return map[type] ?? type
}

function formatCountdown(totalSecs: number) {
  const hours = Math.floor(totalSecs / 3600)
  const mins = Math.floor((totalSecs % 3600) / 60)
  const secs = totalSecs % 60
  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false })
}

function formatDate(d: Date) {
  return d.toLocaleDateString("vi-VN")
}

function formatDateTime(d: Date) {
  return `${formatDate(d)}, ${formatTime(d)}`
}
