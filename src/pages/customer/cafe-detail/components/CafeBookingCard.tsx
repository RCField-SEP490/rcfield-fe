import { useMemo } from "react"
import { Link } from "react-router"
import { CalendarDays, Clock3, PackageCheck, Repeat2, ShoppingBag, CarFront } from "lucide-react"
import type { BookingMode } from "@/features/booking/data/booking-options"
import { bookingCatalog } from "@/features/booking/data/booking-options"
import type { MenuItem } from "@/features/menu/types"
import type { Cafe } from "@/shared/data/explore-data"
import { formatCurrency } from "@/shared/lib/format"
import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { buildCafeBookingPath } from "../cafe-detail-utils"
import { buildDailySlots, DailySlotGrid, type DailySlot, type DailySlotStatus } from "./DailySlotGrid"
import { useDailyAvailability, type HourlySlotAvailability } from "@/features/booking/hooks/use-booking"

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
  menuItems: MenuItem[]
}

export function CafeBookingCard({
  cafe,
  selectedVehicleId,
  fnbQuantities,
  mode,
  setMode,
  selectedDate,
  setSelectedDate,
  selectedSlotId,
  setSelectedSlotId,
  menuItems,
}: CafeBookingCardProps) {
  const { openHour, closeHour } = getOperatingHours(cafe.operatingHours, selectedDate)

  const { data: dailyAvailability, isLoading: availabilityLoading } = useDailyAvailability(cafe.id, selectedDate, openHour, closeHour)

  const slots = useMemo<DailySlot[]>(() => {
    if (!dailyAvailability) return buildDailySlots(openHour, closeHour)
    return buildSlotsFromAvailability(dailyAvailability)
  }, [dailyAvailability, openHour, closeHour])

  const defaultSlot = slots.find((slot) => slot.status === "available")?.id ?? slots[0]?.id ?? "09:00"

  const activeSlotId = selectedSlotId || defaultSlot
  const selectedSlot = slots.find((slot) => slot.id === activeSlotId)

  // Live Price Calculation — dùng giá thật từ cafe entity
  const plan = getPlanSummary(mode, cafe.slotFeeRate ?? 0, cafe.slotDurationMinutes ?? 60)
  
  const selectedVehicle = cafe.availableVehicles.find((v) => v.id === selectedVehicleId)
  const vehiclePrice = selectedVehicle ? selectedVehicle.pricePerHour : 0

  const fnbTotal = Object.entries(fnbQuantities).reduce((sum, [id, qty]) => {
    const item = menuItems.find((menuItem) => menuItem.id === id)
    return sum + (item ? Number(item.price) * qty : 0)
  }, 0)

  const fnbCount = Object.values(fnbQuantities).reduce((sum, qty) => sum + qty, 0)

  const totalPrice = plan.price + vehiclePrice + fnbTotal

  // Serialize F&B: "fnb-1:2,fnb-2:1"
  const serializedFnb = Object.entries(fnbQuantities)
    .map(([id, qty]) => `${id}:${qty}`)
    .join(",")

  return (
    <Card className="rounded-2xl border-slate-200 shadow-[0_18px_60px_rgba(15,23,42,0.12)] bg-white/95 backdrop-blur-md">
      <CardHeader className="space-y-1 p-4 pb-2">
        <div className="flex items-start justify-between gap-3">
          {/* <div>
            <CardTitle className="text-lg text-slate-950 font-bold">Đặt lịch chạy</CardTitle>
            <p className="mt-1 text-xs text-slate-500">Chọn nhanh loại booking và slot trống</p>
          </div> */}
          <Badge variant="outline" className="rounded-full px-2.5 py-1 text-[11px] border-orange-100 text-orange-600 bg-orange-50/30">
            {cafe.slotDurationMinutes ?? 60} phút/slot
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3.5 p-4 pt-0">
        {/* <div className="grid grid-cols-3 gap-1.5">
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
                className={cn(
                  "h-9 flex-col gap-0 rounded-lg px-1.5 text-[10px] transition-all", 
                  isActive ? "bg-orange-500 text-white hover:bg-orange-600 shadow-sm border-transparent" : "hover:text-orange-500 hover:border-orange-200"
                )}
              >
                <span className="flex items-center gap-1 text-[11px] font-semibold">
                  <Icon className="h-3 w-3" />
                  {item.label}
                </span>
                <span className="font-mono text-[9px] opacity-75">{item.shortLabel}</span>
              </Button>
            )
          })}
        </div> */}

        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-900">{plan.label}</p>
              <p className="mt-0.5 line-clamp-2 text-[10px] leading-4 text-slate-500">{plan.note}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs font-bold text-slate-900">{formatCurrency(plan.price)}</p>
              <p className="text-[9px] text-slate-500 font-medium">{plan.meta}</p>
            </div>
          </div>
        </div>

        <label className="block space-y-2">
          <span className="flex items-center gap-2 text-xs font-semibold text-slate-800">
            <CalendarDays className="h-4 w-4 text-slate-400" />
            Ngày chạy
          </span>
          <Input 
            type="date" 
            value={selectedDate} 
            onChange={(event) => setSelectedDate(event.target.value)} 
            className="h-9 text-xs rounded-lg"
          />
        </label>

        <div>
          <span className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-800">
            Chọn giờ
            {availabilityLoading && <span className="text-[10px] font-normal text-slate-400 animate-pulse">Đang kiểm tra slot...</span>}
          </span>
          <div className={cn("transition-opacity", availabilityLoading && "opacity-50 pointer-events-none")}>
            <DailySlotGrid
              slots={slots}
              selectedSlotId={activeSlotId}
              onSelectSlot={setSelectedSlotId}
              slotDurationMinutes={cafe.slotDurationMinutes ?? 60}
              openHour={openHour}
              closeHour={closeHour}
            />
          </div>
        </div>

        {/* Live Bill Breakdowns */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/30 p-3 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Tiền sân ({plan.checkoutMode})</span>
            <span className="font-mono">{formatCurrency(plan.price)}</span>
          </div>

          {selectedVehicle && (
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1">
                <CarFront className="h-3.5 w-3.5 text-orange-500" />
                {selectedVehicle.name}
              </span>
              <span className="font-mono">+{formatCurrency(vehiclePrice)}</span>
            </div>
          )}

          {fnbCount > 0 && (
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1">
                <ShoppingBag className="h-3.5 w-3.5 text-orange-500" />
                F&B đặt trước ({fnbCount} món)
              </span>
              <span className="font-mono">+{formatCurrency(fnbTotal)}</span>
            </div>
          )}

          <div className="border-t border-dashed border-slate-200 pt-2 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">Tổng tạm tính</span>
            <span className="text-sm font-black text-orange-600 font-mono">{formatCurrency(totalPrice)}</span>
          </div>
          
          <div className="text-[10px] text-slate-400 text-center">
            {selectedDate} · {selectedSlot?.startTime ?? activeSlotId}
          </div>
        </div>

        <Button asChild className="h-10 w-full rounded-lg text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-md transition-all active:scale-[0.98]">
          <Link to={buildCafeBookingPath(cafe.id, mode, {
            date: selectedDate,
            slot: activeSlotId,
            vehicleId: selectedVehicleId,
            fnb: serializedFnb,
            step: "participants"
          })}>
            Tiến hành đặt lịch
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]

function getOperatingHours(
  operatingHours: Record<string, { open?: string; close?: string; is_closed?: boolean }> | undefined,
  dateStr: string
): { openHour: number; closeHour: number } {
  if (!operatingHours) return { openHour: 8, closeHour: 22 }
  const dayKey = DAY_KEYS[new Date(dateStr).getDay()]
  const hours = operatingHours[dayKey]
  if (!hours || hours.is_closed) return { openHour: 8, closeHour: 22 }
  const openHour = hours.open ? parseInt(hours.open.split(":")[0], 10) : 8
  const closeHour = hours.close ? parseInt(hours.close.split(":")[0], 10) : 22
  return { openHour, closeHour }
}

function buildSlotsFromAvailability(hourlyData: HourlySlotAvailability[]): DailySlot[] {
  return hourlyData.map(({ hour, data }) => {
    const startTime = `${String(hour).padStart(2, "0")}:00`
    const endTime = `${String(hour + 1).padStart(2, "0")}:00`

    if (!data) {
      return { id: startTime, startTime, endTime, status: "booked" as DailySlotStatus, remaining: 0 }
    }

    const remaining = data.byoc_remaining ?? (data.vehicles?.length ?? 0)
    let status: DailySlotStatus
    if (!data.available || remaining === 0) status = "booked"
    else if (remaining <= 2) status = "limited"
    else status = "available"

    return { id: startTime, startTime, endTime, status, remaining }
  })
}

function getPlanSummary(mode: BookingMode, slotFeeRate: number, slotDurationMinutes: number): PlanSummary {
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

  // SINGLE (theo giờ): dùng giá thật từ cafe.slotFeeRate
  const durationHours = slotDurationMinutes / 60
  const durationLabel = Number.isInteger(durationHours) ? `${durationHours} giờ` : `${slotDurationMinutes} phút`
  return {
    label: `Tiêu chuẩn ${durationLabel}`,
    note: `${slotDurationMinutes} phút/slot · giá cố định theo quán`,
    price: slotFeeRate,
    meta: durationLabel,
    checkoutMode: "SINGLE",
  }
}
