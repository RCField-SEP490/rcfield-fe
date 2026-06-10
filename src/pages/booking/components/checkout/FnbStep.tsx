import { Minus, Plus, ShoppingBag, UtensilsCrossed } from "lucide-react"
import type { MenuItem } from "@/features/menu/types"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { formatCurrency } from "@/shared/lib/format"

type FnbStepProps = {
  menuItems: MenuItem[]
  isLoading?: boolean
  quantities: Record<string, number>
  onQuantityChange: (itemId: string, quantity: number) => void
}

export function FnbStep({ menuItems, isLoading, quantities, onQuantityChange }: FnbStepProps) {
  const availableItems = menuItems.filter((item) => item.isAvailable)

  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader>
        <CardTitle>Đặt trước F&B</CardTitle>
        <p className="text-sm text-muted-foreground">Đặt nước/đồ ăn nhẹ trước để quán chuẩn bị khi bạn đến sân.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border bg-muted/30 p-4">
          <div className="flex items-start gap-3">
            <ShoppingBag className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">F&B là tùy chọn</p>
              <p className="mt-1 text-sm text-muted-foreground">Bạn có thể bỏ qua bước này và gọi thêm trực tiếp tại quán.</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : availableItems.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-10 text-center">
            <UtensilsCrossed className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">Cơ sở chưa có menu F&B</p>
            <p className="text-xs text-muted-foreground">Bạn có thể gọi trực tiếp tại quán khi đến.</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {availableItems.map((item) => (
              <FnbCard
                key={item.id}
                item={item}
                quantity={quantities[item.id] ?? 0}
                onQuantityChange={(quantity) => onQuantityChange(item.id, quantity)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function FnbCard({
  item,
  quantity,
  onQuantityChange,
}: {
  item: MenuItem
  quantity: number
  onQuantityChange: (quantity: number) => void
}) {
  const price = typeof item.price === "string" ? parseFloat(item.price) : item.price

  return (
    <div className="grid grid-cols-[96px_1fr] overflow-hidden rounded-xl border bg-background">
      {item.imageUrl ? (
        <img src={item.imageUrl} alt={item.name} className="h-full min-h-28 w-full object-cover" />
      ) : (
        <div className="flex h-full min-h-28 w-full items-center justify-center bg-muted">
          <UtensilsCrossed className="h-6 w-6 text-muted-foreground/40" />
        </div>
      )}
      <div className="flex min-w-0 flex-col justify-between gap-3 p-3">
        <div>
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-1 text-sm font-semibold">{item.name}</p>
            {item.category && (
              <Badge variant="secondary" className="capitalize shrink-0">{item.category}</Badge>
            )}
          </div>
          <p className="mt-1 text-sm font-semibold">{formatCurrency(price)}</p>
        </div>
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              disabled={quantity === 0}
              onClick={() => onQuantityChange(Math.max(0, quantity - 1))}
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <span className="w-5 text-center text-sm font-semibold">{quantity}</span>
            <Button type="button" size="icon-sm" variant="outline" onClick={() => onQuantityChange(quantity + 1)}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
