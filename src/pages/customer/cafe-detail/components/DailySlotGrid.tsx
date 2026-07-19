import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/lib/utils"
import { Clock3 } from "lucide-react"
import { useState } from "react"

export type DailySlotStatus = "available" | "limited" | "booked" | "closed"
export type DailySlotCapacityKind = "rental_vehicle" | "byoc_spot"

export type DailySlot = {
  id: string
  startTime: string
  endTime: string
  status: DailySlotStatus
  remaining: number
  rentalCount: number
  byocRemaining: number
  capacityKind: DailySlotCapacityKind
}

type DailySlotGridProps = {
  slots: DailySlot[]
  selectedSlotId: string
  selectedSlotEndId?: string
  onSelectSlot: (slotId: string) => void
  slotDurationMinutes: number
  openHour: number
  closeHour: number
  date?: string
  onSelectRange?: (slotStart: string, slotEnd: string) => void
  minBookingNoticeMinutes?: number
  noticeMessage?: string
  maxSelectableSlots?: number
}

function capacityLabel(kind: DailySlotCapacityKind): string {
  return kind === "rental_vehicle" ? "xe thuê" : "chỗ mang xe riêng"
}

function slotAvailabilityLabel(slot: DailySlot): string {
  if (slot.status === "booked") return "Hết"
  if (slot.status === "closed") return "Đóng"
  if (slot.remaining > 0)
    return `Còn ${slot.remaining} ${capacityLabel(slot.capacityKind)}`
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
  slotDurationMinutes,
  openHour,
  closeHour,
  date,
  onSelectRange,
  minBookingNoticeMinutes = 0,
  noticeMessage,
  maxSelectableSlots = 8,
}: DailySlotGridProps) {
  const [selectionLimitMessage, setSelectionLimitMessage] = useState(false)
  const today = new Date().toLocaleDateString("sv-SE")
  const isToday = date === today
  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const availabilityLabel = capacityLabel(
    slots[0]?.capacityKind ?? "rental_vehicle",
  )

  const visibleSlots = slots.filter((s) => {
    const hour = parseInt(s.startTime.split(":")[0], 10)
    return hour >= openHour && hour < closeHour
  })

  const operationalSlots = Math.floor(
    ((closeHour - openHour) * 60) / slotDurationMinutes,
  )

  const getSlotTiming = (slot: DailySlot) => {
    const [hh, mm] = slot.startTime.split(":").map(Number)
    const slotMinutes = hh * 60 + mm
    const isPast = isToday && slotMinutes < nowMinutes
    const isTooSoon =
      isToday &&
      !isPast &&
      minBookingNoticeMinutes > 0 &&
      slotMinutes - nowMinutes < minBookingNoticeMinutes

    return { isPast, isTooSoon }
  }

  // Slot is within the confirmed selection range
  const isInSelectedRange = (slotId: string): boolean => {
    if (!selectedSlotId) return false
    const endTime =
      selectedSlotEndId && selectedSlotEndId !== ""
        ? selectedSlotEndId
        : addMinutesToTime(selectedSlotId, slotDurationMinutes)
    return slotId >= selectedSlotId && slotId < endTime
  }

  // Check if all slots between anchor and targetId are available/limited (no booked/closed)
  const canExtendTo = (targetSlotId: string): boolean => {
    const startIdx = visibleSlots.findIndex((s) => s.id === selectedSlotId)
    const endIdx = visibleSlots.findIndex((s) => s.id === targetSlotId)
    if (startIdx === -1 || endIdx === -1) return false
    if (endIdx - startIdx + 1 > maxSelectableSlots) return false
    for (let i = startIdx; i <= endIdx; i++) {
      const s = visibleSlots[i]
      const { isPast, isTooSoon } = s
        ? getSlotTiming(s)
        : { isPast: true, isTooSoon: false }
      if (
        !s ||
        s.status === "booked" ||
        s.status === "closed" ||
        isPast ||
        isTooSoon
      )
        return false
    }
    return true
  }

  const startNew = (slot: DailySlot) => {
    setSelectionLimitMessage(false)
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
      setSelectionLimitMessage(false)
      deselect()
      return
    }

    // Click a slot inside range → shrink: remove this slot and all after it
    if (isInSelectedRange(slot.id)) {
      setSelectionLimitMessage(false)
      onSelectRange?.(selectedSlotId, slot.startTime)
      return
    }

    // Click after range end → extend if no blocked slots in between
    if (slot.id > selectedSlotId && canExtendTo(slot.id)) {
      setSelectionLimitMessage(false)
      onSelectRange?.(selectedSlotId, slot.endTime)
      return
    }

    const startIdx = visibleSlots.findIndex((s) => s.id === selectedSlotId)
    const targetIdx = visibleSlots.findIndex((s) => s.id === slot.id)
    if (
      slot.id > selectedSlotId &&
      startIdx !== -1 &&
      targetIdx - startIdx + 1 > maxSelectableSlots
    ) {
      setSelectionLimitMessage(true)
      return
    }

    // Click before anchor or blocked range → start fresh
    startNew(slot)
  }

  const numSelected = (() => {
    if (!selectedSlotId) return 0
    const endTime =
      selectedSlotEndId && selectedSlotEndId !== ""
        ? selectedSlotEndId
        : addMinutesToTime(selectedSlotId, slotDurationMinutes)
    const diffMinutes = (() => {
      const [eh, em] = endTime.split(":").map(Number)
      const [sh, sm] = selectedSlotId.split(":").map(Number)
      return eh * 60 + em - (sh * 60 + sm)
    })()
    return Math.max(1, Math.round(diffMinutes / slotDurationMinutes))
  })()

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">Slot trong ngày</p>
        <div className="flex flex-wrap items-center justify-end gap-1.5 text-[11px] text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>Có thể đặt</span>
          <span className="ml-1 h-2 w-2 rounded-full bg-amber-500" />
          <span title={`Còn tối đa 2 ${availabilityLabel}`}>Sắp hết</span>
          <span className="ml-1 h-2 w-2 rounded-full bg-orange-500" />
          <span>Đang chọn</span>
        </div>
      </div>

      {isToday && minBookingNoticeMinutes > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] text-amber-900">
          <Clock3 className="mt-0.5 size-3.5 shrink-0" />
          <span>
            Cần đặt trước tối thiểu{" "}
            <strong>{minBookingNoticeMinutes} phút</strong>. Các slot quá sát
            giờ bắt đầu sẽ bị khóa.
          </span>
        </div>
      )}

      {noticeMessage && (
        <div className="rounded-md border border-sky-200 bg-sky-50 px-2.5 py-2 text-[11px] text-sky-900">
          {noticeMessage}
        </div>
      )}

      <div className="grid grid-cols-4 gap-1.5">
        {visibleSlots.map((slot) => {
          const { isPast, isTooSoon } = getSlotTiming(slot)

          const isBooked =
            slot.status === "booked" ||
            slot.status === "closed" ||
            isPast ||
            isTooSoon
          const isSelected = isInSelectedRange(slot.id)
          const isAnchor = slot.id === selectedSlotId && isSelected
          const tooSoonMessage = `Không thể đặt slot ${slot.startTime}: cần đặt trước tối thiểu ${minBookingNoticeMinutes} phút.`

          return (
            <span
              key={slot.id}
              className="block"
              title={isTooSoon ? tooSoonMessage : undefined}
            >
              <Button
                type="button"
                disabled={isBooked}
                onClick={() => handleSlotClick(slot)}
                className={cn(
                  "h-10 w-full flex-col gap-0 rounded-md px-1 text-[11px] font-semibold border",
                  isBooked &&
                    "bg-muted text-muted-foreground opacity-70 border-muted",
                  !isSelected &&
                    !isBooked &&
                    slot.status === "available" &&
                    "border-emerald-200 bg-emerald-50/70 text-emerald-900 hover:bg-emerald-100",
                  !isSelected &&
                    !isBooked &&
                    slot.status === "limited" &&
                    "border-amber-200 bg-amber-50/80 text-amber-900 hover:bg-amber-100",
                  isSelected &&
                    !isAnchor &&
                    "bg-orange-300 text-white border-orange-300 hover:bg-orange-200",
                  isAnchor &&
                    "bg-orange-500 text-white border-orange-500 hover:bg-orange-600",
                )}
              >
                <span>{slot.startTime}</span>
                <span className="text-[10px] font-medium opacity-80">
                  {isPast
                    ? "Đã qua"
                    : isTooSoon
                      ? "Quá sát"
                      : slotAvailabilityLabel(slot)}
                </span>
              </Button>
            </span>
          )
        })}
      </div>

      {selectedSlotId && (
        <div className="space-y-1">
          <p className="text-[11px] text-orange-600 font-medium">
            {numSelected > 1
              ? `Đã chọn ${numSelected} slot: ${selectedSlotId} → ${selectedSlotEndId || addMinutesToTime(selectedSlotId, slotDurationMinutes)}`
              : `Đã chọn: ${selectedSlotId}`}
          </p>
          {selectionLimitMessage && (
            <p className="text-[11px] text-amber-700">
              Mỗi đơn hiện chỉ có thể đặt tối đa {maxSelectableSlots} slot liên
              tiếp.
            </p>
          )}
        </div>
      )}

      <Badge
        variant="secondary"
        className="rounded-md px-2 py-1 text-[11px] font-medium"
      >
        {operationalSlots} slot/ngày · {String(openHour % 24).padStart(2, "0")}:00–
        {String(closeHour % 24).padStart(2, "0")}:00
      </Badge>
    </div>
  )
}
