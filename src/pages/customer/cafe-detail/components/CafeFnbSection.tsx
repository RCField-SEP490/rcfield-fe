import { Coffee, Plus } from "lucide-react"
import { fnbMenuItems } from "@/features/customer-booking/data/customer-booking-demo"
import { formatCurrency } from "@/shared/lib/format"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"

const categoryCopy = {
  drink: "Đồ uống",
  snack: "Ăn nhẹ",
  meal: "Combo",
}

export function CafeFnbSection() {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Đặt trước đồ ăn & thức uống</h2>
          <p className="mt-1 text-sm text-slate-500">F&B nằm trong luồng checkout, khách có thể thêm nhanh sau khi chọn lịch.</p>
        </div>
        <Badge variant="outline" className="hidden rounded-full px-3 py-1 text-xs sm:inline-flex">
          PRE_ORDER
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {fnbMenuItems.map((item) => (
          <Card key={item.id} className="overflow-hidden rounded-xl border-slate-200 shadow-sm">
            <div className="aspect-[5/3] overflow-hidden bg-slate-100">
              <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
            </div>
            <CardContent className="space-y-3 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-bold text-slate-950">{item.name}</h3>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                    <Coffee className="h-3.5 w-3.5" />
                    {categoryCopy[item.category]}
                  </p>
                </div>
                <Badge variant={item.isAvailable ? "secondary" : "outline"} className="shrink-0 rounded-full text-[10px]">
                  {item.isAvailable ? "Có sẵn" : "Hết"}
                </Badge>
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-slate-950">{formatCurrency(item.price)}</p>
                <Button type="button" size="sm" variant="outline" className="h-8 rounded-lg px-2.5 text-xs" disabled={!item.isAvailable}>
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Thêm
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
