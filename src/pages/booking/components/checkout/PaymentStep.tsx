import { CheckCircle2, QrCode, Zap } from "lucide-react"
import type { CustomerPaymentMethod } from "@/features/customer-booking/data/customer-booking-demo"
import { Badge } from "@/shared/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import type { AppliedPromo } from "./PromoCodeInput"
import { PromoCodeInput } from "./PromoCodeInput"

type PaymentStepProps = {
  paymentMethod: CustomerPaymentMethod
  onPaymentMethodChange: (method: CustomerPaymentMethod) => void
  selectedPackageId?: string | null
  cafeId?: string
  playMode?: "RENTAL" | "BYOC"
  slotStart?: string
  subtotal?: number
  appliedPromo?: AppliedPromo | null
  onPromoApply?: (promo: AppliedPromo | null) => void
  slotsNeeded?: number
  onPackageSelect?: (id: string | null) => void
  onMockPayment?: () => void
}

const isSandbox = import.meta.env.DEV

export function PaymentStep({
  selectedPackageId,
  cafeId,
  playMode,
  slotStart,
  subtotal,
  appliedPromo,
  onPromoApply,
  onMockPayment,
}: PaymentStepProps) {
  const showPromoInput =
    !selectedPackageId && cafeId && playMode && slotStart && subtotal !== undefined && onPromoApply

  return (
    <div className="space-y-4">
      {selectedPackageId && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span className="font-semibold">Gói slot đã được áp dụng — phí slot = 0</span>
        </div>
      )}

      {showPromoInput && (
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Mã ưu đãi</CardTitle>
          </CardHeader>
          <CardContent>
            <PromoCodeInput
              cafeId={cafeId}
              playMode={playMode}
              slotStart={slotStart}
              subtotal={subtotal!}
              appliedPromo={appliedPromo ?? null}
              onApply={onPromoApply}
            />
          </CardContent>
        </Card>
      )}

      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle>Phương thức thanh toán</CardTitle>
          <p className="text-sm text-muted-foreground">
            {selectedPackageId
              ? "Thanh toán phần còn lại (thuê xe, đồ ăn & thức uống) qua VNPay."
              : "Xác nhận đơn đặt lịch và thanh toán qua cổng VNPay."}
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 rounded-xl border-2 border-primary bg-primary/5 p-4">
            <QrCode className="h-8 w-8 shrink-0 text-primary" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">VNPay</span>
                {isSandbox && (
                  <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700 text-[10px]">
                    Sandbox
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Quét QR hoặc thanh toán qua ví điện tử VNPay
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Bấm "Xác nhận thanh toán" để chuyển đến trang thanh toán VNPay
            {isSandbox ? " (môi trường thử nghiệm)" : ""}.
          </p>

          {isSandbox && onMockPayment && (
            <button
              type="button"
              onClick={onMockPayment}
              className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-violet-300 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-700 hover:bg-violet-100 transition-colors"
            >
              <Zap className="h-4 w-4" />
              Mock thanh toán thành công (DEV)
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
