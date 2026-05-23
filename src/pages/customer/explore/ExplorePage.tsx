import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { getCafes } from "@/features/explore/api/explore.api"
import type { Cafe } from "@/shared/data/explore-data"
import { ExploreFiltersSidebar } from "./components/ExploreFiltersSidebar"
import { ExploreMapPanel } from "./components/ExploreMapPanel"
import { CafeListItem } from "./components/CafeListItem"
import { CafeQuickViewDialog } from "./components/CafeQuickViewDialog"
import { buildBookingUrl, filterCafes } from "./explore-utils"
import { useExploreFilters } from "./useExploreFilters"

export function ExplorePage() {
  const navigate = useNavigate()
  const filters = useExploreFilters()
  const [cafes, setCafes] = useState<Cafe[]>([])
  const [quickViewCafe, setQuickViewCafe] = useState<Cafe | null>(null)

  useEffect(() => {
    let mounted = true
    getCafes(filters.params).then((items) => {
      if (mounted) setCafes(items)
    })
    return () => { mounted = false }
  }, [filters.params])

  const filteredCafes = useMemo(() => filterCafes(cafes, filters.params), [cafes, filters.params])

  const handleBookNow = (cafeId: string, vehicleId?: string) => {
    navigate(buildBookingUrl(cafeId, vehicleId))
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem-1px)] flex-col bg-white">
      {/* Top search bar - compact */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-[1440px] items-center gap-2.5 px-4 py-2.5 md:px-6">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              value={filters.query}
              onChange={(e) => filters.setQuery(e.target.value)}
              placeholder="Tìm cơ sở, địa điểm..."
              className="h-9 w-full border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-slate-400 focus:bg-white"
            />
          </div>
          <select
            value={filters.city}
            onChange={(e) => filters.setCity(e.target.value)}
            className="h-9 border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-slate-400 focus:bg-white"
          >
            <option value="all">Tất cả TP</option>
            <option value="Hồ Chí Minh">Hồ Chí Minh</option>
            <option value="Hà Nội">Hà Nội</option>
            <option value="Đà Nẵng">Đà Nẵng</option>
            <option value="Hải Phòng">Hải Phòng</option>
          </select>
          <select
            value={filters.trackType}
            onChange={(e) => filters.setTrackType(e.target.value)}
            className="h-9 border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-slate-400 focus:bg-white"
          >
            <option value="all">Loại đua</option>
            <option value="Drift">Drift</option>
            <option value="Offroad">Offroad</option>
            <option value="Touring">Touring</option>
            <option value="Mini-Z">Mini-Z</option>
          </select>
          <select
            value={filters.priceRange}
            onChange={(e) => filters.setPriceRange(e.target.value)}
            className="h-9 border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-slate-400 focus:bg-white"
          >
            <option value="all">Giá</option>
            <option value="under100">Dưới 100k</option>
            <option value="100to200">100k-200k</option>
            <option value="over200">Trên 200k</option>
          </select>
          <select
            value={filters.feature}
            onChange={(e) => filters.setFeature(e.target.value)}
            className="hidden h-9 border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-slate-400 focus:bg-white sm:block"
          >
            <option value="all">Tiện ích</option>
            <option value="Serious Inspection">Kiểm xe</option>
            <option value="Đồ ăn & Nước uống">F&B</option>
            <option value="Hệ thống Đèn đêm">Đèn đêm</option>
          </select>
          <button onClick={filters.clearFilters} className="h-9 px-3 text-sm font-semibold text-slate-500 hover:text-slate-900">Xoá</button>
          <span className="text-xs text-slate-400">{filteredCafes.length} cơ sở</span>
        </div>
      </div>

      {/* Main: 3-column layout full height */}
      <div className="flex flex-1">
        {/* Left sidebar */}
        <aside className="hidden w-56 shrink-0 border-r border-slate-200 bg-white p-4 lg:block">
          <ExploreFiltersSidebar {...filters} />
        </aside>

        {/* Center - cafe list */}
        <div className="min-w-0 flex-1 overflow-y-auto">
          <div className="px-4 py-3 md:px-6">
            {filteredCafes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <svg className="h-12 w-12 text-slate-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <h3 className="mt-4 text-base font-semibold text-slate-700">Không tìm thấy kết quả</h3>
                <p className="mt-1 text-sm text-slate-500">Thử thay đổi bộ lọc hoặc từ khoá.</p>
                <button onClick={filters.clearFilters} className="mt-4 border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Xoá bộ lọc</button>
              </div>
            ) : (
              <div className="space-y-0">
                {filteredCafes.map((cafe) => (
                  <CafeListItem
                    key={cafe.id}
                    cafe={cafe}
                    onQuickView={setQuickViewCafe}
                    onBookNow={handleBookNow}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right - map panel */}
        <aside className="hidden w-[340px] shrink-0 border-l border-slate-200 xl:block">
          <div className="sticky top-0 h-full">
            <ExploreMapPanel
              cafes={filteredCafes}
              active={true}
              onClose={() => {}}
              onSelectCafe={setQuickViewCafe}
              compact
            />
          </div>
        </aside>
      </div>

      <CafeQuickViewDialog cafe={quickViewCafe} onClose={() => setQuickViewCafe(null)} onBookNow={handleBookNow} />
    </div>
  )
}
