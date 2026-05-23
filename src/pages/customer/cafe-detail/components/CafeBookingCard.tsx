import { useState } from "react"
import { Link } from "react-router"
import type { BookingMode } from "@/features/booking/data/booking-options"
import { bookingCatalog } from "@/features/booking/data/booking-options"
import type { Cafe } from "@/shared/data/explore-data"
import { formatCurrency } from "@/shared/lib/format"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { cn } from "@/shared/lib/utils"
import { buildCafeBookingPath } from "../cafe-detail-utils"

type Tab = BookingMode

type PlanSummary = {
  label: string
  note: string
  price: number
  meta: string
}

const tabs: { value: Tab; label: string }[] = [
  { value: "hourly", label: "Theo giờ" },
  { value: "slotPackage", label: "Gói slot" },
  { value: "recurring", label: "Cố định" },
]

export function CafeBookingCard({ cafe }: { cafe: Cafe }) {
  const [tab, setTab] = useState<Tab>("hourly")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const [selectedTimeId, setSelectedTimeId] = useState(bookingCatalog.timeOptions[0])
  const plan = getPlanSummary(tab)

  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Đặt lịch chạy</CardTitle>
        <p className="text-sm text-muted-foreground">Chọn gói dịch vụ và thời gian</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
          {tabs.map((item) => (
            <Button
              key={item.value}
              type="button"
              variant={tab === item.value ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setTab(item.value)}
              className={cn("h-8 px-2 text-xs", tab === item.value && "bg-background shadow-sm")}
            >
              {item.label}
            </Button>
          ))}
        </div>

        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">{plan.label}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{plan.note}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">{formatCurrency(plan.price)}</p>
              <Badge variant="outline" className="mt-1 rounded-md">{plan.meta}</Badge>
            </div>
          </div>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium">Ngày chạy</span>
          <Input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
        </label>

        <div className="space-y-2">
          <p className="text-sm font-medium">Khung giờ</p>
          <div className="grid grid-cols-3 gap-2">
            {bookingCatalog.timeOptions.map((time) => (
              <Button
                key={time}
                type="button"
                variant={selectedTimeId === time ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTimeId(time)}
              >
                {time}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Xe thuê</p>
          <div className="space-y-2">
            {cafe.availableVehicles.slice(0, 3).map((vehicle) => (
              <div key={vehicle.id} className="flex items-center justify-between rounded-lg border p-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{vehicle.name}</p>
                  <p className="text-xs text-muted-foreground">{vehicle.scale}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatCurrency(vehicle.pricePerHour)}</p>
                  <span className={cn("text-xs", vehicle.status === "available" ? "text-emerald-600" : "text-destructive")}>{vehicle.status === "available" ? "Sẵn" : "Bận"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button asChild className="w-full">
          <Link to={buildCafeBookingPath(cafe.id, tab)}>Tiến hành đặt lịch</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function getPlanSummary(tab: Tab): PlanSummary {
  if (tab === "slotPackage") {
    const plan = bookingCatalog.slotPackages[0]
    return { label: plan.label, note: plan.note, price: plan.price, meta: `${plan.slots} slot` }
  }
  if (tab === "recurring") {
    const plan = bookingCatalog.recurringPlans[0]
    return { label: plan.label, note: plan.note, price: plan.pricePerMonth, meta: `${plan.sessionsPerMonth} buổi/tháng` }
  }
  const plan = bookingCatalog.hourlyPlans[0]
  return { label: plan.label, note: plan.note, price: plan.pricePerHour, meta: `${plan.durationHours} giờ` }
}
