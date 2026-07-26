import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link, useParams } from "react-router"
import { motion } from "framer-motion"
import { useSectionEntrance } from "@/shared/lib/motion"
import { routePaths } from "@/app/router/route-paths"
import {
  cafeApi,
  cafeQueryKeys,
  CAFE_CONFIGURATION_REFETCH_INTERVAL_MS,
} from "@/features/cafes/api/cafe.api"
import { mapCafeToExploreCafe, mapCatalogToExploreVehicle } from "@/features/cafes/lib/cafe.mappers"
import { vehicleApi } from "@/features/vehicles/api/vehicle.api"
import { menuApi, menuQueryKeys } from "@/features/menu/api/menu.api"
import { ChatWidget } from "@/features/chat/components/ChatWidget"
import { Button } from "@/shared/ui/button"
import { CafeBookingCard } from "./components/CafeBookingCard"
import { CafeDetailContent } from "./components/CafeDetailContent"
import { CafeDetailHero } from "./components/CafeDetailHero"
import { CafeFnbSection } from "./components/CafeFnbSection"
import { CafePackagesSection } from "./components/CafePackagesSection"
import { CafePromoBanner } from "./components/CafePromoBanner"
import { CafeVehiclesSection } from "./components/CafeVehiclesSection"
import { useCafeConfigurationRefresh } from "@/features/cafes/hooks/useCafeConfigurationRefresh"
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
    refetchInterval: CAFE_CONFIGURATION_REFETCH_INTERVAL_MS,
    refetchOnWindowFocus: "always",
  })
  useCafeConfigurationRefresh(resolvedCafe?.id, refetchDetail)
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
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString("sv-SE"))
  const [selectedSlotId, setSelectedSlotId] = useState("")

  // Cùng bộ biến thể với danh sách ở trang Khám phá, có tôn trọng reduced-motion.
  // Phải gọi trước mọi nhánh return sớm bên dưới (quy tắc hook).
  const sectionEntrance = useSectionEntrance()
  const entranceProps = (index: number) => ({
    custom: index,
    variants: sectionEntrance,
    initial: "hidden" as const,
    animate: "visible" as const,
  })

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
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mx-auto flex w-full max-w-[1440px] items-center gap-1.5 px-4 pt-3 pb-1 text-xs text-slate-500 md:px-6"
      >
        <Link to={routePaths.cafes} className="hover:text-slate-900">Cơ sở</Link>
        <span>/</span>
        <span className="text-slate-400">{cafe.city}</span>
        <span>/</span>
        <span className="text-slate-900">{cafe.name}</span>
      </motion.div>

      <main className="mx-auto w-full max-w-[1440px] px-4 md:px-6">
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-8">
            <motion.div {...entranceProps(0)}>
              <CafeDetailHero cafe={cafe} />
            </motion.div>
            <motion.div {...entranceProps(1)}>
              <CafePromoBanner cafeId={resolvedCafe.id} />
            </motion.div>
            <motion.div {...entranceProps(2)} className="lg:hidden">
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
            </motion.div>
            <motion.div {...entranceProps(3)}>
              <CafeVehiclesSection
                cafe={cafe}
                selectedVehicleId={selectedVehicleId}
                onSelectVehicle={setSelectedVehicleId}
              />
            </motion.div>
            <motion.div {...entranceProps(4)}>
              <CafePackagesSection cafeId={resolvedCafe.id} />
            </motion.div>
            <motion.div {...entranceProps(5)}>
              <CafeFnbSection
                menuItems={cafeMenu?.data ?? []}
                isLoading={menuLoading}
                isError={menuError}
                fnbQuantities={fnbQuantities}
                onChangeFnb={setFnbQuantities}
              />
            </motion.div>
            <motion.div {...entranceProps(6)}>
              <CafeDetailContent
                description={cafe.description}
                amenities={cafeDetail?.amenities}
                rules={cafeDetail?.rules}
                cafeId={cafeDetail?.id}
              />
            </motion.div>
          </div>

          {/* Giữ position:sticky ở chính <aside> — bọc motion.div ra ngoài sẽ tạo
              containing block mới do transform và làm hỏng dính khi cuộn. */}
          <aside className="hidden lg:sticky lg:top-20 lg:block">
            <motion.div {...entranceProps(2)}>
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
            </motion.div>
          </aside>
        </div>
      </main>

      <ChatWidget cafeId={resolvedCafe.id} />
    </div>
  )
}
