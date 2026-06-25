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
  selectedSlotEndId?: string
  onSelectSlot: (slotId: string) => void
  slotDurationMinutes?: number
  openHour?: number
  closeHour?: number
  date?: string
  onSelectRange?: (slotStart: string, slotEnd: string) => void
}

function slotAvailabilityLabel(slot: DailySlot): string {
  if (slot.status === "booked") return "Hết"
  if (slot.status === "closed") return "Đóng"
  const remaining = slot.rentalCount > 0 ? slot.rentalCount : slot.byocRemaining
  if (remaining > 0) return `Còn ${remaining}`
  return "Hết"
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
  selectedSlotEndId,
  onSelectSlot,
  slotDurationMinutes = 60,
  openHour = DEFAULT_OPEN_HOUR,
  closeHour = DEFAULT_CLOSE_HOUR,
  date,
  onSelectRange,
}: DailySlotGridProps) {
  const today = new Date().toISOString().slice(0, 10)
  const isToday = date === today

  const visibleSlots = slots.filter((s) => {
    const hour = parseInt(s.startTime.split(":")[0], 10)
    return hour >= openHour && hour < closeHour
  })

  const operationalSlots = Math.floor(((closeHour - openHour) * 60) / slotDurationMinutes)

  // Slot is within the confirmed selection range
  const isInSelectedRange = (slotId: string): boolean => {
    if (!selectedSlotId) return false
    const endTime = (selectedSlotEndId && selectedSlotEndId !== "")
      ? selectedSlotEndId
      : addMinutesToTime(selectedSlotId, slotDurationMinutes)
    return slotId >= selectedSlotId && slotId < endTime
  }

  // Check if all slots between anchor and targetId are available/limited (no booked/closed)
  const canExtendTo = (targetSlotId: string): boolean => {
    const startIdx = visibleSlots.findIndex((s) => s.id === selectedSlotId)
    const endIdx = visibleSlots.findIndex((s) => s.id === targetSlotId)
    if (startIdx === -1 || endIdx === -1) return false
    for (let i = startIdx; i <= endIdx; i++) {
      const s = visibleSlots[i]
      if (!s || s.status === "booked" || s.status === "closed") return false
    }
    return true
  }

  const startNew = (slot: DailySlot) => {
    if (onSelectRange) onSelectRange(slot.startTime, slot.endTime)
    else onSelectSlot(slot.id)
  }

  const deselect = () => {
    if (onSelectRange) onSelectRange("", "")
    else onSelectSlot("")
  }

  const handleSlotClick = (slot: DailySlot) => {
    if (slot.status === "booked" || slot.status === "closed") return

    if (!selectedSlotId) {
      startNew(slot)
      return
    }

    // Click anchor → deselect all
    if (slot.id === selectedSlotId) {
      deselect()
      return
    }

    // Click a slot inside range → shrink: remove this slot and all after it
    if (isInSelectedRange(slot.id)) {
      onSelectRange?.(selectedSlotId, slot.startTime)
      return
    }

    // Click after range end → extend if no blocked slots in between
    if (slot.id > selectedSlotId && canExtendTo(slot.id)) {
      onSelectRange?.(selectedSlotId, slot.endTime)
      return
    }

    // Click before anchor or blocked range → start fresh
    startNew(slot)
  }

  const numSelected = (() => {
    if (!selectedSlotId) return 0
    const endTime = (selectedSlotEndId && selectedSlotEndId !== "")
      ? selectedSlotEndId
      : addMinutesToTime(selectedSlotId, slotDurationMinutes)
    const diffMinutes = (() => {
      const [eh, em] = endTime.split(":").map(Number)
      const [sh, sm] = selectedSlotId.split(":").map(Number)
      return (eh * 60 + em) - (sh * 60 + sm)
    })()
    return Math.max(1, Math.round(diffMinutes / slotDurationMinutes))
  })()

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
          const isPast = isToday && (() => {
            const now = new Date()
            const [hh, mm] = slot.startTime.split(":").map(Number)
            return hh * 60 + mm <= now.getHours() * 60 + now.getMinutes()
          })()
          const isBooked = slot.status === "booked" || slot.status === "closed" || isPast
          const isSelected = isInSelectedRange(slot.id)
          const isAnchor = slot.id === selectedSlotId && isSelected

          return (
            <Button
              key={slot.id}
              type="button"
              disabled={isBooked}
              onClick={() => handleSlotClick(slot)}
              className={cn(
                "h-10 flex-col gap-0 rounded-md px-1 text-[11px] font-semibold border",
                isBooked && "bg-muted text-muted-foreground opacity-70 border-muted",
                !isSelected && !isBooked && slot.status === "available" && "border-emerald-200 bg-emerald-50/70 text-emerald-900 hover:bg-emerald-100",
                !isSelected && !isBooked && slot.status === "limited" && "border-amber-200 bg-amber-50/80 text-amber-900 hover:bg-amber-100",
                isSelected && !isAnchor && "bg-orange-300 text-white border-orange-300 hover:bg-orange-200",
                isAnchor && "bg-orange-500 text-white border-orange-500 hover:bg-orange-600",
              )}
            >
              <span>{slot.startTime}</span>
              <span className="text-[10px] font-medium opacity-80">{slotAvailabilityLabel(slot)}</span>
            </Button>
          )
        })}
      </div>

      {selectedSlotId && (
        <p className="text-[11px] text-orange-600 font-medium">
          {numSelected > 1
            ? `Đã chọn ${numSelected} slot: ${selectedSlotId} → ${selectedSlotEndId || addMinutesToTime(selectedSlotId, slotDurationMinutes)}`
            : `Đã chọn: ${selectedSlotId}`}
        </p>
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
