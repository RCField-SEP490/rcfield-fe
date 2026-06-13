import { CheckCircle2, Layers, X } from "lucide-react"
import { useMyPackages } from "@/features/customer-packages/hooks/use-customer-packages"
import type { MyPackageItem } from "@/features/customer-packages/api/customer-package.api"
import type { BookingPlayMode } from "@/features/booking/types/booking.types"
import { useAuthStore } from "@/features/auth/stores/auth.store"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { formatCurrency } from "@/shared/lib/format"

type Props = {
  cafeId?: string
  playMode?: BookingPlayMode
  slotsNeeded?: number
  selectedPackageId?: string | null
  onPackageSelect?: (id: string | null) => void
}

function getIneligibleReason(
  pkg: MyPackageItem,
  playMode: BookingPlayMode | undefined,
  slotsNeeded: number,
): string | null {
  if (new Date(pkg.expires_at) < new Date()) return "Đã hết hạn"
  if (pkg.slots_remaining < slotsNeeded) return `Không đủ slot (còn ${pkg.slots_remaining})`
  if (
    playMode &&
    pkg.applicable_play_modes?.length &&
    !pkg.applicable_play_modes.includes(playMode)
  ) {
    const label = playMode === "RENTAL" ? "Thuê xe" : "Mang xe riêng"
    return `Không áp dụng cho chế độ ${label}`
  }
  return null
}

export function BookingPackageSelector({
  cafeId,
  playMode,
  slotsNeeded = 1,
  selectedPackageId,
  onPackageSelect,
}: Props) {
  const authRole = useAuthStore((s) => s.role)
  const isCustomer = authRole === "customer"

  const { data: allPackages = [] } = useMyPackages(
    cafeId && isCustomer ? { status: "ACTIVE", cafe_id: cafeId } : undefined,
  )

  // Exclude actually expired packages (status ACTIVE but past expires_at)
  const visiblePackages = allPackages.filter(
    (pkg) => new Date(pkg.expires_at) >= new Date() || pkg.slots_remaining > 0,
  )

  if (!isCustomer || visiblePackages.length === 0) return null

  const selected = visiblePackages.find((p) => p.id === selectedPackageId) ?? null

  return (
    <Card className="mb-4 rounded-xl border-orange-200 bg-orange-50/40 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <Layers className="h-4 w-4 text-orange-500" />
          Dùng gói slot của bạn
        </CardTitle>
        <p className="mt-0.5 text-xs text-slate-500">
          Áp dụng gói để phí slot = 0. Các khoản khác (thuê xe, cọc, F&B) vẫn thanh toán qua VNPay.
        </p>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {visiblePackages.map((pkg) => {
          const ineligibleReason = getIneligibleReason(pkg, playMode, slotsNeeded)
          return (
            <PackageOption
              key={pkg.id}
              pkg={pkg}
              isSelected={selectedPackageId === pkg.id}
              slotsNeeded={slotsNeeded}
              ineligibleReason={ineligibleReason}
              onSelect={() => {
                if (ineligibleReason) return
                onPackageSelect?.(selectedPackageId === pkg.id ? null : pkg.id)
              }}
            />
          )
        })}
        {selected && (
          <p className="flex items-center gap-1 pt-1 text-[11px] font-semibold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Đã chọn gói — phí slot sẽ được khấu trừ từ gói.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function PackageOption({
  pkg,
  isSelected,
  slotsNeeded,
  ineligibleReason,
  onSelect,
}: {
  pkg: MyPackageItem
  isSelected: boolean
  slotsNeeded: number
  ineligibleReason: string | null
  onSelect: () => void
}) {
  const expires = new Date(pkg.expires_at).toLocaleDateString("vi-VN")
  const isDisabled = !!ineligibleReason

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={isDisabled}
      className={`w-full rounded-xl border-2 px-3 py-2.5 text-left transition-all ${
        isDisabled
          ? "cursor-not-allowed border-slate-100 bg-slate-50 opacity-60"
          : isSelected
          ? "border-orange-500 bg-orange-50"
          : "border-slate-200 bg-white hover:border-orange-300"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className={`truncate text-xs font-bold ${isDisabled ? "text-slate-500" : "text-slate-900"}`}>
            {pkg.package_name}
          </p>
          <p className="mt-0.5 text-[10px] font-semibold text-slate-500">
            {pkg.slots_remaining} slot còn lại · Hết hạn {expires}
          </p>
          {ineligibleReason && (
            <p className="mt-0.5 text-[10px] font-semibold text-rose-500">{ineligibleReason}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!isDisabled && (
            <span className="text-[10px] font-bold text-orange-600">-{slotsNeeded} slot</span>
          )}
          {isDisabled ? (
            <div className="h-4 w-4 rounded-full border-2 border-slate-200 bg-slate-100" />
          ) : isSelected ? (
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-orange-500">
              <X className="h-2.5 w-2.5 text-white" />
            </div>
          ) : (
            <div className="h-4 w-4 rounded-full border-2 border-slate-300" />
          )}
        </div>
      </div>
      {isSelected && !isDisabled && (
        <p className="mt-1.5 text-[10px] font-semibold text-orange-700">
          Tiết kiệm ~{formatCurrency((pkg.purchased_price / pkg.slots_total) * slotsNeeded)} so với đặt thường
        </p>
      )}
    </button>
  )
}
