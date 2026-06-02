import { Calendar, X } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { trackTypeApi, trackTypeQueryKeys } from "@/features/cafes/api/cafe.api"
import { Button } from "@/shared/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover"
import { Calendar as CalendarUI } from "@/shared/ui/calendar"
import {
  CITY_OPTIONS,
  PRICE_RANGE_OPTIONS,
  FEATURE_OPTIONS
} from "../constants"

interface FiltersSidebarProps {
  selectedCity: string
  setSelectedCity: (v: string) => void
  selectedTrackType: string
  setSelectedTrackType: (v: string) => void
  selectedPriceRange: string
  setSelectedPriceRange: (v: string) => void
  selectedFeature: string
  setSelectedFeature: (v: string) => void
  bookingDate: Date | undefined
  setBookingDate: (d: Date | undefined) => void
  handleClearFilters: () => void
  activeFilterCount: number
}

export function FiltersSidebar({
  selectedCity,
  setSelectedCity,
  selectedTrackType,
  setSelectedTrackType,
  selectedPriceRange,
  setSelectedPriceRange,
  selectedFeature,
  setSelectedFeature,
  bookingDate,
  setBookingDate,
  handleClearFilters,
  activeFilterCount
}: FiltersSidebarProps) {
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
    <div className="space-y-6">
      {/* Thành Phố */}
      <div>
        <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">Thành Phố</h4>
        <Select value={selectedCity} onValueChange={setSelectedCity}>
          <SelectTrigger className="w-full bg-white border-slate-200 rounded-xl h-11 text-xs font-semibold text-slate-700">
            <SelectValue placeholder="Tất cả thành phố" />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200">
            {CITY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs font-semibold">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loại Đường Đua */}
      <div>
        <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">Loại Đường Đua</h4>
        <Select value={selectedTrackType} onValueChange={setSelectedTrackType}>
          <SelectTrigger className="w-full bg-white border-slate-200 rounded-xl h-11 text-xs font-semibold text-slate-700">
            <SelectValue placeholder="Tất cả thể loại" />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200">
            {trackOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs font-semibold">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Khung Giá Thuê Xe */}
      <div>
        <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">Khung Giá Thuê Xe</h4>
        <Select value={selectedPriceRange} onValueChange={setSelectedPriceRange}>
          <SelectTrigger className="w-full bg-white border-slate-200 rounded-xl h-11 text-xs font-semibold text-slate-700">
            <SelectValue placeholder="Mọi mức giá" />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200">
            {PRICE_RANGE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs font-semibold">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lịch Đua Xe */}
      <div>
        <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">Lịch Đua Xe</h4>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-semibold text-xs h-11 rounded-xl bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <Calendar className="mr-2 h-4 w-4 text-slate-400" />
              {bookingDate ? bookingDate.toLocaleDateString("vi-VN") : <span>Chọn ngày giữ chỗ</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-white border-slate-200 rounded-xl" align="start">
            <CalendarUI
              mode="single"
              selected={bookingDate}
              onSelect={(date) => setBookingDate(date)}
              className="p-3"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Tiện ích Đặc Biệt */}
      <div>
        <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">Tiện ích Đặc Biệt</h4>
        <Select value={selectedFeature} onValueChange={setSelectedFeature}>
          <SelectTrigger className="w-full bg-white border-slate-200 rounded-xl h-11 text-xs font-semibold text-slate-700">
            <SelectValue placeholder="Tất cả tiện ích" />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200">
            {FEATURE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs font-semibold">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          onClick={handleClearFilters}
          className="w-full text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 h-10 rounded-xl flex items-center justify-center gap-1.5"
        >
          <X className="h-3.5 w-3.5" />
          Xóa tất cả bộ lọc ({activeFilterCount})
        </Button>
      )}
    </div>
  )
}
