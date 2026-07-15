import { useMemo } from "react"
import { Link } from "react-router"
import { CalendarDays } from "lucide-react"
import type { BookingMode } from "@/features/booking/data/booking-options"
import type { MenuItem } from "@/features/menu/types"
import type { Cafe } from "@/shared/data/explore-data"
import { formatCurrency } from "@/shared/lib/format"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { buildCafeBookingPath } from "../cafe-detail-utils"

type CafeBookingCardProps = {
  cafe: Cafe
  selectedVehicleId?: string
  fnbQuantities: Record<string, number>
  mode: BookingMode
  setMode: (mode: BookingMode) => void
  selectedDate: string
  setSelectedDate: (date: string) => void
  selectedSlotId: string
  setSelectedSlotId: (slot: string) => void
  selectedSlotEnd?: string
  setSelectedSlotEnd?: (slotEnd: string) => void
  menuItems: MenuItem[]
}

export function CafeBookingCard({
  cafe,
  selectedVehicleId,
  fnbQuantities,
  mode,
  selectedDate,
  setSelectedDate,
  menuItems,
}: CafeBookingCardProps) {
  const slotFeeRate = cafe.slotFeeRate ?? 0
  const slotDuration = cafe.slotDurationMinutes
  const hasConfiguredSlotDuration =
    typeof slotDuration === "number" &&
    Number.isInteger(slotDuration) &&
    slotDuration > 0
  const durationLabel = hasConfiguredSlotDuration
    ? slotDuration === 60
      ? "1 giờ"
      : `${slotDuration} phút`
    : "Chưa cấu hình"

  const fnbTotal = useMemo(() => {
    return Object.entries(fnbQuantities).reduce((sum, [id, qty]) => {
      const item = menuItems.find((m) => m.id === id)
      return sum + (item ? Number(item.price) * qty : 0)
    }, 0)
  }, [fnbQuantities, menuItems])

  const vehiclePrice =
    cafe.availableVehicles.find((v) => v.id === selectedVehicleId)
      ?.pricePerHour ?? 0
  const totalEstimate = Number(slotFeeRate) + vehiclePrice + fnbTotal

  // Serialize F&B for URL
  const serializedFnb = Object.entries(fnbQuantities)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => `${id}:${qty}`)
    .join(",")

  const bookingPath = buildCafeBookingPath(cafe.id, mode, {
    date: selectedDate,
    vehicleId: selectedVehicleId,
    fnb: serializedFnb || undefined,
  })

  return (
    <Card className="rounded-2xl border-slate-200 shadow-[0_18px_60px_rgba(15,23,42,0.12)] bg-white/95 backdrop-blur-md">
      <CardHeader className="p-4 pb-2">
        <Badge
          variant="outline"
          className="w-fit rounded-full px-2.5 py-1 text-[11px] border-orange-100 text-orange-600 bg-orange-50/30"
        >
          {durationLabel}/slot
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4 p-4 pt-0">
        {/* Date picker */}
        <label className="block space-y-1.5">
          <span className="flex items-center gap-2 text-xs font-semibold text-slate-800">
            <CalendarDays className="h-4 w-4 text-slate-400" />
            Chọn ngày
          </span>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-9 text-xs rounded-lg"
          />
        </label>

        {/* Price estimate */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/30 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Tiền sân ({durationLabel})</span>
            <span className="font-mono">
              {formatCurrency(Number(slotFeeRate))}
            </span>
          </div>
          {vehiclePrice > 0 && (
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Thuê xe</span>
              <span className="font-mono">+{formatCurrency(vehiclePrice)}</span>
            </div>
          )}
          {fnbTotal > 0 && (
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>F&B đặt trước</span>
              <span className="font-mono">+{formatCurrency(fnbTotal)}</span>
            </div>
          )}
          <div className="border-t border-dashed border-slate-200 pt-2 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">
              Tạm tính / slot
            </span>
            <span className="text-sm font-black text-orange-600 font-mono">
              {formatCurrency(totalEstimate)}
            </span>
          </div>
        </div>

        <Button
          asChild
          className="h-11 w-full rounded-lg text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-md transition-all active:scale-[0.98]"
        >
          <Link to={bookingPath}>Đặt lịch ngay →</Link>
        </Button>

        <p className="text-center text-[10px] text-slate-400">
          Chọn loại sân & giờ ở bước tiếp theo
        </p>
      </CardContent>
    </Card>
  )
}
