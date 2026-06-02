import { Filter, RotateCcw } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { trackTypeApi, trackTypeQueryKeys } from "@/features/cafes/api/cafe.api"
import { FEATURE_OPTIONS, PRICE_RANGE_OPTIONS, CITY_OPTIONS } from "../constants"
import { Button } from "@/shared/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"

export type ExploreFiltersPanelProps = {
  city: string
  onCityChange: (value: string) => void
  trackType: string
  onTrackTypeChange: (value: string) => void
  priceRange: string
  onPriceRangeChange: (value: string) => void
  feature: string
  onFeatureChange: (value: string) => void
  vehicleType: string
  onVehicleTypeChange: (value: string) => void
  date: string
  onDateChange: (value: string) => void
  activeFilterCount: number
  onClear: () => void
}

const vehicleTypeOptions = [
  { value: "all", label: "Tất cả loại xe" },
  { value: "Drift", label: "Drift" },
  { value: "Offroad", label: "Offroad" },
  { value: "Touring", label: "Touring" },
  { value: "Mini", label: "Mini-Z" },
]

export function ExploreFiltersPanel(props: ExploreFiltersPanelProps) {
  const { data: trackTypes = [] } = useQuery({
    queryKey: trackTypeQueryKeys.all,
    queryFn: () => trackTypeApi.listAll(),
  })

  const trackOptions = useMemo(() => {
    return [
      { value: "all", label: "Tất cả thể loại" },
      ...trackTypes.map((t) => ({ value: t.id, label: t.name })),
    ]
  }, [trackTypes])

  return (
    <aside className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2 text-sm font-black text-slate-950">
          <Filter className="h-4 w-4 text-orange-600" /> Bộ lọc
        </div>
        {props.activeFilterCount > 0 && <span className="rounded-full bg-orange-50 px-2 py-1 text-xs font-black text-orange-700">{props.activeFilterCount}</span>}
      </div>

      <FilterSelect label="Thành phố" value={props.city} onChange={props.onCityChange} options={CITY_OPTIONS} />
      <FilterSelect label="Loại đường đua" value={props.trackType} onChange={props.onTrackTypeChange} options={trackOptions} />
      <FilterSelect label="Khung giá thuê" value={props.priceRange} onChange={props.onPriceRangeChange} options={PRICE_RANGE_OPTIONS} />
      <FilterSelect label="Tiện ích" value={props.feature} onChange={props.onFeatureChange} options={FEATURE_OPTIONS} />
      <FilterSelect label="Loại xe" value={props.vehicleType} onChange={props.onVehicleTypeChange} options={vehicleTypeOptions} />

      <label className="block space-y-2">
        <span className="text-xs font-black uppercase tracking-wide text-slate-500">Ngày chơi</span>
        <input
          type="date"
          value={props.date}
          onChange={(event) => props.onDateChange(event.target.value)}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-orange-500"
        />
      </label>

      {props.activeFilterCount > 0 && (
        <Button type="button" variant="ghost" onClick={props.onClear} className="h-10 w-full rounded-xl font-black text-red-600 hover:bg-red-50 hover:text-red-700">
          <RotateCcw className="h-4 w-4" /> Xóa bộ lọc
        </Button>
      )}
    </aside>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white text-sm font-bold">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  )
}
