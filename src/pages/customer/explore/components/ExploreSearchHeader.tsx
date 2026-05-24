import { Filter, MapPinned, Search, X } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/shared/ui/sheet"
import { Badge } from "@/shared/ui/badge"
import { ExploreFiltersSidebar, type ExploreFiltersSidebarProps } from "./ExploreFiltersSidebar"

const cityOptions = [
  { value: "all", label: "Tất cả thành phố" },
  { value: "Hồ Chí Minh", label: "Hồ Chí Minh" },
  { value: "Hà Nội", label: "Hà Nội" },
  { value: "Đà Nẵng", label: "Đà Nẵng" },
  { value: "Hải Phòng", label: "Hải Phòng" },
]

const trackOptions = [
  { value: "all", label: "Mọi loại sân" },
  { value: "Drift", label: "Drift" },
  { value: "Offroad", label: "Offroad" },
  { value: "Touring", label: "Touring" },
  { value: "Mini-Z", label: "Mini-Z" },
]

const priceOptions = [
  { value: "all", label: "Mọi mức giá" },
  { value: "under100", label: "Dưới 100k/h" },
  { value: "100to200", label: "100k - 200k/h" },
  { value: "over200", label: "Trên 200k/h" },
]

export type ExploreSearchHeaderProps = ExploreFiltersSidebarProps & {
  query: string
  onQueryChange: (value: string) => void
  resultCount: number
  onShowMap: () => void
}

export function ExploreSearchHeader({ query, onQueryChange, resultCount, onShowMap, ...filters }: ExploreSearchHeaderProps) {
  return (
    <section className="border-b bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-5 md:px-6">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Khám phá cơ sở RC</p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">Tìm sân chơi phù hợp cho lịch chạy của bạn</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="rounded-md px-3 py-1 text-sm">{resultCount} cơ sở</Badge>
            <Button type="button" variant="outline" onClick={onShowMap} className="gap-2 xl:hidden">
              <MapPinned className="h-4 w-4" /> Xem bản đồ
            </Button>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-3 shadow-sm">
          <div className="grid gap-2 lg:grid-cols-[minmax(260px,1fr)_180px_170px_160px_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder="Tìm tên cơ sở, quận, thành phố..."
                className="h-11 pl-9"
              />
              {query && (
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => onQueryChange("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <Select value={filters.city} onValueChange={filters.onCityChange}>
              <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent>{cityOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
            </Select>

            <Select value={filters.trackType} onValueChange={filters.onTrackTypeChange}>
              <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent>{trackOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
            </Select>

            <Select value={filters.priceRange} onValueChange={filters.onPriceRangeChange}>
              <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent>{priceOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
            </Select>

            <div className="flex gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button type="button" variant="outline" className="h-11 gap-2 lg:hidden">
                    <Filter className="h-4 w-4" /> Bộ lọc
                    {filters.activeFilterCount > 0 && <Badge className="ml-1 h-5 px-1.5">{filters.activeFilterCount}</Badge>}
                  </Button>
                </SheetTrigger>
                <SheetContent className="overflow-y-auto bg-background p-4">
                  <SheetHeader className="mb-4"><SheetTitle>Bộ lọc</SheetTitle></SheetHeader>
                  <ExploreFiltersSidebar {...filters} />
                </SheetContent>
              </Sheet>
              <Button type="button" variant="ghost" onClick={filters.onClear} className="h-11 hidden lg:inline-flex">Xóa lọc</Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
