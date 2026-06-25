import { useMemo } from "react"
import { CheckCircle2, ImageOff, CalendarDays } from "lucide-react"
import { useTrackConfigs } from "@/features/cafes/hooks/useTrackConfigs"
import type { TrackConfig } from "@/features/cafes/types"
import { useDailyAvailability } from "@/features/booking/hooks/use-booking"
import { cn } from "@/shared/lib/utils"
import { Input } from "@/shared/ui/input"
import { buildDailySlots, DailySlotGrid, type DailySlot, type DailySlotStatus } from "@/pages/customer/cafe-detail/components/DailySlotGrid"
import type { HourlySlotAvailability } from "@/features/booking/hooks/use-booking"
import { SlotPriceLabel } from "@/shared/components/SlotPriceLabel"

type PlayMode = "RENTAL" | "BYOC"

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
  playMode: PlayMode
  onPlayModeChange: (mode: PlayMode) => void
  /** Effective price per hour from the pricing preview API (optional) */
  effectivePricePerHour?: number
  /** Dynamic pricing label, e.g. "Cuối tuần" or "Giờ cao điểm" (optional) */
  pricingLabel?: string | null
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
  playMode,
  onPlayModeChange,
  effectivePricePerHour,
  pricingLabel,
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
                // Auto-switch to supported mode when track changes
                if (config.max_concurrent === 0 && playMode === "RENTAL") {
                  onPlayModeChange("BYOC")
                } else if (config.byoc_capacity === 0 && playMode === "BYOC") {
                  onPlayModeChange("RENTAL")
                }
              }}
            />
          ))}
        </div>
      </div>

      {/* Slot picker — shown after track is selected */}
      {selectedTrackConfig && (
        <SlotPicker
          cafeId={cafeId}
          trackConfig={selectedTrackConfig}
          date={date}
          setDate={setDate}
          selectedSlot={selectedSlot}
          setSelectedSlot={setSelectedSlot}
          selectedSlotEnd={selectedSlotEnd}
          setSelectedSlotEnd={setSelectedSlotEnd}
          slotDurationMinutes={slotDurationMinutes}
          openHour={openHour}
          closeHour={closeHour}
          playMode={playMode}
          onPlayModeChange={onPlayModeChange}
        />
      )}

      {/* Dynamic pricing label — shown when a slot is selected */}
      {selectedSlot && effectivePricePerHour !== undefined && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-100 bg-amber-50/60 px-3 py-2">
          <span className="text-xs text-[#5c5a5a]">Giá slot:</span>
          <SlotPriceLabel
            effectivePrice={effectivePricePerHour}
            label={pricingLabel ?? null}
          />
        </div>
      )}
    </div>
  )
}

function SlotPicker({
  cafeId,
  trackConfig,
  date,
  setDate,
  selectedSlot,
  setSelectedSlot,
  selectedSlotEnd,
  setSelectedSlotEnd,
  slotDurationMinutes,
  openHour,
  closeHour,
  playMode,
  onPlayModeChange,
}: {
  cafeId: string
  trackConfig: TrackConfig
  date: string
  setDate: (d: string) => void
  selectedSlot: string
  setSelectedSlot: (s: string) => void
  selectedSlotEnd: string | null
  setSelectedSlotEnd: (s: string | null) => void
  slotDurationMinutes: number
  openHour: number
  closeHour: number
  playMode: PlayMode
  onPlayModeChange: (mode: PlayMode) => void
}) {
  const { data: dailyAvailability, isLoading } = useDailyAvailability(
    cafeId,
    date,
    openHour,
    closeHour,
    trackConfig.id,
  )

  const slots = useMemo<DailySlot[]>(() => {
    if (!dailyAvailability) return buildDailySlots(openHour, closeHour)
    return buildSlotsFromAvailability(dailyAvailability, playMode)
  }, [dailyAvailability, openHour, closeHour, playMode])

  const hasRental = trackConfig.max_concurrent > 0
  const hasByoc = trackConfig.byoc_capacity > 0

  return (
    <div className="rounded-xl border border-orange-100 bg-orange-50/30 p-4 space-y-4">
      <h3 className="text-sm font-bold text-[#1c1b1b]">Chọn ngày & giờ</h3>

      {/* Play mode toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!hasRental}
          onClick={() => {
            onPlayModeChange("RENTAL")
            setSelectedSlot("")
            setSelectedSlotEnd(null)
          }}
          className={cn(
            "flex-1 rounded-lg py-2 text-xs font-bold transition-colors border",
            !hasRental && "opacity-40 cursor-not-allowed",
            hasRental && playMode === "RENTAL"
              ? "bg-orange-500 text-white border-orange-500"
              : hasRental
              ? "bg-white text-[#747878] border-[#e5e2e1] hover:border-orange-300 hover:text-orange-600"
              : "bg-white text-[#747878] border-[#e5e2e1]",
          )}
        >
          Thuê xe
          {!hasRental && <span className="ml-1 text-[10px] font-normal">Không hỗ trợ</span>}
        </button>
        <button
          type="button"
          disabled={!hasByoc}
          onClick={() => {
            onPlayModeChange("BYOC")
            setSelectedSlot("")
            setSelectedSlotEnd(null)
          }}
          className={cn(
            "flex-1 rounded-lg py-2 text-xs font-bold transition-colors border",
            !hasByoc && "opacity-40 cursor-not-allowed",
            hasByoc && playMode === "BYOC"
              ? "bg-orange-500 text-white border-orange-500"
              : hasByoc
              ? "bg-white text-[#747878] border-[#e5e2e1] hover:border-orange-300 hover:text-orange-600"
              : "bg-white text-[#747878] border-[#e5e2e1]",
          )}
        >
          Sử dụng xe cá nhân
          {!hasByoc && <span className="ml-1 text-[10px] font-normal">Không hỗ trợ</span>}
        </button>
      </div>

      <label className="flex items-center gap-2">
        <CalendarDays className="size-4 text-muted-foreground" />
        <span className="text-xs font-semibold text-[#1c1b1b]">Ngày chạy</span>
        <Input
          type="date"
          value={date}
          min={new Date().toISOString().slice(0, 10)}
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
          selectedSlotEndId={selectedSlotEnd ?? undefined}
          onSelectSlot={setSelectedSlot}
          slotDurationMinutes={slotDurationMinutes}
          openHour={openHour}
          closeHour={closeHour}
          date={date}
          onSelectRange={(start, end) => {
            setSelectedSlot(start)
            setSelectedSlotEnd(end || null)
          }}
        />
      </div>
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
          {config.max_concurrent > 0
            ? <span>{config.max_concurrent} chỗ thuê xe</span>
            : <span className="text-[#c4c7c8]">Không có xe thuê</span>}
          {config.byoc_capacity > 0
            ? <span>{config.byoc_capacity} mang xe riêng</span>
            : <span className="text-[#c4c7c8]">Không nhận xe riêng</span>}
        </div>
        {config.description && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{config.description}</p>
        )}
      </div>
    </button>
  )
}

function buildSlotsFromAvailability(hourlyData: HourlySlotAvailability[], playMode: PlayMode): DailySlot[] {
  return hourlyData.map(({ hour, data }) => {
    const startTime = `${String(hour).padStart(2, "0")}:00`
    const endTime = `${String(hour + 1).padStart(2, "0")}:00`
    if (!data) return { id: startTime, startTime, endTime, status: "booked" as DailySlotStatus, remaining: 0, rentalCount: 0, byocRemaining: 0 }

    const rentalCount = data.vehicles?.length ?? 0
    const byocRemaining = data.byoc_remaining ?? 0

    let remaining: number
    let available: boolean
    if (playMode === "RENTAL") {
      remaining = rentalCount
      available = rentalCount > 0
    } else {
      remaining = byocRemaining
      available = byocRemaining > 0
    }

    let status: DailySlotStatus
    if (!available) status = "booked"
    else if (remaining <= 2) status = "limited"
    else status = "available"

    return {
      id: startTime,
      startTime,
      endTime,
      status,
      remaining,
      rentalCount: playMode === "BYOC" ? 0 : rentalCount,
      byocRemaining: playMode === "RENTAL" ? 0 : byocRemaining,
    }
  })
}
