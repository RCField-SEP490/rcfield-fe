import { useState } from "react"
import { CheckCircle2, Clock, Layers, Loader2, ShoppingCart, Sparkles } from "lucide-react"
import { useAuthStore } from "@/features/auth/stores/auth.store"
import {
  usePublicPackages,
  usePurchasePackage,
} from "@/features/customer-packages/hooks/use-customer-packages"
import type { PublicPackage } from "@/features/customer-packages/api/customer-package.api"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card"
import { Skeleton } from "@/shared/ui/skeleton"
import { formatCurrency } from "@/shared/lib/format"

interface CafePackagesSectionProps {
  cafeId?: string
}

export function CafePackagesSection({ cafeId }: CafePackagesSectionProps) {
  const { data: packages = [], isLoading } = usePublicPackages(cafeId)
  const purchaseMutation = usePurchasePackage()
  const authRole = useAuthStore((s) => s.role)
  const isCustomer = authRole === "customer"
  const [purchasingId, setPurchasingId] = useState<string | null>(null)

  if (!isLoading && packages.length === 0) return null

  const handlePurchase = async (pkg: PublicPackage) => {
    if (!cafeId) return
    setPurchasingId(pkg.id)
    try {
      const result = await purchaseMutation.mutateAsync({ cafeId, packageId: pkg.id })
      window.location.href = result.payment_url
    } finally {
      setPurchasingId(null)
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-orange-500" />
        <h2 className="text-lg font-extrabold text-slate-950 tracking-tight">Gói slot tại cơ sở này</h2>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2].map((i) => (
            <Card key={i} className="overflow-hidden">
              <div className="h-1.5 bg-slate-100" />
              <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
              <CardFooter><Skeleton className="h-9 w-full" /></CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              isCustomer={isCustomer}
              isPurchasing={purchasingId === pkg.id}
              onPurchase={() => void handlePurchase(pkg)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function PackageCard({
  pkg,
  isCustomer,
  isPurchasing,
  onPurchase,
}: {
  pkg: PublicPackage
  isCustomer: boolean
  isPurchasing: boolean
  onPurchase: () => void
}) {
  const playModeLabel = pkg.applicable_play_modes
    .map((m) => (m === "RENTAL" ? "Thuê xe" : "Mang xe riêng"))
    .join(", ")

  return (
    <Card className="relative overflow-hidden border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col">
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${pkg.is_popular ? "bg-orange-500" : "bg-slate-300"}`} />

      <CardHeader className="pb-2 pt-5">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-extrabold text-slate-950 leading-tight">{pkg.name}</CardTitle>
          {pkg.is_popular && (
            <Badge className="shrink-0 bg-orange-500/10 text-orange-700 border-none text-[10px] font-bold">
              Phổ biến
            </Badge>
          )}
        </div>
        {pkg.description && (
          <p className="text-xs text-slate-500 leading-relaxed mt-1">{pkg.description}</p>
        )}
      </CardHeader>

      <CardContent className="flex-grow space-y-3 text-sm">
        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-slate-600 text-xs font-semibold">
            <Layers className="h-3.5 w-3.5 text-slate-400" />
            Số slot
          </div>
          <span className="font-extrabold text-slate-950 text-base">{pkg.slot_count} lượt</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-600">
          <div className="flex items-center gap-1 rounded-lg bg-slate-50 px-2.5 py-2">
            <Clock className="h-3 w-3 text-slate-400 shrink-0" />
            <span>Hiệu lực {pkg.valid_days} ngày</span>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-slate-50 px-2.5 py-2 truncate">
            <span className="truncate">{playModeLabel}</span>
          </div>
        </div>

        {pkg.benefits.length > 0 && (
          <ul className="space-y-1">
            {pkg.benefits.slice(0, 3).map((b, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                {b}
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <CardFooter className="flex-col gap-2 border-t border-slate-100 bg-slate-50/50 pt-3">
        <div className="flex w-full items-center justify-between">
          <span className="text-xs text-slate-500 font-semibold">Giá gói</span>
          <span className="text-lg font-extrabold text-slate-950">{formatCurrency(pkg.price)}</span>
        </div>

        {isCustomer ? (
          <Button
            className="w-full bg-slate-950 hover:bg-orange-600 text-white font-bold text-xs h-9 rounded-xl transition-colors"
            disabled={isPurchasing}
            onClick={onPurchase}
          >
            {isPurchasing ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang xử lý...</>
            ) : (
              <><ShoppingCart className="h-3.5 w-3.5" /> Mua gói này</>
            )}
          </Button>
        ) : (
          <p className="w-full text-center text-[11px] text-slate-400 font-semibold py-1">
            Đăng nhập để mua gói
          </p>
        )}
      </CardFooter>
    </Card>
  )
}
