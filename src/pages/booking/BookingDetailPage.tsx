import { useState } from "react"
import {
  AlertTriangle, CalendarClock, Car, CheckCircle2, Clock3,
  ImageOff, Layers, MapPin, Navigation, QrCode, RotateCcw, Users, UtensilsCrossed, XCircle,
} from "lucide-react"
import { Link, useParams } from "react-router"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Separator } from "@/shared/ui/separator"
import { formatCurrency } from "@/shared/lib/format"
import { useBooking, useCancelBooking } from "@/features/booking/hooks/use-booking"
import type { BookingResponse, BookingStatus, PaymentComponentType } from "@/features/booking/types/booking.types"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { bookingApi, bookingQueryKeys } from "@/features/booking/api/booking.api"
import { useAuthStore } from "@/features/auth/stores/auth.store"
import { staffApi } from "@/features/staff/api/staff.api"

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
            <span>Hoàn phí khác (thuê xe, cọc, F&B)</span>
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

  const [payingAdditional, setPayingAdditional] = useState(false)

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
  const snapshotDeposit = Number(
    (snapshot?.vehicles as Array<Record<string, unknown>> | undefined)?.reduce((sum: number, v: Record<string, unknown>) => sum + Number(v.security_deposit ?? 0), 0) ??
    snapshot?.deposit_amount ??
    0
  )
  const snapshotFnbPreorder = Number(snapshot?.fnb_total ?? snapshot?.fnb_preorder_fee ?? 0)

  const slotFee = Number(booking?.payment_components?.find((c) => c.type === "SLOT_FEE")?.amount ?? snapshotSlotFee)
  const rentalFee = Number(booking?.payment_components?.find((c) => c.type === "RENTAL_FEE")?.amount ?? snapshotRentalFee)
  const depositComponent = booking?.payment_components?.find((c) => c.type === "SECURITY_DEPOSIT")
  const depositAmount = Number(depositComponent?.amount ?? snapshotDeposit)
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

  // ── Best Practice: Deposit ONLY offsets vehicle damage ──
  const depositConsumedByDamage = Math.min(depositAmount, damageCharge)
  const depositRefundAmount = depositAmount - depositConsumedByDamage
  const damageExceedingDeposit = Math.max(0, damageCharge - depositAmount)

  // Counter bill = F&B onsite + Extension + damage exceeding deposit
  const counterComponents = onsiteComponents.filter((c) => c.type !== "DAMAGE_CHARGE")
  const totalCounterServiceBill = counterComponents.reduce((sum, c) => sum + Number(c.amount), 0)
  const totalCounterBill = totalCounterServiceBill + damageExceedingDeposit

  const isPaid = !booking?.payment_components?.some((c) => c.status === "PENDING")

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

  const statusInfo = booking ? (STATUS_LABELS[booking.status] ?? STATUS_LABELS.PENDING) : null

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
            {booking.session && ["ACTIVE", "CHECKED_IN", "EXTENDING", "CHECKING_OUT"].includes(booking.session.status) && !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(booking.status) && (
              <Card className="border-emerald-200 bg-emerald-50/50 shadow-sm rounded-xl">
                <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                      <Clock3 className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">
                        {booking.session.status === "CHECKED_IN" ? "Phiên chơi chuẩn bị diễn ra" : "Phiên chơi đang diễn ra"}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Giờ kết thúc dự kiến: {new Date(booking.session.plannedEndAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold px-5">
                    <Link to={role === "staff" ? `/staff/sessions/${booking.session.id}` : `/customer/sessions/${booking.session.id}`}>
                      Vào phiên chơi
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Header card */}
            <Card className="rounded-xl shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-3xl">Đơn đặt #{booking.id.substring(0, 8).toUpperCase()}</CardTitle>
                  <p className="mt-2 text-muted-foreground">Ngày tạo: {formatDateTime(new Date(booking.createdAt))}</p>
                </div>
                {statusInfo && (
                  <Badge className={`${statusInfo.className} hover:${statusInfo.className}`}>{statusInfo.label}</Badge>
                )}
              </CardHeader>
              <CardContent>
                <div className="relative space-y-6 pl-8">
                  <div className="absolute left-3 top-3 h-[calc(100%-24px)] w-px bg-border" />
                  <TimelineItem
                    icon={CheckCircle2}
                    title="Đặt thành công"
                    description={formatDateTime(new Date(booking.createdAt))}
                    done={booking.status !== "PENDING"}
                  />
                  {booking.status === "PENDING" && paymentExpiry && (
                    <TimelineItem
                      icon={Clock3}
                      title="Chờ thanh toán"
                      description={`Hết hạn: ${formatDateTime(paymentExpiry)}`}
                    />
                  )}
                  <TimelineItem
                    icon={Clock3}
                    title="Chờ check-in"
                    description={`Dự kiến: ${slotLabel}`}
                    done={["CHECKED_IN", "COMPLETED"].includes(booking.status)}
                  />
                  <TimelineItem
                    icon={CalendarClock}
                    title="Hoàn thành"
                    description="Sau khi check-out"
                    done={booking.status === "COMPLETED"}
                  />
                </div>
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
                        {v.coverImageUrl ? (
                          <img src={v.coverImageUrl} alt={v.catalogName ?? "Xe"} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <ImageOff className="h-6 w-6 text-muted-foreground/40" />
                          </div>
                        )}
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
          </main>

          <aside className="space-y-4">
            {booking.checkInCode && (
              <Card className="rounded-xl text-center shadow-sm">
                <CardHeader>
                  <CardTitle>Mã Check-in</CardTitle>
                  <p className="text-sm text-muted-foreground">Quét mã này tại quầy để nhận xe</p>
                </CardHeader>
                <CardContent>
                  <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-xl border bg-muted">
                    <QrCode className="h-28 w-28 text-foreground" />
                  </div>
                  <Badge variant="secondary" className="mt-3">{booking.checkInCode}</Badge>
                </CardContent>
              </Card>
            )}

            <Card className="rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle>Chi tiết thanh toán</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 1. Prepaid online */}
                <div className="space-y-2 pb-2 border-b border-dashed">
                  <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">
                    1. Đã thanh toán (VNPAY)
                  </span>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Phí lịch sân (Slot Fee)</span>
                    <span className="font-medium">{formatCurrency(slotFee)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Phí thuê xe (Rental Fee)</span>
                    <span className="font-medium">{formatCurrency(rentalFee)}</span>
                  </div>
                  {fnbPreorderFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">F&B trả trước (Preordered)</span>
                      <span className="font-medium">{formatCurrency(fnbPreorderFee)}</span>
                    </div>
                  )}
                </div>

                {/* 2. Vehicle Deposit Refund (Asset protection only) */}
                {depositAmount > 0 && (
                  <div className="space-y-2 pb-2 border-b border-dashed">
                    <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider block">
                      2. Tiền cọc xe (Deposit Refund)
                    </span>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tiền cọc đã giữ:</span>
                      <span className="font-medium">{formatCurrency(depositAmount)}</span>
                    </div>
                    {damageCharge > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Khấu trừ đền bù hư hỏng xe:</span>
                        <span className="font-medium text-rose-600">−{formatCurrency(depositConsumedByDamage)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm border-t pt-1.5 mt-1">
                      <span className="text-blue-700 font-semibold">Tiền cọc hoàn lại (Deposit Refund):</span>
                      <span className="font-bold text-emerald-600">{formatCurrency(depositRefundAmount)}</span>
                    </div>
                  </div>
                )}

                {/* 3. Counter service bill (if any onsite fees) */}
                {(counterComponents.length > 0 || damageExceedingDeposit > 0) && (
                  <div className="space-y-2 pb-2 border-b border-dashed">
                    <span className="text-[10px] font-extrabold text-[#ea580c] uppercase tracking-wider block">
                      3. Chi phí dịch vụ tại quầy
                    </span>
                    {counterComponents.map((c) => (
                      <div key={c.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{formatComponentType(c.type)}</span>
                        <span className="font-medium">+{formatCurrency(Number(c.amount))}</span>
                      </div>
                    ))}
                    {damageExceedingDeposit > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Đền bù hư hỏng vượt cọc:</span>
                        <span className="font-medium text-rose-600">+{formatCurrency(damageExceedingDeposit)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm border-t pt-1.5 mt-1">
                      <span className="text-muted-foreground font-semibold">Tổng dịch vụ tại quầy:</span>
                      <span className="font-bold text-[#ea580c]">{formatCurrency(totalCounterBill)}</span>
                    </div>
                  </div>
                )}

                {/* Real-time settlement status (independent transactions) */}
                {(depositAmount > 0 || totalCounterBill > 0) && booking.status === "COMPLETED" && (
                  <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block">
                      Quyết toán thực tế tại quầy
                    </span>
                    {depositRefundAmount > 0 && (
                      <div className="flex justify-between text-xs text-slate-600 border-b border-dashed border-slate-200 pb-1.5 mb-1.5">
                        <span className="font-semibold text-slate-700">1. Hoàn trả cọc xe (Deposit Refund):</span>
                        <span className="font-bold text-emerald-600">{formatCurrency(depositRefundAmount)}</span>
                      </div>
                    )}
                    {totalCounterBill > 0 && (
                      <div className="flex justify-between text-xs text-slate-600">
                        <span className="font-semibold text-slate-700">2. Thanh toán dịch vụ (On-site Bill):</span>
                        <span className="font-bold text-[#ea580c]">{formatCurrency(totalCounterBill)}</span>
                      </div>
                    )}
                  </div>
                )}

                <PackageUsedBadge snapshot={booking.snapshot} />

                {/* Status indicators */}
                {!isPaid && totalCounterBill > 0 ? (
                  <div className="space-y-3">
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 leading-relaxed font-medium">
                      ⚠️ <strong>Chờ thanh toán phát sinh:</strong> Vui lòng thanh toán <strong>{formatCurrency(totalCounterBill)}</strong> phí dịch vụ phát sinh để hoàn tất phiên chơi.
                    </div>
                    {role === "customer" && (
                      <Button
                        onClick={handlePayAdditionalFees}
                        disabled={payingAdditional}
                        className="w-full bg-[#ea580c] hover:bg-[#ea580c]/90 text-white font-extrabold text-xs h-10 rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98]"
                      >
                        {payingAdditional ? (
                          "Đang khởi tạo thanh toán..."
                        ) : (
                          <>
                            💰 Thanh toán dịch vụ qua VNPAY
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                ) : totalCounterBill > 0 && isPaid ? (
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-bold text-center">
                    ✅ Đã thanh toán đầy đủ dịch vụ tại quầy
                  </div>
                ) : booking.status === "CONFIRMED" ? (
                  <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">Đã thanh toán qua VNPAY</div>
                ) : booking.status === "PENDING" ? (
                  <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">Chờ thanh toán</div>
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

            {["PENDING", "CONFIRMED"].includes(booking.status) && (
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

function TimelineItem({ icon: Icon, title, description, done = false }: {
  icon: typeof CheckCircle2; title: string; description: string; done?: boolean
}) {
  return (
    <div className="relative">
      <span className={`absolute -left-8 flex h-7 w-7 items-center justify-center rounded-full border bg-background ${done ? "text-emerald-600" : "text-muted-foreground"}`}>
        <Icon className="h-4 w-4" />
      </span>
      <p className="font-semibold">{title}</p>
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

function formatTime(d: Date) {
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false })
}

function formatDate(d: Date) {
  return d.toLocaleDateString("vi-VN")
}

function formatDateTime(d: Date) {
  return `${formatDate(d)}, ${formatTime(d)}`
}
