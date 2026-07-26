import { useMemo } from "react"
import { Check, Clock3, Flame, Minus, Plus, ShoppingBag, Sparkles, UtensilsCrossed } from "lucide-react"
import type { MenuItem, PopularMenuItem } from "@/features/menu/types"
import { UNCATEGORIZED_LABEL } from "@/features/menu/types"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { formatCurrency } from "@/shared/lib/format"
import { cn } from "@/shared/lib/utils"

type FnbStepProps = {
  menuItems: MenuItem[]
  popularItems?: PopularMenuItem[]
  isLoading?: boolean
  quantities: Record<string, number>
  onQuantityChange: (itemId: string, quantity: number) => void
}

function toPrice(value: MenuItem["price"]): number {
  return typeof value === "string" ? parseFloat(value) : value
}

/**
 * Số tiền tiết kiệm khi mua combo so với mua lẻ từng món thành phần.
 * Tính từ giá thật của các món trong cùng menu — trả null nếu thiếu giá của
 * bất kỳ thành phần nào, để không bao giờ hiện con số phỏng đoán.
 */
function comboSaving(combo: MenuItem, priceById: Map<string, number>): number | null {
  if (!combo.isCombo || !combo.components?.length) return null

  let sum = 0
  for (const component of combo.components) {
    const price = priceById.get(component.itemId)
    if (price === undefined) return null
    sum += price * component.quantity
  }

  const saving = sum - toPrice(combo.price)
  return saving > 0 ? saving : null
}

export function FnbStep({
  menuItems,
  popularItems = [],
  isLoading,
  quantities,
  onQuantityChange,
}: FnbStepProps) {
  const availableItems = useMemo(() => menuItems.filter((item) => item.isAvailable), [menuItems])

  // Giá của MỌI món (kể cả món tạm ẩn) để tính đúng giá trị combo
  const priceById = useMemo(
    () => new Map(menuItems.map((item) => [item.id, toPrice(item.price)])),
    [menuItems],
  )

  const orderCountById = useMemo(
    () => new Map(popularItems.map((p) => [p.menuItemId, p.orderCount])),
    [popularItems],
  )

  // Chỉ giữ món phổ biến còn đang bán — backend đã lọc ngưỡng tối thiểu
  const highlighted = useMemo(
    () =>
      popularItems
        .map((p) => availableItems.find((item) => item.id === p.menuItemId))
        .filter((item): item is MenuItem => Boolean(item)),
    [popularItems, availableItems],
  )
  const highlightedIds = useMemo(() => new Set(highlighted.map((i) => i.id)), [highlighted])

  const restGroups = useMemo(() => {
    const groups: Array<{ label: string; items: MenuItem[] }> = []
    const indexByLabel = new Map<string, number>()

    for (const item of availableItems) {
      if (highlightedIds.has(item.id)) continue
      const label = item.categoryName ?? UNCATEGORIZED_LABEL
      const existing = indexByLabel.get(label)
      if (existing === undefined) {
        indexByLabel.set(label, groups.length)
        groups.push({ label, items: [item] })
      } else {
        groups[existing].items.push(item)
      }
    }
    return groups
  }, [availableItems, highlightedIds])

  const selected = useMemo(() => {
    const items = availableItems
      .map((item) => ({ item, quantity: quantities[item.id] ?? 0 }))
      .filter(({ quantity }) => quantity > 0)
    const count = items.reduce((sum, { quantity }) => sum + quantity, 0)
    const total = items.reduce(
      (sum, { item, quantity }) => sum + toPrice(item.price) * quantity,
      0,
    )
    return { items, count, total }
  }, [availableItems, quantities])

  const renderCard = (item: MenuItem, rank?: number) => (
    <FnbCard
      key={item.id}
      item={item}
      quantity={quantities[item.id] ?? 0}
      onQuantityChange={(quantity) => onQuantityChange(item.id, quantity)}
      saving={comboSaving(item, priceById)}
      orderCount={orderCountById.get(item.id)}
      isTopSeller={rank === 0}
    />
  )

  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="space-y-3">
        <div>
          <CardTitle>Gọi món trước, đến là có ngay</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Quán chuẩn bị sẵn theo giờ bạn đặt, khỏi mất thời gian chờ giữa buổi chơi.
          </p>
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock3 className="h-3.5 w-3.5 text-orange-500" />
            Đồ có sẵn khi bạn tới sân
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-orange-500" />
            Thanh toán chung một lần với phí sân
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : availableItems.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-10 text-center">
            <UtensilsCrossed className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">Cơ sở chưa có menu F&B</p>
            <p className="text-xs text-muted-foreground">Bạn có thể gọi trực tiếp tại quán khi đến.</p>
          </div>
        ) : (
          <>
            {highlighted.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <h3 className="text-sm font-bold">Khách ở đây hay gọi</h3>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {highlighted.map((item, index) => renderCard(item, index))}
                </div>
              </section>
            )}

            {restGroups.map((group) => (
              <section key={group.label} className="space-y-3">
                <h3 className="text-sm font-bold">{group.label}</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {group.items.map((item) => renderCard(item))}
                </div>
              </section>
            ))}
          </>
        )}

        {selected.count > 0 ? (
          <section aria-label="Món đã chọn" className="rounded-xl border border-orange-200 bg-orange-50/60 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                  <ShoppingBag className="size-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Món đã chọn</h3>
                  <p className="text-sm text-slate-600">{selected.count} món</p>
                </div>
              </div>
              <p className="text-lg font-bold text-orange-600">{formatCurrency(selected.total)}</p>
            </div>

            <div className="mt-3 divide-y divide-orange-100 rounded-lg border border-orange-100 bg-white px-3">
              {selected.items.map(({ item, quantity }) => {
                const price = toPrice(item.price)
                return (
                  <div key={item.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{item.name}</p>
                      <p className="text-slate-500">
                        {quantity} × {formatCurrency(price)}
                      </p>
                    </div>
                    <p className="shrink-0 font-semibold text-slate-900">
                      {formatCurrency(price * quantity)}
                    </p>
                  </div>
                )
              })}
            </div>
          </section>
        ) : (
          availableItems.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Không bắt buộc — bạn vẫn có thể gọi thêm tại quán, nhưng sẽ phải chờ pha chế.
            </p>
          )
        )}
      </CardContent>
    </Card>
  )
}

function FnbCard({
  item,
  quantity,
  onQuantityChange,
  saving,
  orderCount,
  isTopSeller,
}: {
  item: MenuItem
  quantity: number
  onQuantityChange: (quantity: number) => void
  saving: number | null
  orderCount?: number
  isTopSeller?: boolean
}) {
  const price = toPrice(item.price)
  const isSelected = quantity > 0

  return (
    <div
      className={cn(
        "grid grid-cols-[104px_1fr] overflow-hidden rounded-xl border bg-background transition-colors duration-200",
        isSelected && "border-orange-400 bg-orange-50/40",
      )}
    >
      <div className="relative">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="h-full min-h-32 w-full object-cover" />
        ) : (
          <div className="flex h-full min-h-32 w-full items-center justify-center bg-muted">
            <UtensilsCrossed className="h-6 w-6 text-muted-foreground/40" />
          </div>
        )}
        {isSelected && (
          <span className="absolute left-1.5 top-1.5 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">
            {quantity}
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-col justify-between gap-2 p-3">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-1 text-sm font-semibold">{item.name}</p>
            {item.categoryName ? (
              <Badge
                variant="secondary"
                className={cn("shrink-0", item.isCombo && "bg-orange-100 text-orange-700 hover:bg-orange-100")}
              >
                {item.categoryName}
              </Badge>
            ) : item.isCombo ? (
              <Badge className="shrink-0 bg-orange-100 text-orange-700 hover:bg-orange-100">Combo</Badge>
            ) : null}
          </div>

          {item.isCombo && item.components && item.components.length > 0 && (
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
              {item.components.map((c) => `${c.quantity > 1 ? `${c.quantity}× ` : ""}${c.name}`).join(" + ")}
            </p>
          )}

          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-sm font-semibold">{formatCurrency(price)}</p>
            {saving !== null && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                <Sparkles className="h-3 w-3" />
                Rẻ hơn {formatCurrency(saving)} so với gọi lẻ
              </span>
            )}
          </div>

          {/* Số liệu thật từ đơn đã phát sinh — không hiện gì nếu backend không trả về */}
          {orderCount !== undefined && (
            <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
              <Flame className="h-3 w-3 text-orange-500" />
              {isTopSeller ? "Được gọi nhiều nhất · " : ""}
              {orderCount} lượt đặt gần đây
            </p>
          )}
        </div>

        <div className="flex items-center justify-end">
          {isSelected ? (
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="icon"
                variant="outline"
                aria-label={`Bớt một ${item.name}`}
                className="h-9 w-9 rounded-lg"
                onClick={() => onQuantityChange(Math.max(0, quantity - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-7 text-center text-sm font-bold tabular-nums">{quantity}</span>
              <Button
                type="button"
                size="icon"
                variant="outline"
                aria-label={`Thêm một ${item.name}`}
                className="h-9 w-9 rounded-lg"
                onClick={() => onQuantityChange(quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-9 gap-1.5 rounded-lg px-3 font-semibold"
              onClick={() => onQuantityChange(1)}
            >
              <Plus className="h-4 w-4" />
              Thêm
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
