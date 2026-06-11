import { useState } from "react"
import {
  AlertTriangle, CalendarClock, Car, CheckCircle2, Clock3,
  CreditCard, ImageOff, MapPin, Navigation, QrCode, RotateCcw, Users, UtensilsCrossed, XCircle,
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
  const { data: booking, isLoading } = useBooking(bookingId)
  const cancelMutation = useCancelBooking()
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  const componentsTotal = booking?.payment_components?.reduce((sum, c) => sum + Number(c.amount), 0) ?? 0
  const snapshotTotal = (booking?.snapshot as Record<string, unknown> | null)?.total_charged as number | undefined
  const total = componentsTotal > 0 ? componentsTotal : (snapshotTotal ?? 0)
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

  if (!booking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Không tìm thấy đơn đặt lịch.</p>
        <Button asChild variant="outline"><Link to="/customer/bookings">Quay lại</Link></Button>
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
          <Link to="/customer/bookings" className="hover:text-foreground">Quay lại danh sách</Link>
          <span className="mx-2">/</span>
          <span>Đơn đặt #{booking.id.substring(0, 8).toUpperCase()}</span>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <main className="space-y-4">
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
                <CardTitle>Thanh toán</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {booking.payment_components.length > 0 ? (
                  booking.payment_components.map((c) => (
                    <div key={c.id} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{formatComponentType(c.type)}</span>
                      <span className="font-medium">{formatCurrency(Number(c.amount))}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Chưa có thông tin thanh toán.</p>
                )}
                <Separator />
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>Tổng cộng</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                {booking.status === "CONFIRMED" && (
                  <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">Đã thanh toán qua VNPAY</div>
                )}
                {booking.status === "PENDING" && (
                  <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">Chờ thanh toán</div>
                )}
              </CardContent>
            </Card>

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
