import { Link } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { ArrowRight } from "lucide-react"
import { motion, useReducedMotion } from "framer-motion"
import { routePaths } from "@/app/router/route-paths"
import { getCafes } from "@/features/explore/api/explore.api"
import { Button } from "@/shared/ui/button"
import { HomeSearchPanel } from "./HomeSearchPanel"
import { HeroShowcaseRail } from "./HeroShowcaseRail"
import { fadeUpItem, landingViewport, staggerContainer } from "./landing-motion"
import { mapCafeToHeroVenue, rankLandingCafes } from "./landing-mappers"

export function HomeHeroSection() {
  const prefersReducedMotion = useReducedMotion()
  const { data: cafes = [], isLoading } = useQuery({
    queryKey: ["landing", "hero-cafes"],
    queryFn: () => getCafes({ limit: 6 }),
  })

  const venues = rankLandingCafes(cafes).slice(0, 3).map(mapCafeToHeroVenue)
  const stats = buildHeroStats(cafes)

  return (
    <section className="home-landing relative overflow-hidden bg-[var(--landing-background)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.22),_transparent_38%),radial-gradient(circle_at_top_right,_rgba(15,23,42,0.08),_transparent_34%)]" />

      <div className="mx-auto max-w-7xl px-4 pb-20 pt-10 md:px-6 lg:pb-28 lg:pt-18">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-center">
          <motion.div
            variants={staggerContainer}
            initial={prefersReducedMotion ? false : "hidden"}
            whileInView={prefersReducedMotion ? undefined : "visible"}
            viewport={landingViewport}
            className="space-y-8"
          >
            <motion.div variants={fadeUpItem} className="inline-flex items-center rounded-full border border-orange-200 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-600 shadow-[var(--landing-shadow-soft)]">
              Đặt sân RC nhanh và rõ ràng
            </motion.div>

            <motion.div variants={fadeUpItem} className="space-y-5">
              <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-tight text-slate-950 md:text-6xl xl:text-[5.1rem]">
                Chạy RC <span className="text-orange-600">đúng sân</span>, đúng giờ, không lo cọc.
              </h1>
              <p className="max-w-xl text-base font-medium leading-8 text-slate-600 md:text-lg">
                Tìm RC Cafe gần bạn, chọn khung giờ, đặt xe thuê và thanh toán trực tuyến trong một trải nghiệm gọn gàng, minh bạch và dễ hiểu.
              </p>
            </motion.div>

            <motion.div variants={fadeUpItem} className="flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="h-13 rounded-2xl bg-orange-600 px-7 font-black text-white shadow-[0_20px_42px_-20px_rgba(234,88,12,0.8)] hover:bg-orange-500"
              >
                <Link to={routePaths.cafes}>
                  Khám phá sân RC
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-13 rounded-2xl border-slate-200 bg-white/80 px-7 font-black text-slate-800 shadow-[var(--landing-shadow-soft)] hover:border-slate-300 hover:bg-white"
              >
                <Link to={routePaths.register}>Tạo tài khoản miễn phí</Link>
              </Button>
            </motion.div>

            <motion.div variants={fadeUpItem} className="grid gap-3 sm:grid-cols-3">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[24px] border border-white/70 bg-white/78 px-5 py-4 shadow-[var(--landing-shadow-soft)]"
                >
                  <p className="text-lg font-black text-slate-950">{item.value}</p>
                  <p className="mt-1 text-sm font-medium text-slate-500">{item.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <HeroShowcaseRail venues={venues} isLoading={isLoading} />
        </div>

        <div className="mt-10 lg:-mt-6">
          <HomeSearchPanel />
        </div>
      </div>
    </section>
  )
}

function buildHeroStats(cafes: Awaited<ReturnType<typeof getCafes>>) {
  const activeCafes = cafes.length
  const activeCities = new Set(cafes.map((cafe) => cafe.city).filter(Boolean)).size
  const averageRating =
    cafes.length > 0
      ? cafes.reduce((sum, cafe) => sum + (Number.isFinite(cafe.rating) ? cafe.rating : 0), 0) / cafes.length
      : 0

  return [
    {
      label: "RC Cafe đang mở",
      value: activeCafes > 0 ? String(activeCafes) : "0",
    },
    {
      label: "Tỉnh thành có sân",
      value: activeCities > 0 ? String(activeCities) : "0",
    },
    {
      label: "Đánh giá trung bình",
      value: averageRating > 0 ? averageRating.toFixed(1) : "N/A",
    },
  ]
}
