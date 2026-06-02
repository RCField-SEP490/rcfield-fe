import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, Eye } from "lucide-react"
import { useNavigate, useParams } from "react-router"

import { cafeApi, cafeQueryKeys } from "@/features/cafes/api/cafe.api"
import { mapCafeToExploreCafe, mapCatalogToExploreVehicle } from "@/features/cafes/lib/cafe.mappers"
import { vehicleApi } from "@/features/vehicles/api/vehicle.api"
import { menuApi, menuQueryKeys } from "@/features/menu/api/menu.api"
import { Button } from "@/shared/ui/button"
import { CafeBookingCard } from "@/pages/customer/cafe-detail/components/CafeBookingCard"
import { CafeDetailContent } from "@/pages/customer/cafe-detail/components/CafeDetailContent"
import { CafeDetailHero } from "@/pages/customer/cafe-detail/components/CafeDetailHero"
import { CafeFnbSection } from "@/pages/customer/cafe-detail/components/CafeFnbSection"
import { CafeVehiclesSection } from "@/pages/customer/cafe-detail/components/CafeVehiclesSection"
import type { BookingMode } from "@/features/booking/data/booking-options"

export function ProviderCafePreviewPage() {
  const { cafeId } = useParams<{ cafeId: string }>()
  const navigate = useNavigate()

  const { data: cafeDetail, isLoading, isError } = useQuery({
    queryKey: cafeQueryKeys.detail(cafeId),
    queryFn: () => cafeApi.getCafe(cafeId!),
    enabled: !!cafeId,
  })

  const { data: images = [] } = useQuery({
    queryKey: cafeQueryKeys.images(cafeId),
    queryFn: () => cafeApi.listCafeImages(cafeId!),
    enabled: !!cafeId,
  })

  const { data: cafeMenu, isLoading: menuLoading, isError: menuError } = useQuery({
    queryKey: menuQueryKeys.list(cafeId, { page: 1, limit: 100, available: true }),
    queryFn: () => menuApi.listMenuItems(cafeId!, { page: 1, limit: 100, available: true }),
    enabled: !!cafeId,
  })

  const { data: catalogs = [] } = useQuery({
    queryKey: ["cafe-catalogs", cafeId],
    queryFn: () => vehicleApi.listCatalogs(cafeId!),
    enabled: !!cafeId,
  })

  const cafe = useMemo(() => {
    if (!cafeDetail) return undefined
    const mapped = mapCafeToExploreCafe(cafeDetail, images)
    if (catalogs.length > 0) {
      mapped.availableVehicles = catalogs.map(mapCatalogToExploreVehicle)
    }
    return mapped
  }, [cafeDetail, images, catalogs])

  const [selectedVehicleId, setSelectedVehicleId] = useState<string | undefined>(undefined)
  const [fnbQuantities, setFnbQuantities] = useState<Record<string, number>>({})
  const [bookingMode, setBookingMode] = useState<BookingMode>("hourly")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const [selectedSlotId, setSelectedSlotId] = useState("")

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <PreviewBanner onBack={() => navigate(-1)} cafeName="..." />
        <div className="mx-auto max-w-[1440px] px-4 py-6 md:px-6">
          <div className="h-[360px] animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </div>
    )
  }

  if (isError || !cafe || !cafeDetail) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white">
        <p className="text-sm text-slate-500">Không tải được dữ liệu cơ sở.</p>
        <Button variant="outline" onClick={() => navigate(-1)} className="gap-2 font-bold">
          <ArrowLeft className="size-4" />
          Quay lại
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pb-10">
      <PreviewBanner onBack={() => navigate(-1)} cafeName={cafe.name} />

      <div className="mx-auto flex w-full max-w-[1440px] items-center gap-1.5 px-4 pt-3 pb-1 text-xs text-slate-400 md:px-6">
        <span>Cơ sở</span>
        <span>/</span>
        <span>{cafe.city}</span>
        <span>/</span>
        <span className="text-slate-600">{cafe.name}</span>
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
              amenities={cafeDetail.amenities}
              rules={cafeDetail.rules}
            />
          </div>

          <aside className="hidden lg:sticky lg:top-[88px] lg:block">
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
    </div>
  )
}

function PreviewBanner({ onBack, cafeName }: { onBack: () => void; cafeName: string }) {
  return (
    <div className="sticky top-0 z-50 flex items-center gap-3 bg-amber-500 px-4 py-2.5 shadow-md">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="h-7 gap-1.5 rounded-md px-2 text-amber-950 hover:bg-amber-400 font-bold text-xs"
      >
        <ArrowLeft className="size-3.5" />
        Quay lại
      </Button>
      <div className="flex flex-1 items-center gap-2">
        <Eye className="size-4 shrink-0 text-amber-950" />
        <span className="text-sm font-bold text-amber-950">
          Bản xem trước — "{cafeName}"
        </span>
      </div>
    </div>
  )
}
