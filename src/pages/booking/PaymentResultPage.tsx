import {
  AlertCircle,
  CalendarDays,
  Car,
  CheckCircle2,
  Clock,
  Eye,
  Hash,
  Home,
  Layers,
  Loader2,
  MapPin,
  QrCode,
  RotateCcw,
  ShieldCheck,
  Tag,
  Users,
} from "lucide-react"
import { Link, useSearchParams } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { Separator } from "@/shared/ui/separator"
import { bookingApi, bookingQueryKeys } from "@/features/booking/api/booking.api"
import { formatCurrency } from "@/shared/lib/format"

export function PaymentResultPage() {
  const [searchParams] = useSearchParams()
  const status = searchParams.get("status")
  const txnRef = searchParams.get("txn_ref")
  const reason = searchParams.get("reason")
  const responseCode = searchParams.get("response_code")
  const isSuccess = status === "success"

  const resourceId = txnRef ? txnRefToBookingId(txnRef) : undefined

  const { data: booking, isFetching, isError: bookingError } = useQuery({
    queryKey: bookingQueryKeys.detail(resourceId),
    queryFn: () => bookingApi.getBooking(resourceId!),
    enabled: !!resourceId && isSuccess,
    retry: 1,
    refetchInterval: (query) => {
      const components = query.state.data?.payment_components ?? []
      return isSuccess && components.length === 0 ? 2000 : false
    },
    refetchIntervalInBackground: false,
  })

  const isPackagePurchase = isSuccess && bookingError && !isFetching
  const paymentComponents = booking?.payment_components ?? []
  const discountAmount = Number(booking?.discountAmount ?? 0)
  const grossTotal = paymentComponents.reduce((sum, c) => sum + Number(c.amount), 0)
  const total = Math.max(0, grossTotal - discountAmount)

  // Parse snapshot for extra context (pricing label, promo)
  const snapshot = (booking?.snapshot ?? {}) as Record<string, unknown>
  const pricingLabel = snapshot.pricing_rule_label as string | null | undefined
  const slotMultiplier = (snapshot.slot_fee_multiplier as number | undefined) ?? 1
  const promoApplied = snapshot.promotion_applied as
    | { code: string; discount_type: string; discount_amount: number }
    | undefined

  const vehicles = booking?.vehicles ?? []
  const participants = booking?.participants ?? []
  const isRental = booking?.playMode === "RENTAL"

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-8 md:px-6">
      <div className="mx-auto max-w-2xl space-y-4">

        {/* ── Status header ── */}
        <Card className="overflow-hidden rounded-xl shadow-sm">
          <CardHeader className="border-b bg-background py-10 text-center">
            <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${isSuccess ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
              {isSuccess ? <CheckCircle2 className="h-8 w-8" /> : <AlertCircle className="h-8 w-8" />}
            </div>
            <CardTitle className="mt-4 text-3xl">
              {isSuccess ? "Thanh toán thành công" : "Thanh toán thất bại"}
            </CardTitle>
            {txnRef && (
              <p className="text-sm text-muted-foreground">
                Mã giao dịch: <span className="font-semibold text-foreground">{txnRef}</span>
              </p>
            )}
            {!isSuccess && (reason || responseCode) && (
              <p className="mt-2 text-sm text-red-600">
                {reason ? `Lý do: ${reason}` : `Mã lỗi: ${responseCode}`}
              </p>
            )}
          </CardHeader>
        </Card>

        {/* ── Package purchase (no booking) ── */}
        {isPackagePurchase && (
          <Card className="rounded-xl shadow-sm">
            <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
              <Layers className="h-8 w-8 text-orange-500" />
              <p className="text-sm font-semibold text-slate-700">Gói slot đã được kích hoạt!</p>
              <p className="text-xs text-muted-foreground">
                Bạn có thể dùng gói này khi đặt lịch tại cơ sở tương ứng.
              </p>
            </CardContent>
          </Card>
        )}

        {/* ── Loading state ── */}
        {isSuccess && !booking && !bookingError && (
          <Card className="rounded-xl shadow-sm">
            <CardContent className="flex flex-col items-center gap-2 py-8 text-sm text-muted-foreground">
              {isFetching && <Loader2 className="h-5 w-5 animate-spin" />}
              <p>Đang xác nhận thanh toán{isFetching ? "..." : ". Vui lòng chờ."}</p>
            </CardContent>
          </Card>
        )}

        {/* ── Booking detail ── */}
        {isSuccess && booking && (
          <Card className="rounded-xl shadow-sm">
            <CardContent className="pt-5 space-y-4">

              {/* Booking info */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Thông tin đặt chỗ</p>

                {booking.cafe && (
                  <>
                    <InfoRow icon={<MapPin className="size-4 text-orange-500" />} label="Cơ sở">
                      <span className="font-semibold">{booking.cafe.name}</span>
                    </InfoRow>
                    <InfoRow icon={<MapPin className="size-4 text-muted-foreground/40" />} label="Địa chỉ">
                      {booking.cafe.address}, {booking.cafe.city}
                    </InfoRow>
                  </>
                )}

                <InfoRow icon={<CalendarDays className="size-4 text-orange-500" />} label="Ngày">
                  {new Date(booking.slotStart).toLocaleDateString("vi-VN", {
                    weekday: "long",
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </InfoRow>

                <InfoRow icon={<Clock className="size-4 text-orange-500" />} label="Khung giờ">
                  <span className="font-semibold">
                    {formatTime(booking.slotStart)} – {formatTime(booking.slotEnd)}
                  </span>
                </InfoRow>

                {booking.track_type_name && (
                  <InfoRow icon={<Layers className="size-4 text-orange-500" />} label="Loại sân">
                    {booking.track_type_name}
                  </InfoRow>
                )}

                <InfoRow icon={<Car className="size-4 text-orange-500" />} label="Hình thức">
                  {isRental ? "Thuê xe của quán" : "Mang xe cá nhân"}
                </InfoRow>

                {participants.length > 0 && (
                  <InfoRow icon={<Users className="size-4 text-orange-500" />} label="Người tham gia">
                    {participants.length} người
                  </InfoRow>
                )}

                {pricingLabel && slotMultiplier > 1 && (
                  <InfoRow icon={<Tag className="size-4 text-amber-500" />} label="Phụ thu">
                    <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs font-medium">
                      {pricingLabel} ×{slotMultiplier}
                    </Badge>
                  </InfoRow>
                )}
              </div>

              {/* Vehicles (RENTAL only) */}
              {isRental && vehicles.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Xe đã đặt</p>
                    {vehicles.map((v) => (
                      <div key={v.id} className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5">
                        <Car className="size-4 shrink-0 text-orange-500" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">{v.catalogName ?? "Xe thuê"}</p>
                          {(v.identifier || v.color) && (
                            <p className="text-xs text-muted-foreground">
                              {[v.identifier, v.color].filter(Boolean).join(" · ")}
                            </p>
                          )}
                        </div>
                        {v.tier && (
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            {v.tier}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Check-in code */}
              {booking.checkInCode && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between rounded-lg bg-orange-50 border border-orange-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <QrCode className="size-5 text-orange-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Mã check-in</p>
                        <p className="font-mono text-lg font-bold tracking-widest text-orange-700">
                          {booking.checkInCode}
                        </p>
                      </div>
                    </div>
                    <Hash className="size-4 text-orange-300" />
                  </div>
                </>
              )}

              {/* Invoice */}
              {paymentComponents.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Chi tiết hóa đơn</p>
                    <div className="rounded-xl border divide-y">
                      {paymentComponents.map((line) => (
                        <InvoiceLine
                          key={line.id}
                          type={line.type}
                          amount={Number(line.amount)}
                          pricingLabel={line.type === "SLOT_FEE" && pricingLabel && slotMultiplier > 1 ? pricingLabel : undefined}
                          slotMultiplier={line.type === "SLOT_FEE" && slotMultiplier > 1 ? slotMultiplier : undefined}
                          isDeposit={line.type === "SECURITY_DEPOSIT"}
                        />
                      ))}

                      {discountAmount > 0 && (
                        <div className="flex items-center justify-between px-4 py-3 text-sm">
                          <span className="flex items-center gap-1.5 text-emerald-600">
                            <Tag className="size-3.5" />
                            {promoApplied?.code ?? "Mã ưu đãi"}
                          </span>
                          <span className="font-medium text-emerald-600">−{formatCurrency(discountAmount)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-3 mt-2">
                      <span className="font-semibold">Tổng thanh toán</span>
                      <span className="text-xl font-semibold">{formatCurrency(total)}</span>
                    </div>

                    {paymentComponents.some((c) => c.type === "SECURITY_DEPOSIT") && (
                      <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800 mt-2">
                        <ShieldCheck className="size-4 shrink-0 mt-0.5 text-emerald-600" />
                        <p>
                          Tiền cọc xe được <strong>giữ lại</strong> và sẽ được hoàn trả hoặc khấu trừ sau khi kiểm tra tình trạng xe khi trả.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

            </CardContent>
          </Card>
        )}

        {/* ── Failure state ── */}
        {!isSuccess && (
          <Card className="rounded-xl shadow-sm">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              Thanh toán không thành công. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.
            </CardContent>
          </Card>
        )}

        {/* ── Actions ── */}
        <div className="grid gap-3 sm:grid-cols-2">
          {isPackagePurchase ? (
            <Button asChild size="lg" className="sm:col-span-2">
              <Link to="/customer/packages">
                <Layers className="h-4 w-4" /> Xem gói của tôi
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild size="lg">
                <Link to="/customer/bookings">
                  <Home className="h-4 w-4" /> Quay lại lịch đặt
                </Link>
              </Button>
              {isSuccess && booking ? (
                <Button asChild size="lg" variant="outline">
                  <Link to={`/booking/${booking.id}`}>
                    <Eye className="h-4 w-4" /> Xem chi tiết đặt chỗ
                  </Link>
                </Button>
              ) : !isSuccess ? (
                <Button asChild size="lg" variant="outline">
                  <Link to="/booking/new">
                    <RotateCcw className="h-4 w-4" /> Đặt lại
                  </Link>
                </Button>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="flex min-w-0 flex-1 items-start justify-between gap-3 text-sm">
        <span className="shrink-0 text-muted-foreground">{label}</span>
        <span className="text-right font-medium">{children}</span>
      </div>
    </div>
  )
}

function InvoiceLine({
  type,
  amount,
  pricingLabel,
  slotMultiplier,
  isDeposit,
}: {
  type: string
  amount: number
  pricingLabel?: string
  slotMultiplier?: number
  isDeposit?: boolean
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-muted-foreground">{formatComponentType(type)}</span>
        {pricingLabel && slotMultiplier && (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] font-medium shrink-0">
            {pricingLabel} ×{slotMultiplier}
          </Badge>
        )}
        {isDeposit && (
          <span className="text-[10px] text-muted-foreground/70 shrink-0">(hoàn trả sau)</span>
        )}
      </div>
      <span className="font-medium shrink-0">{formatCurrency(amount)}</span>
    </div>
  )
}

// ── Helpers ─────────────────────────────────────────────────────────────────────

function formatComponentType(type: string): string {
  const map: Record<string, string> = {
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

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
}

function txnRefToBookingId(txnRef: string): string | undefined {
  if (txnRef.length !== 32) return undefined
  return [
    txnRef.substring(0, 8),
    txnRef.substring(8, 12),
    txnRef.substring(12, 16),
    txnRef.substring(16, 20),
    txnRef.substring(20, 32),
  ].join("-")
}
