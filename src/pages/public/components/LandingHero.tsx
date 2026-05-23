import { ArrowRight, Gauge } from "lucide-react"
import { Link } from "react-router"
import { routePaths } from "@/app/router/route-paths"
import { landingStats } from "@/shared/data/landing-data"
import { Button } from "@/shared/ui/button"
import { QuickBookingSearch } from "./QuickBookingSearch"

export function LandingHero() {
  return (
    <section className="bg-white">
      <div className="mx-auto grid min-h-[calc(100svh-4rem)] w-full max-w-7xl items-center gap-10 px-4 py-12 md:px-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-orange-700">
            <Gauge className="h-3.5 w-3.5" /> RCField Booking Hub
          </div>
          <div className="space-y-5">
            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight text-slate-950 md:text-6xl">
              Book lịch chạy RC nhanh hơn, chọn đúng sân hơn.
            </h1>
            <p className="max-w-2xl text-base font-medium leading-7 text-slate-600 md:text-lg">
              Tìm RC Cafe theo khu vực, loại track và đội xe thuê. Bắt đầu bằng lịch chơi mong muốn, RCField sẽ đưa bạn đến danh sách cơ sở phù hợp.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-full bg-slate-950 px-6 font-black text-white hover:bg-orange-600">
              <Link to={routePaths.cafes}>
                Khám phá cơ sở <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-full px-6 font-black">
              <Link to={routePaths.login}>Đăng nhập để đặt lịch</Link>
            </Button>
          </div>
          <div className="grid max-w-xl grid-cols-3 gap-4 border-t border-slate-200 pt-6">
            {landingStats.map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-black text-slate-950">{stat.value}</p>
                <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        <QuickBookingSearch />
      </div>
    </section>
  )
}
