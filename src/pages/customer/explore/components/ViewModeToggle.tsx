import { Grid2X2, List } from "lucide-react"
import type { CafeViewMode } from "../explore-utils"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/lib/utils"

export function ViewModeToggle({ value, onChange }: { value: CafeViewMode; onChange: (value: CafeViewMode) => void }) {
  return (
    <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
      <Button type="button" size="icon" variant="ghost" aria-label="Dạng lưới" onClick={() => onChange("grid")} className={cn("rounded-lg", value === "grid" && "bg-slate-950 text-white hover:bg-slate-950 hover:text-white")}>
        <Grid2X2 className="h-4 w-4" />
      </Button>
      <Button type="button" size="icon" variant="ghost" aria-label="Dạng danh sách" onClick={() => onChange("list")} className={cn("rounded-lg", value === "list" && "bg-slate-950 text-white hover:bg-slate-950 hover:text-white")}>
        <List className="h-4 w-4" />
      </Button>
    </div>
  )
}
