import { CheckCircle2, Layers, QrCode, X } from "lucide-react"
import type { CustomerPaymentMethod } from "@/features/customer-booking/data/customer-booking-demo"
import type { BookingPlayMode } from "@/features/booking/types/booking.types"
import { useMyPackages } from "@/features/customer-packages/hooks/use-customer-packages"
import type { MyPackageItem } from "@/features/customer-packages/api/customer-package.api"
import { useAuthStore } from "@/features/auth/stores/auth.store"
import { Badge } from "@/shared/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { formatCurrency } from "@/shared/lib/format"

type PaymentStepProps = {
  paymentMethod: CustomerPaymentMethod
  onPaymentMethodChange: (method: CustomerPaymentMethod) => void
  cafeId?: string
  playMode?: BookingPlayMode
  slotsNeeded?: number
  selectedPackageId?: string | null
  onPackageSelect?: (id: string | null) => void
}

const isSandbox = import.meta.env.DEV

export function PaymentStep({
  cafeId,
  playMode,
  slotsNeeded = 1,
  selectedPackageId,
  onPackageSelect,
}: PaymentStepProps) {
  const authRole = useAuthStore((s) => s.role)
  const isCustomer = authRole === "customer"

  const { data: allPackages = [] } = useMyPackages(
    cafeId && isCustomer ? { status: "ACTIVE", cafe_id: cafeId } : undefined,
  )

  const eligiblePackages = allPackages.filter((pkg) => {
    if (pkg.status !== "ACTIVE") return false
    if (new Date(pkg.expires_at) < new Date()) return false
    if (pkg.slots_remaining < slotsNeeded) return false
    if (playMode && !pkg.applicable_play_modes?.includes(playMode)) return false
    return true
  })

  // Detect if "applicable_play_modes" is on MyPackageItem — we expose it via the API separately
  // The listMine endpoint doesn't include applicable_play_modes, so skip that filter if missing
  const compatiblePackages = eligiblePackages

  const selected = compatiblePackages.find((p) => p.id === selectedPackageId) ?? null

  return (
    <div className="space-y-4">
      {isCustomer && compatiblePackages.length > 0 && (
        <Card className="rounded-xl shadow-sm border-orange-200 bg-orange-50/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Layers className="h-4 w-4 text-orange-500" />
              Dùng gói slot của bạn
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Áp dụng gói để slot_fee = 0. Các khoản khác (thuê xe, cọc, F&B) vẫn thanh toán qua VNPay.
            </p>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {compatiblePackages.map((pkg) => (
              <PackageOption
                key={pkg.id}
                pkg={pkg}
                isSelected={selectedPackageId === pkg.id}
                slotsNeeded={slotsNeeded}
                onSelect={() => onPackageSelect?.(selectedPackageId === pkg.id ? null : pkg.id)}
              />
            ))}
            {selected && (
              <p className="text-[11px] text-emerald-700 font-semibold pt-1 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Đã chọn gói — phí slot sẽ được khấu trừ từ gói.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle>Phương thức thanh toán</CardTitle>
          <p className="text-sm text-muted-foreground">
            {selected
              ? "Thanh toán phần còn lại (thuê xe, cọc, F&B) qua VNPay."
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
        </CardContent>
      </Card>
    </div>
  )
}

function PackageOption({
  pkg,
  isSelected,
  slotsNeeded,
  onSelect,
}: {
  pkg: MyPackageItem
  isSelected: boolean
  slotsNeeded: number
  onSelect: () => void
}) {
  const expires = new Date(pkg.expires_at).toLocaleDateString("vi-VN")

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left rounded-xl border-2 px-3 py-2.5 transition-all ${
        isSelected
          ? "border-orange-500 bg-orange-50"
          : "border-slate-200 bg-white hover:border-orange-300"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-900 truncate">{pkg.package_name}</p>
          <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
            {pkg.slots_remaining} slot còn lại · Hết hạn {expires}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold text-orange-600">
            -{slotsNeeded} slot
          </span>
          {isSelected ? (
            <div className="h-4 w-4 rounded-full bg-orange-500 flex items-center justify-center">
              <X className="h-2.5 w-2.5 text-white" />
            </div>
          ) : (
            <div className="h-4 w-4 rounded-full border-2 border-slate-300" />
          )}
        </div>
      </div>
      {isSelected && (
        <p className="text-[10px] text-orange-700 font-semibold mt-1.5">
          Tiết kiệm ~{formatCurrency(pkg.purchased_price / pkg.slots_total * slotsNeeded)} so với đặt thường
        </p>
      )}
    </button>
  )
}
