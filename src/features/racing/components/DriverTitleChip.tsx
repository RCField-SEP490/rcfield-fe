import { cn } from "@/shared/lib/utils"

export function DriverTitleChip({
  label,
  className,
}: {
  label?: string | null
  className?: string
}) {
  if (!label) return null

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-[11px] font-bold text-orange-700",
        className,
      )}
    >
      {label}
    </span>
  )
}
