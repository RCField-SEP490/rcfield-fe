import { useState } from "react"
import { AlertTriangle, CalendarClock, Car, CheckCircle2, Clock3, CreditCard, MapPin, QrCode, RotateCcw, XCircle } from "lucide-react"
import { Link, useParams } from "react-router"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Separator } from "@/shared/ui/separator"
import { formatCurrency } from "@/shared/lib/format"
import { useBooking, useCancelBooking } from "@/features/booking/hooks/use-booking"
import type { BookingResponse, BookingStatus, PaymentComponentType } from "@/features/booking/types/booking.types"
import { toast } from "sonner"

const STATUS_LABELS: Record<BookingStatus, { label: string; className: string }> = {
  PENDING: { label: "Chờ thanh toán", className: "bg-amber-100 text-amber-700" },
  CONFIRMED: { label: "Đã xác nhận", className: "bg-emerald-100 text-emerald-700" },
  NO_SHOW: { label: "Không đến", className: "bg-orange-100 text-orange-700" },
  COMPLETED: { label: "Hoàn thành", className: "bg-indigo-100 text-indigo-700" },
  CANCELLED: { label: "Đã hủy", className: "bg-red-100 text-red-700" },
}

/** Client-side R1 refund estimate (customer cancels) */
function estimateRefund(booking: BookingResponse): { slotFee: number; rest: number; total: number; policy: string } {
  const hoursUntilSlot = (new Date(booking.slotStart).getTime() - Date.now()) / 3_600_000

  const slotFeeComponent = booking.payment_components.find((c) => c.type === "SLOT_FEE")
  const slotFee = slotFeeComponent?.amount ?? 0
  const rest = booking.payment_components
    .filter((c) => c.type !== "SLOT_FEE")
    .reduce((sum, c) => sum + c.amount, 0)

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
  booking,
  onConfirm,
  onCancel,
  isPending,
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

  const total = booking?.payment_components?.reduce((sum, c) => sum + c.amount, 0) ?? 0
  const statusInfo = booking ? (STATUS_LABELS[booking.status] ?? STATUS_LABELS.PENDING) : null

  const handleCancelConfirm = () => {
    if (!booking) return
    cancelMutation.mutate(
      { bookingId: booking.id },
      {
        onSuccess: () => {
          setShowCancelDialog(false)
          toast.success("Đã hủy đơn đặt lịch")
        },
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
                    done={booking.status !== 'PENDING'}
                  />
                  {booking.status === 'PENDING' && paymentExpiry && (
                    <TimelineItem
                      icon={Clock3}
                      title="Chờ thanh toán"
                      description={`Hết hạn: ${formatDateTime(paymentExpiry)}`}
                    />
                  )}
                  <TimelineItem icon={Clock3} title="Chờ check-in" description={`Dự kiến: ${slotLabel}`} done={['CHECKED_IN','COMPLETED'].includes(booking.status)} />
                  <TimelineItem icon={CalendarClock} title="Hoàn thành" description="Sau khi check-out" done={booking.status === 'COMPLETED'} />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle>Thông tin chi tiết</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5 sm:grid-cols-2">
                <DetailLine icon={Car} label="Chế độ chơi" value={booking.playMode === 'RENTAL' ? 'Thuê xe quán' : 'Mang xe riêng'} />
                <DetailLine icon={MapPin} label="Mã cơ sở" value={booking.cafeId.substring(0, 8).toUpperCase()} />
                <DetailLine icon={CreditCard} label="Số xe" value={booking.vehicles?.length ? `${booking.vehicles.length} xe` : 'Không có'} />
                <DetailLine icon={Clock3} label="Thời gian" value={slotLabel} />
              </CardContent>
            </Card>
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
                {booking.payment_components.map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{formatComponentType(c.type)}</span>
                    <span className="font-medium">{formatCurrency(c.amount)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>Tổng cộng</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                {booking.status === 'CONFIRMED' && (
                  <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">Đã thanh toán qua VNPAY</div>
                )}
                {booking.status === 'PENDING' && (
                  <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">Chờ thanh toán</div>
                )}
              </CardContent>
            </Card>

            {['PENDING', 'CONFIRMED'].includes(booking.status) && (
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

function TimelineItem({ icon: Icon, title, description, done = false }: { icon: typeof CheckCircle2; title: string; description: string; done?: boolean }) {
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
      <Icon className="mt-1 h-5 w-5 text-muted-foreground" />
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 font-semibold">{value}</p>
      </div>
    </div>
  )
}

function formatComponentType(type: PaymentComponentType): string {
  const map: Record<PaymentComponentType, string> = {
    SLOT_FEE: "Phí lịch chơi",
    RENTAL_FEE: "Phí thuê xe",
    SECURITY_DEPOSIT: "Cọc xe dự phòng",
    FNB_PREORDER: "F&B preorder",
    EXTENSION_FEE: "Phí gia hạn",
    DAMAGE_CHARGE: "Phí thiệt hại",
    PLATFORM_FEE: "Phí nền tảng",
  }
  return map[type] ?? type
}

function formatTime(d: Date) {
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatDate(d: Date) {
  return d.toLocaleDateString('vi-VN')
}

function formatDateTime(d: Date) {
  return `${formatDate(d)}, ${formatTime(d)}`
}
