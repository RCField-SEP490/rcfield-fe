import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link, useParams } from "react-router"
import { routePaths } from "@/app/router/route-paths"
import { cafeApi, cafeQueryKeys } from "@/features/cafes/api/cafe.api"
import { mapCafeToExploreCafe, mapCatalogToExploreVehicle } from "@/features/cafes/lib/cafe.mappers"
import { vehicleApi } from "@/features/vehicles/api/vehicle.api"
import { menuApi, menuQueryKeys } from "@/features/menu/api/menu.api"
import { ChatWidget } from "@/features/chat/components/ChatWidget"
import { Button } from "@/shared/ui/button"
import { CafeBookingCard } from "./components/CafeBookingCard"
import { CafeDetailContent } from "./components/CafeDetailContent"
import { CafeDetailHero } from "./components/CafeDetailHero"
import { CafeFnbSection } from "./components/CafeFnbSection"
import { CafeVehiclesSection } from "./components/CafeVehiclesSection"
import type { BookingMode } from "@/features/booking/data/booking-options"

export function CafeDetailPage() {
  const { cafeSlug } = useParams()
  const {
    data: cafeList,
    isLoading: listLoading,
    isError: listError,
    refetch: refetchList,
  } = useQuery({
    queryKey: cafeQueryKeys.list({ page: 1, limit: 100 }),
    queryFn: () => cafeApi.listCafes({ page: 1, limit: 100 }),
  })

  const resolvedCafe = cafeList?.data.find((item) => item.slug === cafeSlug)
  const {
    data: cafeDetail,
    isLoading: detailLoading,
    isError: detailError,
    refetch: refetchDetail,
  } = useQuery({
    queryKey: cafeQueryKeys.detail(resolvedCafe?.id),
    queryFn: () => cafeApi.getCafe(resolvedCafe!.id),
    enabled: !!resolvedCafe?.id,
  })
  const { data: cafeImages = [] } = useQuery({
    queryKey: cafeQueryKeys.images(resolvedCafe?.id),
    queryFn: () => cafeApi.listCafeImages(resolvedCafe!.id),
    enabled: !!resolvedCafe?.id,
  })
  const {
    data: cafeMenu,
    isLoading: menuLoading,
    isError: menuError,
  } = useQuery({
    queryKey: menuQueryKeys.list(resolvedCafe?.id, { page: 1, limit: 100, available: true }),
    queryFn: () => menuApi.listMenuItems(resolvedCafe!.id, { page: 1, limit: 100, available: true }),
    enabled: !!resolvedCafe?.id,
  })
  const { data: catalogs = [] } = useQuery({
    queryKey: ["cafe-catalogs", resolvedCafe?.id],
    queryFn: () => vehicleApi.listCatalogs(resolvedCafe!.id),
    enabled: !!resolvedCafe?.id,
  })

  const sourceCafe = cafeDetail ?? resolvedCafe
  const cafe = useMemo(() => {
    if (!sourceCafe) return undefined
    const mapped = mapCafeToExploreCafe(sourceCafe, cafeImages)
    if (catalogs && catalogs.length > 0) {
      mapped.availableVehicles = catalogs.map(mapCatalogToExploreVehicle)
    }
    return mapped
  }, [sourceCafe, cafeImages, catalogs])

  // Hoisted Booking Selections
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | undefined>(undefined)
  const [fnbQuantities, setFnbQuantities] = useState<Record<string, number>>({})
  const [bookingMode, setBookingMode] = useState<BookingMode>("hourly")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const [selectedSlotId, setSelectedSlotId] = useState("")

  if (listLoading || detailLoading) {
    return (
      <div className="mx-auto w-full max-w-[1440px] px-4 py-6 md:px-6">
        <div className="mb-4 h-4 w-72 animate-pulse rounded bg-slate-100" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <div className="h-[360px] animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
          </div>
          <div className="hidden h-[420px] animate-pulse rounded-2xl bg-slate-100 lg:block" />
        </div>
      </div>
    )
  }

  if (listError || (detailError && !resolvedCafe)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-950">Không tải được dữ liệu cơ sở</h1>
        <p className="mt-2 text-sm text-slate-500">
          Vui lòng kiểm tra BE tại <span className="font-mono">localhost:3000</span> hoặc thử tải lại.
        </p>
        <Button
          type="button"
          onClick={() => {
            if (listError) void refetchList()
            if (detailError) void refetchDetail()
          }}
          className="mt-4 bg-slate-950 font-semibold text-white hover:bg-orange-600"
        >
          Tải lại
        </Button>
      </div>
    )
  }

  if (!resolvedCafe || !cafe) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-950">Không tìm thấy cơ sở</h1>
        <p className="mt-2 text-sm text-slate-500">Cơ sở này không tồn tại hoặc đã bị ẩn.</p>
        <Button asChild className="mt-4 bg-slate-950 font-semibold text-white hover:bg-orange-600">
          <Link to={routePaths.cafes}>Quay lại khám phá</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-white pb-10">
      <div className="mx-auto flex w-full max-w-[1440px] items-center gap-1.5 px-4 pt-3 pb-1 text-xs text-slate-500 md:px-6">
        <Link to={routePaths.cafes} className="hover:text-slate-900">Cơ sở</Link>
        <span>/</span>
        <span className="text-slate-400">{cafe.city}</span>
        <span>/</span>
        <span className="text-slate-900">{cafe.name}</span>
      </div>

      <main className="mx-auto w-full max-w-[1440px] px-4 md:px-6">
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-8">
            <CafeDetailHero cafe={cafe} />
            <div className="lg:hidden">
              <CafeBookingCard
                cafe={cafe}
                selectedVehicleId={selectedVehicleId}
                fnbQuantities={fnbQuantities}
                mode={bookingMode}
                setMode={setBookingMode}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                selectedSlotId={selectedSlotId}
                setSelectedSlotId={setSelectedSlotId}
                menuItems={cafeMenu?.data ?? []}
              />
            </div>
            <CafeVehiclesSection
              cafe={cafe}
              selectedVehicleId={selectedVehicleId}
              onSelectVehicle={setSelectedVehicleId}
            />
            <CafeFnbSection
              menuItems={cafeMenu?.data ?? []}
              isLoading={menuLoading}
              isError={menuError}
              fnbQuantities={fnbQuantities}
              onChangeFnb={setFnbQuantities}
            />
            <CafeDetailContent
              description={cafe.description}
              amenities={cafeDetail?.amenities}
              rules={cafeDetail?.rules}
            />
          </div>

          <aside className="hidden lg:sticky lg:top-20 lg:block">
            <CafeBookingCard
              cafe={cafe}
              selectedVehicleId={selectedVehicleId}
              fnbQuantities={fnbQuantities}
              mode={bookingMode}
              setMode={setBookingMode}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              selectedSlotId={selectedSlotId}
              setSelectedSlotId={setSelectedSlotId}
              menuItems={cafeMenu?.data ?? []}
            />
          </aside>
        </div>
      </main>

      <ChatWidget cafeId={resolvedCafe.id} />
    </div>
  )
}
