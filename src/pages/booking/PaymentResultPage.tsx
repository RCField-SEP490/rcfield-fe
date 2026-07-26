import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  CreditCard,
  Hash,
  Home,
  Loader2,
  ReceiptText,
  RotateCcw,
} from "lucide-react"
import { Link, useSearchParams } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"
import { bookingApi } from "@/features/booking/api/booking.api"
import { formatCurrency } from "@/shared/lib/format"

/**
 * A result page is a payment receipt, not the booking invoice. The booking
 * detail remains the single place that consolidates all booking and
 * additional fees across the booking lifecycle.
 */
export function PaymentResultPage() {
  const [searchParams] = useSearchParams()
  const status = searchParams.get("status")
  const txnRef = searchParams.get("txn_ref")
  const reason = searchParams.get("reason")
  const responseCode = searchParams.get("response_code")
  const isSuccess = status === "success"
  const isCounterPayment = txnRef?.startsWith("ctr_") ?? false

  const {
    data: transaction,
    isFetching: isFetchingTransaction,
    isError: isTransactionError,
  } = useQuery({
    queryKey: ["payment-result-transaction", txnRef],
    queryFn: () => bookingApi.getPaymentTransaction(txnRef!),
    enabled: isSuccess && !!txnRef,
    retry: 1,
  })

  const bookingId =
    searchParams.get("booking_id") ??
    transaction?.bookingId ??
    (txnRef ? txnRefToBookingId(txnRef) : undefined)
  const isAdditionalPayment = transaction?.additionalPayment ?? isCounterPayment
  const isPackagePurchase =
    isSuccess && txnRef?.startsWith("pkg_") === true && isTransactionError
  const paidAmount = transaction ? Number(transaction.amount) : undefined
  const receiptLines = transaction?.components ?? []
  const paymentTitle = isAdditionalPayment
    ? "Biên nhận thanh toán phí phát sinh"
    : isPackagePurchase
      ? "Thanh toán gói thành công"
      : "Biên nhận thanh toán đặt trước"

  return (
    <main className="min-h-screen bg-[#f3f6f8] px-4 py-10 md:px-6 md:py-16">
      <Card className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardContent className="p-0">
          <section className="px-6 py-8 md:px-10 md:py-10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className={`flex size-14 shrink-0 items-center justify-center rounded-2xl ${isSuccess ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                {isSuccess ? <CheckCircle2 className="size-8" /> : <AlertCircle className="size-8" />}
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${isSuccess ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                {isSuccess ? "Đã hoàn tất" : "Không thành công"}
              </span>
            </div>

            <div className="mt-5">
              <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                {isSuccess ? paymentTitle : "Thanh toán chưa hoàn tất"}
              </h1>
              <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-slate-600">
                {isSuccess
                  ? isAdditionalPayment
                    ? "Biên nhận này chỉ ghi nhận khoản phát sinh vừa thanh toán. Tổng kết toàn bộ đơn nằm trong chi tiết đơn đặt."
                    : isPackagePurchase
                      ? "Gói của bạn đã được kích hoạt và sẵn sàng sử dụng."
                      : "Biên nhận này ghi nhận khoản đặt trước của đơn. Các khoản phát sinh sau phiên chơi sẽ được thanh toán riêng nếu có."
                  : "Giao dịch không hoàn tất. Bạn có thể thử thanh toán lại hoặc chọn phương thức khác."}
              </p>
            </div>

            {isSuccess && isFetchingTransaction && !transaction && (
              <div className="mt-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
                <Loader2 className="size-5 animate-spin text-orange-500" />
                Đang tải biên nhận thanh toán...
              </div>
            )}

            {isSuccess && typeof paidAmount === "number" && (
              <PaymentReceipt
                additionalPayment={isAdditionalPayment}
                amount={paidAmount}
                lines={receiptLines}
                txnRef={txnRef}
                gateway={transaction?.gateway}
                paidAt={transaction?.paidAt}
              />
            )}

            {!isSuccess && (reason || responseCode) && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700">
                {reason ? `Lý do: ${reason}` : `Mã lỗi: ${responseCode}`}
              </div>
            )}
          </section>

          <footer className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between md:px-10">
            {isPackagePurchase ? (
              <Button asChild size="lg" className="h-11 rounded-lg bg-orange-600 px-5 text-sm font-bold hover:bg-orange-700">
                <Link to="/customer/packages">
                  <Home className="size-4" /> Xem gói của tôi
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg" variant="outline" className="h-11 rounded-lg px-5 text-sm font-bold">
                <Link to="/customer/bookings">
                  <Home className="size-4" /> Danh sách đơn đặt
                </Link>
              </Button>
            )}

            {isSuccess && bookingId ? (
              <Button asChild size="lg" className="h-11 rounded-lg bg-orange-600 px-5 text-sm font-bold hover:bg-orange-700">
                <Link to={`/booking/${bookingId}`}>
                  Xem chi tiết đơn đặt <ArrowRight className="size-4" />
                </Link>
              </Button>
            ) : !isSuccess ? (
              <Button asChild size="lg" className="h-11 rounded-lg bg-orange-600 px-5 text-sm font-bold hover:bg-orange-700">
                <Link to="/booking/new">
                  <RotateCcw className="size-4" /> Đặt lại
                </Link>
              </Button>
            ) : null}
          </footer>
        </CardContent>
      </Card>
    </main>
  )
}

function PaymentReceipt({
  additionalPayment,
  amount,
  lines,
  txnRef,
  gateway,
  paidAt,
}: {
  additionalPayment: boolean
  amount: number
  lines: { type: string; amount: number }[]
  txnRef: string | null
  gateway?: string
  paidAt?: string
}) {
  const hasLines = lines.length > 0

  return (
    <section className="mt-7 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 md:p-5">
      <div className="flex items-center gap-2 text-emerald-900">
        <ReceiptText className="size-5" />
        <h2 className="font-bold">Chi tiết khoản vừa thanh toán</h2>
      </div>

      <div className="mt-4 divide-y divide-emerald-100 border-y border-emerald-100">
        {hasLines ? (
          lines.map((line, index) => (
            <ReceiptLine
              key={`${line.type}-${index}`}
              label={formatPaymentResultComponent(line.type, additionalPayment)}
              amount={Number(line.amount)}
            />
          ))
        ) : (
          <ReceiptLine
            label={additionalPayment ? "Phí phát sinh tại quầy" : "Khoản thanh toán đặt trước"}
            amount={amount}
          />
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 rounded-xl bg-emerald-100 px-4 py-3 text-emerald-950">
        <span className="font-bold">Tổng đã thanh toán lần này</span>
        <span className="text-xl font-black tabular-nums">{formatCurrency(amount)}</span>
      </div>

      {additionalPayment && (
        <p className="mt-3 text-xs font-medium leading-5 text-emerald-800">
          Không bao gồm khoản thanh toán đặt trước của đơn.
        </p>
      )}

      <div className="mt-5 grid gap-3 border-t border-emerald-100 pt-4 text-sm sm:grid-cols-2">
        <ReceiptMeta icon={<CreditCard className="size-4" />} label="Phương thức" value={formatGateway(gateway)} />
        <ReceiptMeta icon={<Clock3 className="size-4" />} label="Thời gian thanh toán" value={formatPaymentTime(paidAt)} />
        {txnRef && (
          <div className="sm:col-span-2">
            <ReceiptMeta icon={<Hash className="size-4" />} label="Mã giao dịch" value={txnRef} mono />
          </div>
        )}
      </div>
    </section>
  )
}

function ReceiptLine({ label, amount }: { label: string; amount: number }) {
  const isDiscount = amount < 0
  return (
    <div className="flex items-center justify-between gap-4 py-3 text-sm">
      <span className="text-emerald-950">{label}</span>
      <span className={`shrink-0 font-bold tabular-nums ${isDiscount ? "text-emerald-700" : "text-emerald-950"}`}>
        {isDiscount ? "-" : ""}{formatCurrency(Math.abs(amount))}
      </span>
    </div>
  )
}

function ReceiptMeta({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ReactNode
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex min-w-0 items-start gap-2 text-slate-600">
      <span className="mt-0.5 shrink-0 text-slate-400">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
        <p className={`mt-0.5 break-all font-bold text-slate-900 ${mono ? "font-mono text-xs" : ""}`}>{value}</p>
      </div>
    </div>
  )
}

function formatPaymentResultComponent(type: string, additionalPayment: boolean): string {
  const labels: Record<string, string> = {
    BOOKING_PAYMENT: "Khoản thanh toán đặt trước",
    COUNTER_SERVICE: "Phí phát sinh tại quầy",
    SLOT_FEE: "Phí lịch chơi",
    RENTAL_FEE: "Phí thuê xe",
    FNB_PREORDER: additionalPayment ? "Đồ ăn & thức uống gọi tại quầy" : "Đồ ăn & thức uống đặt trước",
    FB_PREORDER: additionalPayment ? "Đồ ăn & thức uống gọi tại quầy" : "Đồ ăn & thức uống đặt trước",
    FNB_ON_SITE: "Đồ ăn & thức uống gọi tại quầy",
    EXTENSION_FEE: "Phí gia hạn ca chơi",
    DAMAGE_CHARGE: "Phí đền bù hư hỏng",
    PROMOTION_DISCOUNT: "Ưu đãi áp dụng",
  }
  return labels[type] ?? (additionalPayment ? "Phí phát sinh tại quầy" : "Khoản thanh toán đặt trước")
}

function formatGateway(gateway?: string): string {
  const labels: Record<string, string> = {
    VNPAY: "VNPay",
    MOCK: "Thanh toán thử nghiệm",
    DIRECT: "Thanh toán trực tiếp",
  }
  return gateway ? (labels[gateway] ?? gateway) : "Đang cập nhật"
}

function formatPaymentTime(value?: string): string {
  if (!value) return "Đang cập nhật"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Đang cập nhật"
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
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
