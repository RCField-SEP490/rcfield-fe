import { CalendarDays, RotateCcw, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import type { ExploreFiltersSidebarProps } from "./ExploreFiltersSidebar"

export type ExploreSearchHeaderProps = ExploreFiltersSidebarProps & {
  query: string
  onQueryChange: (value: string) => void
  resultCount: number
  onShowMap: () => void
}

const CITY_OPTIONS = [
  { value: "all", label: "Thành phố" },
  { value: "Hồ Chí Minh", label: "Hồ Chí Minh" },
  { value: "Hà Nội", label: "Hà Nội" },
  { value: "Đà Nẵng", label: "Đà Nẵng" },
  { value: "Hải Phòng", label: "Hải Phòng" },
]
const TRACK_OPTIONS = [
  { value: "all", label: "Loại sân" },
  { value: "DRIFT", label: "Drift" },
  { value: "OBSTACLE", label: "Obstacle" },
  { value: "HILL_CLIMB", label: "Hill climb" },
]
const PRICE_OPTIONS = [
  { value: "all", label: "Mức giá" },
  { value: "under100", label: "Dưới 100k" },
  { value: "100to200", label: "100k – 200k" },
  { value: "over200", label: "Trên 200k" },
]
const FEATURE_OPTIONS = [
  { value: "all", label: "Tiện ích" },
  { value: "Serious Inspection", label: "Kiểm xe" },
  { value: "Đồ ăn & Nước uống", label: "F&B" },
  { value: "Hệ thống Đèn đêm", label: "Đèn đêm" },
  { value: "Pit Lane chuyên nghiệp", label: "Pit Lane" },
  { value: "Mát lạnh Điều hòa", label: "Điều hòa" },
]
const VEHICLE_OPTIONS = [
  { value: "all", label: "Loại xe" },
  { value: "Drift", label: "Drift" },
  { value: "Offroad", label: "Offroad" },
  { value: "Touring", label: "Touring" },
  { value: "Mini", label: "Mini-Z" },
]

export function ExploreSearchHeader({
  query,
  onQueryChange,
  resultCount,
  onShowMap,
  ...filters
}: ExploreSearchHeaderProps) {
  return (
    <section className="shrink-0 border-b bg-white shadow-sm">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-3 md:px-6">
        {/* Title + count */}
        {/* <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Khám phá cơ sở RC</p>
            <h1 className="text-lg font-semibold tracking-tight md:text-xl">
              Tìm sân chơi phù hợp cho lịch chạy của bạn
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant="secondary" className="rounded-md px-3 py-1 text-sm">
              {resultCount} cơ sở
            </Badge>
            <Button type="button" variant="outline" size="sm" onClick={onShowMap} className="gap-1.5 lg:hidden">
              <Map className="h-4 w-4" /> Bản đồ
            </Button>
          </div>
        </div> */}

        {/* Search */}
        {/* <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Tìm tên cơ sở, quận, thành phố..."
            className="h-10 pl-9 pr-9"
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onQueryChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div> */}

        {/* Horizontal filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <FilterChip
            value={filters.city}
            onChange={filters.onCityChange}
            options={CITY_OPTIONS}
            placeholder="Thành phố"
          />
          <FilterChip
            value={filters.trackType}
            onChange={filters.onTrackTypeChange}
            options={TRACK_OPTIONS}
            placeholder="Loại sân"
          />
          <FilterChip
            value={filters.priceRange}
            onChange={filters.onPriceRangeChange}
            options={PRICE_OPTIONS}
            placeholder="Mức giá"
          />
          <FilterChip
            value={filters.feature}
            onChange={filters.onFeatureChange}
            options={FEATURE_OPTIONS}
            placeholder="Tiện ích"
          />
          <FilterChip
            value={filters.vehicleType}
            onChange={filters.onVehicleTypeChange}
            options={VEHICLE_OPTIONS}
            placeholder="Loại xe"
          />

          {/* Date chip */}
          <div
            className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors ${
              filters.date
                ? "border-foreground bg-foreground text-background"
                : "bg-background text-foreground"
            }`}
          >
            <CalendarDays className="h-3.5 w-3.5 shrink-0 opacity-60" />
            <input
              type="date"
              value={filters.date}
              onChange={(e) => filters.onDateChange(e.target.value)}
              className={`w-[118px] cursor-pointer bg-transparent text-sm outline-none ${
                filters.date ? "text-background" : ""
              }`}
            />
            {filters.date && (
              <button
                type="button"
                onClick={() => filters.onDateChange("")}
                className="ml-0.5 opacity-70 hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Clear all */}
          {filters.activeFilterCount > 0 && (
            <button
              type="button"
              onClick={filters.onClear}
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-dashed px-3 text-sm text-muted-foreground hover:border-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" />
              Xóa lọc ({filters.activeFilterCount})
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

function FilterChip({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder: string
}) {
  const isActive = value !== "all" && value !== ""
  return (
    <Select value={value || "all"} onValueChange={onChange}>
      <SelectTrigger
        className={`h-9 shrink-0 rounded-full border px-3 text-sm transition-colors focus:ring-0 ${
          isActive
            ? "border-foreground bg-foreground text-background [&>svg]:text-background"
            : "bg-background"
        }`}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
