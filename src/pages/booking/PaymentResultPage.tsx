import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Car,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  Hash,
  Home,
  Layers,
  Loader2,
  MapPin,
  QrCode,
  ReceiptText,
  RotateCcw,
  Tag,
  Users,
} from "lucide-react"
import { Link, useSearchParams } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"
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
  const isCounterPayment = txnRef?.startsWith("ctr_") ?? false

  const resourceId = searchParams.get("booking_id") ?? (txnRef ? txnRefToBookingId(txnRef) : undefined)

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
  const showGenericSuccess = isSuccess && !booking && !isPackagePurchase && (!resourceId || bookingError)
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
    <div className="min-h-screen bg-[#f3f6f8] px-4 py-8 md:px-6">
      <div className="mx-auto max-w-4xl">
        <Card className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <CardContent className="p-0">
            <section className="grid lg:grid-cols-[1.1fr_0.9fr]">
              <div className="px-6 py-8 md:px-8 md:py-10">
                <div className={`flex size-14 items-center justify-center rounded-lg ${isSuccess ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                  {isSuccess ? <CheckCircle2 className="size-8" /> : <AlertCircle className="size-8" />}
                </div>

                <div className="mt-6 space-y-3">
                  <h1 className="text-3xl font-black leading-tight text-slate-950 md:text-4xl">
                    {isSuccess ? "Thanh toán thành công" : "Thanh toán thất bại"}
                  </h1>
                  <p className="max-w-xl text-sm font-medium leading-6 text-slate-600">
                    {isSuccess
                      ? isCounterPayment
                        ? "Khoản phát sinh tại quầy đã được ghi nhận và cập nhật vào hóa đơn."
                        : isPackagePurchase
                          ? "Gói slot đã được kích hoạt và sẵn sàng sử dụng cho các lượt đặt tiếp theo."
                          : "Giao dịch đã được xử lý. Thông tin đặt chỗ sẽ được cập nhật trong lịch của bạn."
                      : "Giao dịch không hoàn tất. Bạn có thể thử thanh toán lại hoặc chọn phương thức khác."}
                  </p>
                </div>

                {txnRef && (
                  <div className="mt-6 border-y border-slate-200 py-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Mã giao dịch</p>
                    <p className="mt-1 break-all font-mono text-sm font-bold text-slate-900">{txnRef}</p>
                  </div>
                )}

                {!isSuccess && (reason || responseCode) && (
                  <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {reason ? `Lý do: ${reason}` : `Mã lỗi: ${responseCode}`}
                  </div>
                )}
              </div>

              <aside className="border-t border-slate-200 bg-slate-50 px-6 py-8 md:px-8 lg:border-l lg:border-t-0">
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Trạng thái</p>
                    <p className={`mt-1 text-lg font-black ${isSuccess ? "text-emerald-700" : "text-red-600"}`}>
                      {isSuccess ? "Đã hoàn tất" : "Không thành công"}
                    </p>
                  </div>

                  <div className="divide-y divide-slate-200 border-y border-slate-200">
                    <ResultMetaRow
                      icon={<CreditCard className="size-4" />}
                      label="Loại thanh toán"
                      value={isCounterPayment ? "Khoản phát sinh tại quầy" : isPackagePurchase ? "Mua gói slot" : "Đặt lịch chơi"}
                    />
                    <ResultMetaRow
                      icon={<ReceiptText className="size-4" />}
                      label="Cập nhật hệ thống"
                      value={isSuccess ? "Đã ghi nhận" : "Chưa ghi nhận"}
                    />
                    {booking?.id && (
                      <ResultMetaRow
                        icon={<Hash className="size-4" />}
                        label="Mã đặt chỗ"
                        value={`#${booking.id.slice(0, 8).toUpperCase()}`}
                      />
                    )}
                  </div>

                  {isSuccess && !!resourceId && !booking && !bookingError && (
                    <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
                      {isFetching && <Loader2 className="size-5 animate-spin text-orange-500" />}
                      <span>Đang đồng bộ dữ liệu đặt chỗ...</span>
                    </div>
                  )}

                  {showGenericSuccess && (
                    <p className="text-sm font-medium leading-6 text-slate-600">
                      {isCounterPayment
                        ? "Hóa đơn dịch vụ tại quầy đã được cập nhật. Bạn có thể quay lại lịch đặt để xem trạng thái mới nhất."
                        : "Bạn có thể quay lại lịch đặt để xem trạng thái mới nhất của đơn."}
                    </p>
                  )}

                  {isPackagePurchase && (
                    <p className="text-sm font-medium leading-6 text-slate-600">
                      Bạn có thể dùng gói này khi đặt lịch tại cơ sở tương ứng.
                    </p>
                  )}
                </div>
              </aside>
            </section>

            {isSuccess && booking && (
              <section className="border-t border-slate-200 px-6 py-6 md:px-8">
                <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Thông tin đặt chỗ</p>
                      <div className="mt-4 space-y-3">
                        {booking.cafe && (
                          <>
                            <InfoRow icon={<MapPin className="size-4 text-orange-500" />} label="Cơ sở">
                              <span className="font-semibold">{booking.cafe.name}</span>
                            </InfoRow>
                            <InfoRow icon={<MapPin className="size-4 text-slate-400" />} label="Địa chỉ">
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
                            {formatTime(booking.slotStart)} - {formatTime(booking.slotEnd)}
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
                            <Badge className="border-amber-200 bg-amber-100 text-xs font-medium text-amber-800">
                              {pricingLabel} x{slotMultiplier}
                            </Badge>
                          </InfoRow>
                        )}
                      </div>
                    </div>

                    {isRental && vehicles.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-3">
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Xe đã đặt</p>
                          <div className="divide-y divide-slate-200 border-y border-slate-200">
                            {vehicles.map((v) => (
                              <div key={v.id} className="flex items-center gap-3 py-3">
                                <Car className="size-4 shrink-0 text-orange-500" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-bold text-slate-900">{v.catalogName ?? "Xe thuê"}</p>
                                  {(v.identifier || v.color) && (
                                    <p className="text-xs font-medium text-slate-500">
                                      {[v.identifier, v.color].filter(Boolean).join(" - ")}
                                    </p>
                                  )}
                                </div>
                                {v.tier && (
                                  <Badge variant="outline" className="shrink-0 text-[10px]">
                                    {v.tier}
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {booking.checkInCode && (
                      <>
                        <Separator />
                        <div className="flex items-center justify-between rounded-lg border border-orange-100 bg-orange-50 px-4 py-3">
                          <div className="flex items-center gap-2">
                            <QrCode className="size-5 text-orange-600" />
                            <div>
                              <p className="text-xs font-medium text-slate-500">Mã check-in</p>
                              <p className="font-mono text-lg font-bold tracking-widest text-orange-700">
                                {booking.checkInCode}
                              </p>
                            </div>
                          </div>
                          <Hash className="size-4 text-orange-300" />
                        </div>
                      </>
                    )}
                  </div>

                  {paymentComponents.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Chi tiết hóa đơn</p>
                      <div className="divide-y divide-slate-200 border-y border-slate-200">
                        {paymentComponents.map((line) => (
                          <InvoiceLine
                            key={line.id}
                            type={line.type}
                            amount={Number(line.amount)}
                            pricingLabel={line.type === "SLOT_FEE" && pricingLabel && slotMultiplier > 1 ? pricingLabel : undefined}
                            slotMultiplier={line.type === "SLOT_FEE" && slotMultiplier > 1 ? slotMultiplier : undefined}
                          />
                        ))}

                        {discountAmount > 0 && (
                          <div className="flex items-center justify-between py-3 text-sm">
                            <span className="flex items-center gap-1.5 text-emerald-600">
                              <Tag className="size-3.5" />
                              {promoApplied?.code ?? "Mã ưu đãi"}
                            </span>
                            <span className="font-medium text-emerald-600">-{formatCurrency(discountAmount)}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between rounded-lg bg-slate-100 px-4 py-3">
                        <span className="font-bold text-slate-700">Tổng thanh toán</span>
                        <span className="text-xl font-black text-slate-950">{formatCurrency(total)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-6 py-5 md:flex-row md:items-center md:justify-between md:px-8">
              {isPackagePurchase ? (
                <Button asChild size="lg" className="h-11 rounded-lg bg-orange-600 px-5 text-sm font-bold hover:bg-orange-700">
                  <Link to="/customer/packages">
                    <Layers className="size-4" /> Xem gói của tôi
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg" className="h-11 rounded-lg bg-orange-600 px-5 text-sm font-bold hover:bg-orange-700">
                  <Link to="/customer/bookings">
                    <Home className="size-4" /> Quay lại lịch đặt
                  </Link>
                </Button>
              )}

              {isSuccess && booking ? (
                <Button asChild size="lg" variant="outline" className="h-11 rounded-lg px-5 text-sm font-bold">
                  <Link to={`/booking/${booking.id}`}>
                    Xem chi tiết đặt chỗ <ArrowRight className="size-4" />
                  </Link>
                </Button>
              ) : !isSuccess ? (
                <Button asChild size="lg" variant="outline" className="h-11 rounded-lg px-5 text-sm font-bold">
                  <Link to="/booking/new">
                    <RotateCcw className="size-4" /> Đặt lại
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg" variant="outline" className="h-11 rounded-lg px-5 text-sm font-bold">
                  <Link to="/customer/bookings">
                    Xem trạng thái <Eye className="size-4" />
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
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

function ResultMetaRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3 py-3 text-sm">
      <span className="shrink-0 text-slate-400">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-0.5 truncate font-bold text-slate-900">{value}</p>
      </div>
    </div>
  )
}

function InvoiceLine({
  type,
  amount,
  pricingLabel,
  slotMultiplier,
}: {
  type: string
  amount: number
  pricingLabel?: string
  slotMultiplier?: number
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
