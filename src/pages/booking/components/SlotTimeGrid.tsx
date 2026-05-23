import { cn } from "@/shared/lib/utils"

interface SlotTimeGridProps {
  timeOptions: string[]
  selectedTimes: string[]
  onToggle: (time: string) => void
  mode: "single" | "multiple"
}

/** Hiển thị lưới giờ trống để người dùng chọn slot - giống hotel booking chọn phòng */
export function SlotTimeGrid({ timeOptions, selectedTimes, onToggle, mode }: SlotTimeGridProps) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4">
      {timeOptions.map((time) => {
        const isSelected = selectedTimes.includes(time)
        return (
          <button
            key={time}
            type="button"
            onClick={() => onToggle(time)}
            className={cn(
              "border px-3 py-2.5 text-center text-sm font-semibold transition",
              isSelected
                ? "border-black bg-black text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-400",
            )}
          >
            {time}
            {isSelected && mode === "multiple" && (
              <span className="ml-1 text-[10px] text-white/70">✓</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
