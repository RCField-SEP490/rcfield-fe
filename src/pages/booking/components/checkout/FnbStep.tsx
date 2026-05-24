import { Minus, Plus, ShoppingBag } from "lucide-react"
import type { FnbMenuItem } from "@/features/customer-booking/data/customer-booking-demo"
import { fnbMenuItems } from "@/features/customer-booking/data/customer-booking-demo"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { formatCurrency } from "@/shared/lib/format"

type FnbStepProps = {
  quantities: Record<string, number>
  onQuantityChange: (itemId: string, quantity: number) => void
}

export function FnbStep({ quantities, onQuantityChange }: FnbStepProps) {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader>
        <CardTitle>Đặt trước F&B</CardTitle>
        <p className="text-sm text-muted-foreground">Pre-order gắn với booking, session_id có thể NULL cho đến khi check-in.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border bg-muted/30 p-4">
          <div className="flex items-start gap-3">
            <ShoppingBag className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">F&B là tùy chọn</p>
              <p className="mt-1 text-sm text-muted-foreground">Bạn có thể đặt nước/đồ ăn nhẹ trước để quán chuẩn bị khi đến sân.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {fnbMenuItems.map((item) => (
            <FnbCard
              key={item.id}
              item={item}
              quantity={quantities[item.id] ?? 0}
              onQuantityChange={(quantity) => onQuantityChange(item.id, quantity)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function FnbCard({
  item,
  quantity,
  onQuantityChange,
}: {
  item: FnbMenuItem
  quantity: number
  onQuantityChange: (quantity: number) => void
}) {
  return (
    <div className="grid grid-cols-[96px_1fr] overflow-hidden rounded-xl border bg-background">
      <img src={item.image} alt={item.name} className="h-full min-h-28 w-full object-cover" />
      <div className="flex min-w-0 flex-col justify-between gap-3 p-3">
        <div>
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-1 text-sm font-semibold">{item.name}</p>
            <Badge variant="secondary" className="capitalize">{item.category}</Badge>
          </div>
          <p className="mt-1 text-sm font-semibold">{formatCurrency(item.price)}</p>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{item.isAvailable ? "Có sẵn" : "Tạm hết"}</p>
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
