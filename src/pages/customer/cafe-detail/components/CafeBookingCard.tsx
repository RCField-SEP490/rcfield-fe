import { useMemo, useState } from "react"
import { Link } from "react-router"
import { CalendarDays, Clock3, PackageCheck, Repeat2 } from "lucide-react"
import type { BookingMode } from "@/features/booking/data/booking-options"
import { bookingCatalog } from "@/features/booking/data/booking-options"
import type { Cafe } from "@/shared/data/explore-data"
import { formatCurrency } from "@/shared/lib/format"
import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { buildCafeBookingPath } from "../cafe-detail-utils"
import { buildDailySlots, DailySlotGrid } from "./DailySlotGrid"

type PlanSummary = {
  label: string
  note: string
  price: number
  meta: string
  checkoutMode: "SINGLE" | "PACKAGE" | "SUBSCRIPTION"
}

const bookingModes: Array<{
  value: BookingMode
  label: string
  shortLabel: string
  icon: typeof Clock3
}> = [
  { value: "hourly", label: "Theo giờ", shortLabel: "SINGLE", icon: Clock3 },
  { value: "slotPackage", label: "Gói slot", shortLabel: "PACKAGE", icon: PackageCheck },
  { value: "recurring", label: "Cố định", shortLabel: "SUBSCRIPTION", icon: Repeat2 },
]

export function CafeBookingCard({ cafe }: { cafe: Cafe }) {
  const slots = useMemo(() => buildDailySlots(), [])
  const defaultSlot = slots.find((slot) => slot.status === "available")?.id ?? slots[0]?.id ?? "09:00"
  const [mode, setMode] = useState<BookingMode>("hourly")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const [selectedSlotId, setSelectedSlotId] = useState(defaultSlot)
  const plan = getPlanSummary(mode)
  const selectedSlot = slots.find((slot) => slot.id === selectedSlotId)

  return (
    <Card className="rounded-2xl border-slate-200 shadow-[0_18px_60px_rgba(15,23,42,0.12)]">
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Đặt lịch chạy</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Chọn nhanh loại booking và slot trống</p>
          </div>
          <Badge variant="outline" className="rounded-full px-2.5 py-1 text-[11px]">
            60 phút/slot
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-1.5">
          {bookingModes.map((item) => {
            const Icon = item.icon
            const isActive = mode === item.value

            return (
              <Button
                key={item.value}
                type="button"
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => setMode(item.value)}
                className={cn("h-10 flex-col gap-0 rounded-lg px-1.5 text-[10px]", isActive && "shadow-sm")}
              >
                <span className="flex items-center gap-1 text-[11px]">
                  <Icon className="h-3 w-3" />
                  {item.label}
                </span>
                <span className="font-mono text-[9px] opacity-75">{item.shortLabel}</span>
              </Button>
            )
          })}
        </div>

        <div className="rounded-xl border bg-slate-50/80 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{plan.label}</p>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{plan.note}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-bold text-foreground">{formatCurrency(plan.price)}</p>
              <p className="text-[11px] text-muted-foreground">{plan.meta}</p>
            </div>
          </div>
        </div>

        <label className="block space-y-2">
          <span className="flex items-center gap-2 text-sm font-medium">
            <CalendarDays className="h-4 w-4" />
            Ngày chạy
          </span>
          <Input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
        </label>

        <DailySlotGrid slots={slots} selectedSlotId={selectedSlotId} onSelectSlot={setSelectedSlotId} />

        <div className="rounded-xl border bg-white p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tạm tính</span>
            <span className="font-bold text-foreground">{formatCurrency(plan.price)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>{plan.checkoutMode}</span>
            <span>{selectedDate} · {selectedSlot?.startTime ?? selectedSlotId}</span>
          </div>
        </div>

        <Button asChild className="h-11 w-full rounded-lg text-sm font-semibold">
          <Link to={buildCafeBookingPath(cafe.id, mode, { date: selectedDate, slot: selectedSlotId })}>
            Tiến hành đặt lịch
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function getPlanSummary(mode: BookingMode): PlanSummary {
  if (mode === "slotPackage") {
    const plan = bookingCatalog.slotPackages[0]
    return {
      label: plan.label,
      note: plan.note,
      price: plan.price,
      meta: `${plan.slots} slot`,
      checkoutMode: "PACKAGE",
    }
  }

  if (mode === "recurring") {
    const plan = bookingCatalog.recurringPlans[0]
    return {
      label: plan.label,
      note: plan.note,
      price: plan.pricePerMonth,
      meta: `${plan.sessionsPerMonth} buổi/tháng`,
      checkoutMode: "SUBSCRIPTION",
    }
  }

  const plan = bookingCatalog.hourlyPlans[0]
  return {
    label: plan.label,
    note: plan.note,
    price: plan.pricePerHour,
    meta: `${plan.durationHours} giờ`,
    checkoutMode: "SINGLE",
  }
}
