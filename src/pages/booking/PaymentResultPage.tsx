import { AlertCircle, CheckCircle2, Eye, Home, Loader2, RotateCcw } from "lucide-react"
import { Link, useSearchParams } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { bookingApi, bookingQueryKeys } from "@/features/booking/api/booking.api"
import { formatCurrency } from "@/shared/lib/format"
import { Separator } from "@/shared/ui/separator"

export function PaymentResultPage() {
  const [searchParams] = useSearchParams()
  const status = searchParams.get("status") // "success" | "failed"
  const txnRef = searchParams.get("txn_ref")
  const reason = searchParams.get("reason")
  const responseCode = searchParams.get("response_code")

  // txn_ref encodes the booking ID — first 8 hex chars are the UUID prefix
  const bookingId = txnRef ? txnRefToBookingId(txnRef) : undefined

  // Poll until IPN processes and payment_components are populated (VNPay IPN is async)
  const { data: booking, isFetching } = useQuery({
    queryKey: bookingQueryKeys.detail(bookingId),
    queryFn: () => bookingApi.getBooking(bookingId!),
    enabled: !!bookingId && isSuccess,
    refetchInterval: (query) => {
      const components = query.state.data?.payment_components ?? []
      return isSuccess && components.length === 0 ? 2000 : false
    },
    refetchIntervalInBackground: false,
  })

  const isSuccess = status === "success"

  const paymentComponents = booking?.payment_components ?? []
  const total = paymentComponents.reduce((sum, c) => sum + c.amount, 0)

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-8 md:px-6">
      <div className="mx-auto max-w-3xl">
        <Card className="overflow-hidden rounded-xl text-center shadow-sm">
          <CardHeader className="border-b bg-background py-10">
            <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${isSuccess ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
              {isSuccess ? <CheckCircle2 className="h-8 w-8" /> : <AlertCircle className="h-8 w-8" />}
            </div>
            <CardTitle className="mt-4 text-3xl">
              {isSuccess ? "Thanh toán thành công" : "Thanh toán thất bại"}
            </CardTitle>
            {txnRef && (
              <p className="text-muted-foreground">
                Mã giao dịch: <span className="font-semibold text-foreground">{txnRef}</span>
              </p>
            )}
            {!isSuccess && (reason || responseCode) && (
              <p className="mt-2 text-sm text-red-600">
                {reason ? `Lý do: ${reason}` : `Mã lỗi: ${responseCode}`}
              </p>
            )}
          </CardHeader>

          {isSuccess && (
            <CardContent className="space-y-6 p-6 text-left">
              {paymentComponents.length > 0 ? (
                <section>
                  <h2 className="mb-3 border-l-4 border-primary pl-3 text-lg font-semibold">Chi tiết hóa đơn</h2>
                  <div className="rounded-xl border">
                    {paymentComponents.map((line) => (
                      <div key={line.id} className="flex items-center justify-between border-b px-4 py-3 text-sm last:border-b-0">
                        <span className="text-muted-foreground capitalize">{formatComponentType(line.type)}</span>
                        <span className="font-medium">{formatCurrency(line.amount)}</span>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex items-center justify-between px-4 py-4 text-lg font-semibold">
                      <span>Tổng cộng</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                </section>
              ) : (
                <div className="flex flex-col items-center gap-2 py-4 text-sm text-muted-foreground">
                  {isFetching && <Loader2 className="h-5 w-5 animate-spin" />}
                  <p>Đang xác nhận thanh toán{isFetching ? "..." : ". Vui lòng chờ."}</p>
                </div>
              )}
            </CardContent>
          )}

          {!isSuccess && (
            <CardContent className="p-6">
              <p className="text-center text-sm text-muted-foreground">
                Thanh toán không thành công. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.
              </p>
            </CardContent>
          )}
        </Card>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
        </div>
      </div>
    </div>
  )
}

function formatComponentType(type: string): string {
  const map: Record<string, string> = {
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

/** txnRef = bookingId.replace(/-/g, '').substring(0, 32) — UUID has exactly 32 hex chars so it's reversible */
function txnRefToBookingId(txnRef: string): string | undefined {
  if (txnRef.length !== 32) return undefined
  return [
    txnRef.substring(0, 8),
    txnRef.substring(8, 12),
    txnRef.substring(12, 16),
    txnRef.substring(16, 20),
    txnRef.substring(20, 32),
  ].join('-')
}
