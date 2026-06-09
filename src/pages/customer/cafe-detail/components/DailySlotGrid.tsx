import { useState } from "react"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/lib/utils"

export type DailySlotStatus = "available" | "limited" | "booked" | "closed"

export type DailySlot = {
  id: string
  startTime: string
  endTime: string
  status: DailySlotStatus
  remaining: number
  rentalCount: number
  byocRemaining: number
}

const DEFAULT_OPEN_HOUR = 8
const DEFAULT_CLOSE_HOUR = 22

type DailySlotGridProps = {
  slots: DailySlot[]
  selectedSlotId: string
  onSelectSlot: (slotId: string) => void
  slotDurationMinutes?: number
  openHour?: number
  closeHour?: number
  /** Called with (slotStart, slotEnd) after user picks a duration */
  onSelectRange?: (slotStart: string, slotEnd: string) => void
}

function slotAvailabilityLabel(slot: DailySlot): string {
  if (slot.status === "booked") return "Hết"
  if (slot.status === "closed") return "Đóng"
  if (slot.rentalCount > 0 && slot.byocRemaining > 0) return `${slot.rentalCount}xe·${slot.byocRemaining}B`
  if (slot.rentalCount > 0) return `${slot.rentalCount} xe`
  if (slot.byocRemaining > 0) return `BYOC ${slot.byocRemaining}`
  return "Hết"
}

/** Returns true if all slots in range [startId, startId + durationSlots) are available/limited */
function isRangeAvailable(slots: DailySlot[], startId: string, durationSlots: number): boolean {
  const startIdx = slots.findIndex((s) => s.id === startId)
  if (startIdx === -1) return false
  for (let i = 0; i < durationSlots; i++) {
    const s = slots[startIdx + i]
    if (!s || s.status === "booked" || s.status === "closed") return false
  }
  return true
}

function addMinutesToTime(time: string, minutes: number): string {
  const [hh, mm] = time.split(":").map(Number)
  const total = hh * 60 + mm + minutes
  const endHH = String(Math.floor(total / 60)).padStart(2, "0")
  const endMM = String(total % 60).padStart(2, "0")
  return `${endHH}:${endMM}`
}

export function DailySlotGrid({
  slots,
  selectedSlotId,
  onSelectSlot,
  slotDurationMinutes = 60,
  openHour = DEFAULT_OPEN_HOUR,
  closeHour = DEFAULT_CLOSE_HOUR,
  onSelectRange,
}: DailySlotGridProps) {
  const [pendingSlotId, setPendingSlotId] = useState<string | null>(null)

  const visibleSlots = slots.filter((s) => {
    const hour = parseInt(s.startTime.split(":")[0], 10)
    return hour >= openHour && hour < closeHour
  })

  const operationalSlots = Math.floor((closeHour - openHour) * 60 / slotDurationMinutes)
  const maxDurationSlots = 8

  const handleSlotClick = (slotId: string) => {
    if (onSelectRange) {
      // Multi-slot mode: show duration stepper
      setPendingSlotId(slotId === pendingSlotId ? null : slotId)
      onSelectSlot(slotId)
    } else {
      onSelectSlot(slotId)
    }
  }

  const handleDurationSelect = (durationSlots: number) => {
    if (!pendingSlotId) return
    const slot = visibleSlots.find((s) => s.id === pendingSlotId)
    if (!slot) return
    const slotEnd = addMinutesToTime(slot.startTime, durationSlots * slotDurationMinutes)
    onSelectRange?.(slot.startTime, slotEnd)
    setPendingSlotId(null)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">Slot trong ngày</p>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>Còn chỗ</span>
          <span className="ml-1 h-2 w-2 rounded-full bg-amber-500" />
          <span>Sắp đầy</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {visibleSlots.map((slot) => {
          const isSelected = selectedSlotId === slot.id
          const isDisabled = slot.status === "booked" || slot.status === "closed"
          const isPending = pendingSlotId === slot.id

          return (
            <Button
              key={slot.id}
              type="button"
              variant={isSelected || isPending ? "default" : "outline"}
              disabled={isDisabled}
              onClick={() => handleSlotClick(slot.id)}
              className={cn(
                "h-10 flex-col gap-0 rounded-md px-1 text-[11px] font-semibold",
                !isSelected && !isPending && slot.status === "available" && "border-emerald-200 bg-emerald-50/70 text-emerald-900 hover:bg-emerald-100",
                !isSelected && !isPending && slot.status === "limited" && "border-amber-200 bg-amber-50/80 text-amber-900 hover:bg-amber-100",
                isDisabled && "bg-muted text-muted-foreground opacity-80",
                isPending && "ring-2 ring-orange-400",
              )}
            >
              <span>{slot.startTime}</span>
              <span className="text-[10px] font-medium opacity-80">{slotAvailabilityLabel(slot)}</span>
            </Button>
          )
        })}
      </div>

      {/* Duration stepper — shown when a slot is selected in multi-slot mode */}
      {pendingSlotId && onSelectRange && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 space-y-2">
          <p className="text-xs font-bold text-orange-900">Chọn số giờ từ {pendingSlotId}</p>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: maxDurationSlots }, (_, i) => i + 1).map((n) => {
              const available = isRangeAvailable(visibleSlots, pendingSlotId, n)
              const endTime = addMinutesToTime(pendingSlotId, n * slotDurationMinutes)
              return (
                <Button
                  key={n}
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!available}
                  onClick={() => handleDurationSelect(n)}
                  className={cn(
                    "h-8 px-2.5 text-xs font-bold",
                    available
                      ? "border-orange-300 bg-white text-orange-800 hover:bg-orange-100"
                      : "opacity-40",
                  )}
                >
                  {n}h → {endTime}
                </Button>
              )
            })}
          </div>
          <button
            type="button"
            onClick={() => setPendingSlotId(null)}
            className="text-[10px] text-slate-500 underline"
          >
            Hủy chọn
          </button>
        </div>
      )}

      <Badge variant="secondary" className="rounded-md px-2 py-1 text-[11px] font-medium">
        {operationalSlots} slot/ngày · {String(openHour).padStart(2, "0")}:00–{String(closeHour).padStart(2, "0")}:00
      </Badge>
    </div>
  )
}

export function buildDailySlots(openHour = DEFAULT_OPEN_HOUR, closeHour = DEFAULT_CLOSE_HOUR): DailySlot[] {
  return Array.from({ length: closeHour - openHour }, (_, i) => {
    const hour = i + openHour
    const startTime = formatHour(hour)
    const endTime = formatHour(hour + 1)
    const status = getMockStatus(hour)
    const remaining = status === "available" ? 4 : status === "limited" ? 1 : 0
    return {
      id: startTime,
      startTime,
      endTime,
      status,
      remaining,
      rentalCount: 0,
      byocRemaining: remaining,
    }
  })
}

function formatHour(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`
}

function getMockStatus(hour: number): DailySlotStatus {
  if ([10, 15, 20].includes(hour)) return "limited"
  if ([12, 18, 21].includes(hour)) return "booked"
  return "available"
}
