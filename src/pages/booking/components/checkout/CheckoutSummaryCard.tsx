import { ArrowRight, Layers, Loader2, MapPin, ShieldCheck } from "lucide-react"
import type { BookingMode } from "@/features/booking/data/booking-options"
import type { CustomerPlayMode, CheckoutStep, PaymentComponentLine } from "@/features/customer-booking/data/customer-booking-demo"
import type { Cafe, Vehicle } from "@/shared/data/explore-data"
import type { TrackConfig } from "@/features/cafes/types"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card"
import { Separator } from "@/shared/ui/separator"
import { formatCurrency } from "@/shared/lib/format"

type CheckoutSummaryCardProps = {
  cafe: Cafe
  mode: BookingMode
  playMode: CustomerPlayMode
  date: string
  time: string
  selectedVehicles?: Vehicle[]
  fnbTotal: number
  components: PaymentComponentLine[]
  currentStep: CheckoutStep
  onNext: () => void
  onBack: () => void
  onConfirmPayment?: () => void
  isSubmitting?: boolean
  isNextDisabled?: boolean
  selectedTrackConfig?: TrackConfig | null
}

export function CheckoutSummaryCard({
  cafe,
  mode,
  playMode,
  date,
  time,
  selectedVehicles,
  fnbTotal,
  components,
  currentStep,
  onNext,
  onBack,
  onConfirmPayment,
  isSubmitting = false,
  isNextDisabled = false,
  selectedTrackConfig,
}: CheckoutSummaryCardProps) {
  const total = components.reduce((sum, item) => sum + item.amount, 0)
  const isFirstStep = currentStep === "track"
  const isPaymentStep = currentStep === "payment"

  return (
    <Card className="sticky top-20 rounded-xl shadow-sm">
      <CardHeader>
        <CardTitle>Tóm tắt đơn đặt</CardTitle>
        <p className="text-sm text-muted-foreground">Snapshot giá sẽ được lưu trong booking khi thanh toán.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <img src={cafe.image} alt={cafe.name} className="h-16 w-16 rounded-lg object-cover" />
          <div className="min-w-0">
            <p className="truncate font-semibold">{cafe.name}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> {cafe.district}, {cafe.city}
            </p>
          </div>
        </div>

        <Separator />

        <div className="grid gap-2 text-sm">
          {selectedTrackConfig && (
            <div className="flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-2">
              <Layers className="size-3.5 shrink-0 text-orange-600" />
              <span className="text-xs font-medium text-orange-800">
                {selectedTrackConfig.track_type?.name ?? "Loại sân đã chọn"}
              </span>
            </div>
          )}
          <Line label="Loại booking" value={getModeLabel(mode)} />
          <Line label="Play mode" value={playMode} />
          <Line label="Ngày" value={new Date(date).toLocaleDateString("vi-VN")} />
          <Line label="Giờ" value={time} />
          <Line
            label="Xe thuê"
            value={
              !selectedVehicles || selectedVehicles.length === 0
                ? "Chưa chọn"
                : selectedVehicles.length === 1
                ? selectedVehicles[0].name
                : `${selectedVehicles.length} xe`
            }
          />
          {fnbTotal > 0 && <Line label="F&B preorder" value={formatCurrency(fnbTotal)} />}
        </div>

        <Separator />

        <div className="space-y-2">
          {components.map((component) => (
            <div key={component.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">{component.label}</span>
              <span className="font-medium">{formatCurrency(component.amount)}</span>
            </div>
          ))}
        </div>

        <div className="rounded-lg bg-muted p-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Tổng thanh toán</span>
            <span className="text-xl font-semibold">{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          <ShieldCheck className="mr-1 inline h-4 w-4" /> Cọc xe được giữ theo ledger, hoàn/khấu trừ dựa trên inspection.
        </div>
      </CardContent>
      <CardFooter className="grid gap-2">
        <Button
          type="button"
          disabled={isSubmitting || isNextDisabled}
          onClick={() => {
            if (isPaymentStep) {
              onConfirmPayment?.()
              return
            }
            onNext()
          }}
          className="w-full"
        >
          {isSubmitting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Đang xử lý...</>
          ) : (
            <>{isPaymentStep ? "Xác nhận thanh toán" : "Tiếp tục"}<ArrowRight className="h-4 w-4" /></>
          )}
        </Button>
        {!isFirstStep && (
          <Button type="button" variant="ghost" onClick={onBack} className="w-full">
            Quay lại bước trước
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate text-right font-medium">{value}</span>
    </div>
  )
}

function getModeLabel(mode: BookingMode) {
  if (mode === "slotPackage") return "PACKAGE"
  if (mode === "recurring") return "SUBSCRIPTION"
  return "SINGLE"
}
