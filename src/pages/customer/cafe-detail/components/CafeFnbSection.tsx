import { useMemo } from "react"
import { Coffee, Plus, Minus } from "lucide-react"
import { UNCATEGORIZED_LABEL, type MenuItem } from "@/features/menu/types"
import { formatCurrency } from "@/shared/lib/format"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"
import { cn } from "@/shared/lib/utils"

type CafeFnbSectionProps = {
  menuItems: MenuItem[]
  isLoading?: boolean
  isError?: boolean
  fnbQuantities: Record<string, number>
  onChangeFnb: (quantities: Record<string, number>) => void
}

/**
 * Gom món theo danh mục, giữ nguyên thứ tự API trả về (đã sắp theo display_order
 * của danh mục, nhóm "Chưa phân loại" xếp cuối).
 *
 * ⚠️ Nhóm rỗng được loại bỏ tự nhiên vì chỉ sinh ra từ chính danh sách món đã lọc —
 * KHÔNG dùng `itemCount` của endpoint danh mục, vì trường đó đếm cả món tạm ngưng
 * bán nên danh mục toàn món ẩn vẫn có itemCount > 0 mà vẫn phải giấu khỏi khách.
 */
function groupByCategory(menuItems: MenuItem[]): Array<{ label: string; items: MenuItem[] }> {
  const groups: Array<{ label: string; items: MenuItem[] }> = []
  const indexByLabel = new Map<string, number>()

  for (const item of menuItems) {
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
}

export function CafeFnbSection({ menuItems, isLoading = false, isError = false, fnbQuantities, onChangeFnb }: CafeFnbSectionProps) {
  const groups = useMemo(() => groupByCategory(menuItems), [menuItems])

  const handleIncrement = (id: string) => {
    const current = fnbQuantities[id] ?? 0
    onChangeFnb({
      ...fnbQuantities,
      [id]: current + 1,
    })
  }

  const handleDecrement = (id: string) => {
    const current = fnbQuantities[id] ?? 0
    if (current <= 1) {
      const copy = { ...fnbQuantities }
      delete copy[id]
      onChangeFnb(copy)
    } else {
      onChangeFnb({
        ...fnbQuantities,
        [id]: current - 1,
      })
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Đặt trước đồ ăn & thức uống</h2>
          <p className="mt-1 text-sm text-slate-500">
            Chọn trước nước uống và thức ăn để được phục vụ ngay khi đến sân.
          </p>
        </div>
        <Badge variant="outline" className="hidden rounded-full px-3 py-1 text-xs sm:inline-flex border-orange-200 text-orange-600 bg-orange-50/20 font-medium">
          Đặt trước
        </Badge>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-64 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-medium text-slate-500">
          Không tải được menu đồ ăn từ API.
        </div>
      ) : menuItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-medium text-slate-500">
          Cơ sở này chưa mở bán đồ ăn hoặc thức uống.
        </div>
      ) : (
        <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.label} className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">{group.label}</h3>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {group.items.map((item) => {
          const quantity = fnbQuantities[item.id] ?? 0
          const hasSelected = quantity > 0
          const categoryLabel = item.categoryName ?? UNCATEGORIZED_LABEL

          return (
            <Card 
              key={item.id} 
              className={cn(
                "flex h-full flex-col overflow-hidden rounded-xl border-slate-200 shadow-sm transition-all duration-300",
                hasSelected && "ring-2 ring-orange-500 border-transparent shadow-[0_8px_24px_rgba(249,115,22,0.06)]"
              )}
            >
              <div className="aspect-[5/3] overflow-hidden bg-slate-100 relative">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover object-center" />
                ) : (
                  <div className="grid h-full place-items-center bg-slate-100 text-slate-400">
                    <Coffee className="h-8 w-8" />
                  </div>
                )}
                {hasSelected && (
                  <div className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                    Đã chọn {quantity}
                  </div>
                )}
              </div>
              <CardContent className="flex flex-1 flex-col space-y-3 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-slate-950">{item.name}</h3>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                      <Coffee className="h-3.5 w-3.5" />
                      {categoryLabel}
                    </p>
                  </div>
                  <Badge variant={item.isAvailable ? "secondary" : "outline"} className="shrink-0 rounded-full text-[10px]">
                    {item.isAvailable ? "Có sẵn" : "Hết"}
                  </Badge>
                </div>

                <div className="mt-auto flex items-center justify-between gap-3 border-t pt-3">
                  <p className="text-sm font-bold text-slate-950">{formatCurrency(Number(item.price))}</p>
                  
                  {hasSelected ? (
                    <div className="flex items-center gap-1.5 bg-slate-50 p-0.5 rounded-lg border border-slate-200 shadow-inner">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDecrement(item.id)}
                        className="h-7 w-7 rounded-md hover:bg-slate-200 hover:text-slate-950 text-slate-500 transition-colors"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="font-mono text-sm font-bold text-slate-950 min-w-[20px] text-center">
                        {quantity}
                      </span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleIncrement(item.id)}
                        className="h-7 w-7 rounded-md hover:bg-slate-200 hover:text-slate-950 text-slate-500 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleIncrement(item.id)}
                      className="h-8 rounded-lg px-3 text-xs font-semibold hover:text-orange-500 hover:border-orange-200 hover:bg-orange-50/10 transition-colors"
                      disabled={!item.isAvailable}
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Thêm
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
            </div>
          </div>
        ))}
        </div>
      )}
    </section>
  )
}
