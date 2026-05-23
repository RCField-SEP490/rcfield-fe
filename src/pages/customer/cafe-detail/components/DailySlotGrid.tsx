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
}

type DailySlotGridProps = {
  slots: DailySlot[]
  selectedSlotId: string
  onSelectSlot: (slotId: string) => void
}

const statusCopy: Record<DailySlotStatus, string> = {
  available: "Còn",
  limited: "Ít",
  booked: "Hết",
  closed: "Đóng",
}

export function DailySlotGrid({ slots, selectedSlotId, onSelectSlot }: DailySlotGridProps) {
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
        {slots.map((slot) => {
          const isSelected = selectedSlotId === slot.id
          const isDisabled = slot.status === "booked" || slot.status === "closed"

          return (
            <Button
              key={slot.id}
              type="button"
              variant={isSelected ? "default" : "outline"}
              disabled={isDisabled}
              onClick={() => onSelectSlot(slot.id)}
              className={cn(
                "h-12 flex-col gap-0.5 rounded-md px-1 text-[11px] font-semibold",
                !isSelected && slot.status === "available" && "border-emerald-200 bg-emerald-50/70 text-emerald-900 hover:bg-emerald-100",
                !isSelected && slot.status === "limited" && "border-amber-200 bg-amber-50/80 text-amber-900 hover:bg-amber-100",
                isDisabled && "bg-muted text-muted-foreground opacity-80",
              )}
            >
              <span>{slot.startTime}</span>
              <span className="text-[10px] font-medium opacity-80">{statusCopy[slot.status]} {slot.remaining > 0 ? slot.remaining : ""}</span>
            </Button>
          )
        })}
      </div>

      <Badge variant="secondary" className="rounded-md px-2 py-1 text-[11px] font-medium">
        1 slot = 60 phút. Demo hiển thị đủ 24 slot/ngày để sau này map trực tiếp từ API availability.
      </Badge>
    </div>
  )
}

export function buildDailySlots(): DailySlot[] {
  return Array.from({ length: 24 }, (_, hour) => {
    const startTime = formatHour(hour)
    const endTime = formatHour((hour + 1) % 24)
    const status = getSlotStatus(hour)
    const remaining = getRemainingByStatus(status, hour)

    return {
      id: startTime,
      startTime,
      endTime,
      status,
      remaining,
    }
  })
}

function formatHour(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`
}

function getSlotStatus(hour: number): DailySlotStatus {
  if (hour < 8 || hour > 22) return "closed"
  if ([10, 15, 20].includes(hour)) return "limited"
  if ([12, 18, 21].includes(hour)) return "booked"
  return "available"
}

function getRemainingByStatus(status: DailySlotStatus, hour: number) {
  if (status === "closed" || status === "booked") return 0
  if (status === "limited") return 1
  return hour % 3 === 0 ? 4 : 6
}
