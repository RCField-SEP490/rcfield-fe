import { CalendarDays, RotateCcw, SlidersHorizontal } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"

export type ExploreFiltersSidebarProps = {
  city: string
  onCityChange: (v: string) => void
  trackType: string
  onTrackTypeChange: (v: string) => void
  priceRange: string
  onPriceRangeChange: (v: string) => void
  feature: string
  onFeatureChange: (v: string) => void
  vehicleType: string
  onVehicleTypeChange: (v: string) => void
  date: string
  onDateChange: (v: string) => void
  activeFilterCount: number
  onClear: () => void
}

const filterGroups = {
  feature: [
    { value: "all", label: "Tất cả tiện ích" },
    { value: "Serious Inspection", label: "Kiểm xe" },
    { value: "Đồ ăn & Nước uống", label: "F&B" },
    { value: "Hệ thống Đèn đêm", label: "Đèn đêm" },
    { value: "Pit Lane chuyên nghiệp", label: "Pit Lane" },
    { value: "Mát lạnh Điều hòa", label: "Điều hòa" },
  ],
  vehicleType: [
    { value: "all", label: "Tất cả loại xe" },
    { value: "Drift", label: "Drift" },
    { value: "Offroad", label: "Offroad" },
    { value: "Touring", label: "Touring" },
    { value: "Mini", label: "Mini-Z" },
  ],
}

export function ExploreFiltersSidebar(props: ExploreFiltersSidebarProps) {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base"><SlidersHorizontal className="h-4 w-4" /> Bộ lọc</CardTitle>
          {props.activeFilterCount > 0 && (
            <Button type="button" variant="ghost" size="sm" onClick={props.onClear} className="gap-1 text-muted-foreground">
              <RotateCcw className="h-3.5 w-3.5" /> Xóa
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <FilterSelect label="Tiện ích" value={props.feature} onChange={props.onFeatureChange} options={filterGroups.feature} />
        <FilterSelect label="Loại xe" value={props.vehicleType} onChange={props.onVehicleTypeChange} options={filterGroups.vehicleType} />
        <label className="block space-y-2">
          <span className="flex items-center gap-2 text-sm font-medium"><CalendarDays className="h-4 w-4 text-muted-foreground" /> Ngày chạy</span>
          <Input type="date" value={props.date} onChange={(event) => props.onDateChange(event.target.value)} />
        </label>
      </CardContent>
    </Card>
  )
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
      </Select>
    </label>
  )
}
