import { Search, X } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"

export function ExploreSearchBar({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="relative flex-1">
      <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Tìm theo tên cơ sở, quận, thành phố hoặc loại xe..."
        className="h-12 rounded-xl border-slate-200 bg-white pl-11 pr-11 text-sm font-semibold shadow-sm"
      />
      {value && (
        <Button type="button" size="icon-sm" variant="ghost" onClick={() => onChange("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg" aria-label="Xóa tìm kiếm">
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
