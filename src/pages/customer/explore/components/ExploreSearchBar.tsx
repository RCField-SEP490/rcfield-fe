import { CalendarDays, MapPin, Search } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { CITY_OPTIONS } from "../constants"

interface ExploreSearchBarProps {
  city: string
  onCityChange: (value: string) => void
  date: string
  onDateChange: (value: string) => void
  query: string
  onQueryChange: (value: string) => void
}

export function ExploreSearchBar({
  city,
  onCityChange,
  date,
  onDateChange,
  query,
  onQueryChange,
}: ExploreSearchBarProps) {
  return (
    <section className="shrink-0 border-b bg-white shadow-sm">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:px-6">
        {/* Location */}
        <div className="relative flex flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 transition-colors focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-100">
          <MapPin className="h-4 w-4 shrink-0 text-blue-500" />
          <select
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            className="w-full cursor-pointer appearance-none bg-transparent text-sm font-medium text-slate-700 outline-none"
          >
            {CITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div className="relative flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 transition-colors focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-100 md:w-[200px]">
          <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            placeholder="Chọn ngày"
            className="w-full cursor-pointer bg-transparent text-sm font-medium text-slate-700 outline-none"
          />
        </div>

        {/* Search text (mobile only — on desktop it's part of sidebar) */}
        <div className="relative flex flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 transition-colors focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-100 md:hidden">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Tìm tên cơ sở, quận, thành phố..."
            className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>

        {/* Search CTA */}
        <Button className="h-11 gap-2 rounded-lg bg-blue-500 px-6 text-sm font-bold text-white shadow-sm hover:bg-blue-600">
          Tìm RC Cafe
          <Search className="h-4 w-4" />
        </Button>
      </div>
    </section>
  )
}
