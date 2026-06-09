import { useState, useMemo } from "react"
import { CheckCircle2, ImageOff, CalendarDays } from "lucide-react"
import { useTrackConfigs } from "@/features/cafes/hooks/useTrackConfigs"
import type { TrackConfig } from "@/features/cafes/types"
import { useDailyAvailability } from "@/features/booking/hooks/use-booking"
import { cn } from "@/shared/lib/utils"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { buildDailySlots, DailySlotGrid, type DailySlot, type DailySlotStatus } from "@/pages/customer/cafe-detail/components/DailySlotGrid"
import type { HourlySlotAvailability } from "@/features/booking/hooks/use-booking"

interface TrackSelectionStepProps {
  cafeId: string
  date: string
  setDate: (d: string) => void
  selectedSlot: string
  setSelectedSlot: (s: string) => void
  selectedSlotEnd: string | null
  setSelectedSlotEnd: (s: string | null) => void
  selectedTrackConfig: TrackConfig | null
  onSelectTrack: (config: TrackConfig) => void
  slotDurationMinutes: number
  openHour?: number
  closeHour?: number
}

export function TrackSelectionStep({
  cafeId,
  date,
  setDate,
  selectedSlot,
  setSelectedSlot,
  selectedSlotEnd,
  setSelectedSlotEnd,
  selectedTrackConfig,
  onSelectTrack,
  slotDurationMinutes,
  openHour = 8,
  closeHour = 22,
}: TrackSelectionStepProps) {
  const { data: configs = [], isLoading } = useTrackConfigs(cafeId)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    )
  }

  if (configs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center">
        <ImageOff className="mx-auto mb-2 size-8 text-muted-foreground" />
        <p className="text-sm font-medium text-muted-foreground">Cơ sở chưa cấu hình loại sân</p>
        <p className="mt-1 text-xs text-muted-foreground">Vui lòng liên hệ cơ sở để biết thêm thông tin.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Track grid */}
      <div>
        <h2 className="mb-1 text-lg font-bold tracking-tight">Chọn loại sân</h2>
        <p className="mb-4 text-sm text-muted-foreground">Bấm vào sân bạn muốn chơi</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {configs.map((config) => (
            <TrackCard
              key={config.id}
              config={config}
              isSelected={selectedTrackConfig?.id === config.id}
              onSelect={() => {
                onSelectTrack(config)
                setSelectedSlot("")
                setSelectedSlotEnd(null)
              }}
            />
          ))}
        </div>
      </div>

      {/* Slot picker — shown after track is selected */}
      {selectedTrackConfig && (
        <SlotPicker
          cafeId={cafeId}
          trackConfigId={selectedTrackConfig.id}
          date={date}
          setDate={setDate}
          selectedSlot={selectedSlot}
          setSelectedSlot={setSelectedSlot}
          selectedSlotEnd={selectedSlotEnd}
          setSelectedSlotEnd={setSelectedSlotEnd}
          slotDurationMinutes={slotDurationMinutes}
          openHour={openHour}
          closeHour={closeHour}
        />
      )}
    </div>
  )
}

function SlotPicker({
  cafeId,
  trackConfigId,
  date,
  setDate,
  selectedSlot,
  setSelectedSlot,
  selectedSlotEnd,
  setSelectedSlotEnd,
  slotDurationMinutes,
  openHour,
  closeHour,
}: {
  cafeId: string
  trackConfigId: string
  date: string
  setDate: (d: string) => void
  selectedSlot: string
  setSelectedSlot: (s: string) => void
  selectedSlotEnd: string | null
  setSelectedSlotEnd: (s: string | null) => void
  slotDurationMinutes: number
  openHour: number
  closeHour: number
}) {
  const { data: dailyAvailability, isLoading } = useDailyAvailability(
    cafeId,
    date,
    openHour,
    closeHour,
    trackConfigId,
  )

  const slots = useMemo<DailySlot[]>(() => {
    if (!dailyAvailability) return buildDailySlots(openHour, closeHour)
    return buildSlotsFromAvailability(dailyAvailability)
  }, [dailyAvailability, openHour, closeHour])

  return (
    <div className="rounded-xl border border-orange-100 bg-orange-50/30 p-4">
      <h3 className="mb-3 text-sm font-bold text-[#1c1b1b]">Chọn ngày & giờ</h3>

      <label className="mb-3 flex items-center gap-2">
        <CalendarDays className="size-4 text-muted-foreground" />
        <span className="text-xs font-semibold text-[#1c1b1b]">Ngày chạy</span>
        <Input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value)
            setSelectedSlot("")
            setSelectedSlotEnd(null)
          }}
          className="h-8 w-auto text-xs"
        />
      </label>

      <div className={cn("transition-opacity", isLoading && "pointer-events-none opacity-40")}>
        {isLoading && <p className="mb-2 text-[10px] text-muted-foreground animate-pulse">Đang kiểm tra slot...</p>}
        <DailySlotGrid
          slots={slots}
          selectedSlotId={selectedSlot}
          onSelectSlot={setSelectedSlot}
          slotDurationMinutes={slotDurationMinutes}
          openHour={openHour}
          closeHour={closeHour}
          onSelectRange={(start, end) => {
            setSelectedSlot(start)
            setSelectedSlotEnd(end)
          }}
        />
      </div>

      {selectedSlot && (
        <p className="mt-2 text-xs text-orange-600 font-medium">
          Đã chọn: {selectedSlot}{selectedSlotEnd ? ` → ${selectedSlotEnd}` : ""}
        </p>
      )}
    </div>
  )
}

function TrackCard({
  config,
  isSelected,
  onSelect,
}: {
  config: TrackConfig
  isSelected: boolean
  onSelect: () => void
}) {
  const coverImage = config.images[0] ?? null

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative overflow-hidden rounded-xl border-2 text-left transition-all",
        isSelected
          ? "border-orange-500 shadow-[0_0_0_3px_rgba(249,115,22,0.15)]"
          : "border-border hover:border-orange-300 hover:shadow-sm",
      )}
    >
      {/* Cover image fixed 16:9 */}
      <div className="relative w-full overflow-hidden bg-muted" style={{ aspectRatio: "16/9" }}>
        {coverImage ? (
          <img src={coverImage} alt={config.track_type?.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageOff className="size-8 text-muted-foreground/40" />
          </div>
        )}
        {isSelected && (
          <div className="absolute right-2 top-2 rounded-full bg-orange-500 p-0.5">
            <CheckCircle2 className="size-4 text-white" />
          </div>
        )}
      </div>

      <div className="p-3">
        <p className="font-bold text-[#1c1b1b]">{config.track_type?.name ?? "Loại sân"}</p>
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span>{config.max_concurrent} slot RENTAL</span>
          {config.byoc_capacity > 0 && <span>{config.byoc_capacity} BYOC</span>}
        </div>
        {config.description && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{config.description}</p>
        )}
      </div>
    </button>
  )
}

function buildSlotsFromAvailability(hourlyData: HourlySlotAvailability[]): DailySlot[] {
  return hourlyData.map(({ hour, data }) => {
    const startTime = `${String(hour).padStart(2, "0")}:00`
    const endTime = `${String(hour + 1).padStart(2, "0")}:00`
    if (!data) return { id: startTime, startTime, endTime, status: "booked" as DailySlotStatus, remaining: 0, rentalCount: 0, byocRemaining: 0 }
    const rentalCount = data.vehicles?.length ?? 0
    const byocRemaining = data.byoc_remaining ?? 0
    const remaining = rentalCount > 0 ? rentalCount : byocRemaining
    let status: DailySlotStatus
    if (!data.available) status = "booked"
    else if (remaining <= 2) status = "limited"
    else status = "available"
    return { id: startTime, startTime, endTime, status, remaining, rentalCount, byocRemaining }
  })
}
