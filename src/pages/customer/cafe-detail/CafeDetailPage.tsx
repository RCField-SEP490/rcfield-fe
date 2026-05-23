import { Link, useParams } from "react-router"
import { routePaths } from "@/app/router/route-paths"
import { Button } from "@/shared/ui/button"
import { CafeBookingCard } from "./components/CafeBookingCard"
import { CafeDetailContent } from "./components/CafeDetailContent"
import { CafeDetailHero } from "./components/CafeDetailHero"
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
    <div className="bg-white">
      {/* Breadcrumb */}
      <div className="mx-auto flex w-full max-w-[1440px] items-center gap-1.5 px-4 pt-3 pb-1 text-xs text-slate-500 md:px-6">
        <Link to={routePaths.cafes} className="hover:text-slate-900">Cơ sở</Link>
        <span>/</span>
        <span className="text-slate-400">{cafe.city}</span>
        <span>/</span>
        <span className="text-slate-900">{cafe.name}</span>
      </div>

      {/* Content layout: gallery + booking card side by side */}
      <div className="mx-auto flex w-full max-w-[1440px] gap-6 px-4 pb-8 md:px-6">
        {/* Left: Gallery + Info */}
        <div className="min-w-0 flex-1 space-y-6">
          <CafeDetailHero cafe={cafe} />
          <CafeDetailContent description={cafe.description} />
        </div>
        {/* Right: Sticky booking card */}
        <aside className="hidden w-[340px] shrink-0 lg:block">
          <div className="sticky top-20">
            <CafeBookingCard cafe={cafe} />
          </div>
        </aside>
      </div>
    </div>
  )
}
