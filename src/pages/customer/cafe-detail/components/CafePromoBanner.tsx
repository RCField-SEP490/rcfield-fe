import { useQuery } from "@tanstack/react-query"
import { Tag, ChevronLeft, ChevronRight, Clock } from "lucide-react"
import { useState } from "react"
import { promotionApi } from "@/features/promotions/api/promotion.api"
import type { ActivePromotion } from "@/features/promotions/api/promotion.api"
import { formatCurrency } from "@/shared/lib/format"

function formatDiscount(p: ActivePromotion): string {
  if (p.discount_type === "PERCENT") {
    const suffix = p.max_discount_amount ? ` (tối đa ${formatCurrency(p.max_discount_amount)})` : ""
    return `Giảm ${p.discount_value}%${suffix}`
  }
  return `Giảm ${formatCurrency(p.discount_value)}`
}

function formatExpiry(expiresAt: string | null): string | null {
  if (!expiresAt) return null
  const d = new Date(expiresAt)
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / 86_400_000)
  if (diffDays <= 0) return null
  if (diffDays === 1) return "Hết hạn hôm nay"
  if (diffDays <= 7) return `Còn ${diffDays} ngày`
  return `HSD: ${d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}`
}

function PromoSlide({ promo }: { promo: ActivePromotion }) {
  const expiry = formatExpiry(promo.expires_at)
  const modeLabel =
    promo.applicable_to === "RENTAL"
      ? "· Thuê xe"
      : promo.applicable_to === "BYOC"
        ? "· Xe cá nhân"
        : null

  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20">
        <Tag className="h-4 w-4 text-white" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-sm font-bold tracking-widest text-white">
            {promo.code}
          </span>
          <span className="rounded bg-white/20 px-1.5 py-0.5 text-[11px] font-semibold text-white">
            {formatDiscount(promo)}
          </span>
          {modeLabel && (
            <span className="text-[11px] text-orange-100">{modeLabel}</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {promo.description && (
            <span className="text-xs text-orange-100 truncate">{promo.description}</span>
          )}
          {expiry && (
            <span className="flex items-center gap-1 text-[11px] text-orange-200 shrink-0">
              <Clock className="h-3 w-3" />
              {expiry}
            </span>
          )}
          {promo.min_order_amount && (
            <span className="text-[11px] text-orange-200 shrink-0">
              · Đơn tối thiểu {formatCurrency(promo.min_order_amount)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export function CafePromoBanner({ cafeId }: { cafeId: string }) {
  const [index, setIndex] = useState(0)

  const { data: promos = [] } = useQuery({
    queryKey: ["cafe-promos-active", cafeId],
    queryFn: () => promotionApi.listActive(cafeId),
    staleTime: 2 * 60 * 1000,
  })

  if (!promos.length) return null

  const current = promos[index]
  const hasMultiple = promos.length > 1

  return (
    <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 shadow-sm shadow-orange-200">
      <PromoSlide promo={current} />

      {hasMultiple && (
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <span className="text-[11px] text-orange-100">{index + 1}/{promos.length}</span>
          <button
            onClick={() => setIndex((i) => (i - 1 + promos.length) % promos.length)}
            className="rounded p-0.5 text-white hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIndex((i) => (i + 1) % promos.length)}
            className="rounded p-0.5 text-white hover:bg-white/20 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
