import { useState } from "react"
import { CheckCircle2, Clock, Layers, Loader2, ShoppingCart, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { useAuthStore } from "@/features/auth/stores/auth.store"
import {
  useMyPackages,
  usePublicPackages,
  usePurchasePackage,
} from "@/features/customer-packages/hooks/use-customer-packages"
import type { PublicPackage } from "@/features/customer-packages/api/customer-package.api"
import { formatApplicablePlayModes } from "@/features/customer-packages/lib/play-mode"
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

  const { data: myPackages = [] } = useMyPackages(
    cafeId && isCustomer ? { cafe_id: cafeId } : undefined,
  )

  // Set of package_ids the customer currently owns (ACTIVE or PENDING_PAYMENT)
  const ownedPackageIds = new Set(
    myPackages
      .filter((p) => p.status === "ACTIVE" || p.status === "PENDING_PAYMENT")
      .map((p) => p.package_id),
  )

  if (!isLoading && packages.length === 0) return null

  const handlePurchase = async (pkg: PublicPackage) => {
    if (!cafeId) return
    setPurchasingId(pkg.id)
    try {
      const result = await purchaseMutation.mutateAsync({ cafeId, packageId: pkg.id })
      window.location.assign(result.payment_url)
    } catch (err) {
      const code = (err as { response?: { data?: { code?: string } } })?.response?.data?.code
      if (code === "PACKAGE_ALREADY_OWNED") {
        toast.error("Bạn đã có gói này đang hoạt động. Hãy dùng hết trước khi mua lại.")
      } else {
        toast.error("Không thể mua gói. Vui lòng thử lại.")
      }
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
              isOwned={ownedPackageIds.has(pkg.id)}
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
  isOwned,
  isPurchasing,
  onPurchase,
}: {
  pkg: PublicPackage
  isCustomer: boolean
  isOwned: boolean
  isPurchasing: boolean
  onPurchase: () => void
}) {
  // Dùng helper chung: mảng rỗng = áp dụng mọi hình thức, map+join thẳng sẽ
  // cho ra chuỗi rỗng và khách tưởng gói không dùng được cho hình thức nào.
  const playModeLabel = formatApplicablePlayModes(pkg.applicable_play_modes)

  return (
    <Card className="relative overflow-hidden border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col">
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${pkg.is_popular ? "bg-orange-500" : "bg-slate-300"}`} />

      <CardHeader className="pb-2 pt-5">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-extrabold text-slate-950 leading-tight">{pkg.name}</CardTitle>
          <div className="flex shrink-0 items-center gap-1.5">
            {isOwned && (
              <Badge className="bg-emerald-500/10 text-emerald-700 border-none text-[10px] font-bold">
                Đã sở hữu
              </Badge>
            )}
            {pkg.is_popular && !isOwned && (
              <Badge className="bg-orange-500/10 text-orange-700 border-none text-[10px] font-bold">
                Phổ biến
              </Badge>
            )}
          </div>
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
          isOwned ? (
            <div className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 py-2 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Gói đang hoạt động
            </div>
          ) : (
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
          )
        ) : (
          <p className="w-full text-center text-[11px] text-slate-400 font-semibold py-1">
            Đăng nhập để mua gói
          </p>
        )}
      </CardFooter>
    </Card>
  )
}
