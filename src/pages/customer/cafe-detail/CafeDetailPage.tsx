import { Link, useParams } from "react-router"
import { routePaths } from "@/app/router/route-paths"
import { Button } from "@/shared/ui/button"
import { CafeBookingCard } from "./components/CafeBookingCard"
import { CafeDetailContent } from "./components/CafeDetailContent"
import { CafeDetailHero } from "./components/CafeDetailHero"
import { CafeFnbSection } from "./components/CafeFnbSection"
import { CafeVehiclesSection } from "./components/CafeVehiclesSection"
import { getCafeBySlug } from "./cafe-detail-utils"

export function CafeDetailPage() {
  const { cafeSlug } = useParams()
  const cafe = getCafeBySlug(cafeSlug)

  if (!cafe) {
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
          <CafeDetailHero cafe={cafe} />

          <aside className="lg:sticky lg:top-20">
            <CafeBookingCard cafe={cafe} />
          </aside>

          <div className="min-w-0 space-y-8">
            <CafeVehiclesSection cafe={cafe} />
            <CafeFnbSection />
            <CafeDetailContent description={cafe.description} />
          </div>
        </div>
      </main>
    </div>
  )
}
