import { ArrowRight, Gauge } from "lucide-react"
import { Link } from "react-router"
import { routePaths } from "@/app/router/route-paths"
import { landingStats } from "@/shared/data/landing-data"
import { Button } from "@/shared/ui/button"
import { QuickBookingSearch } from "./QuickBookingSearch"

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-white to-slate-50/80">
      {/* Decorative background blobs */}
      <div className="pointer-events-none absolute -top-40 right-0 h-[500px] w-[500px] rounded-full bg-orange-500/5 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-20 left-0 h-[400px] w-[400px] rounded-full bg-indigo-500/5 blur-[100px]" />

      <div className="relative mx-auto grid min-h-[calc(100svh-5rem)] w-full max-w-7xl items-center gap-10 px-4 py-12 md:px-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-xl border border-orange-200/60 bg-orange-50/70 px-3.5 py-1.5 text-xs font-black uppercase tracking-wide text-orange-700 backdrop-blur-sm">
            <Gauge className="h-3.5 w-3.5" /> RCField Booking Hub
          </div>
          <div className="space-y-5">
            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight text-slate-950 md:text-6xl">
              Book lịch chạy RC nhanh hơn, chọn đúng sân hơn.
            </h1>
            <p className="max-w-2xl text-base font-medium leading-7 text-slate-500 md:text-lg">
              Tìm RC Cafe theo khu vực, loại track và đội xe thuê. Bắt đầu bằng lịch chơi mong muốn, RCField sẽ đưa bạn đến danh sách cơ sở phù hợp.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-xl bg-slate-950 px-6 font-black text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-orange-600 hover:shadow-orange-600/25 hover:shadow-xl">
              <Link to={routePaths.cafes}>
                Khám phá cơ sở <ArrowRight className="h-4 w-4 transition-transform group-hover/button:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-xl border-slate-200 px-6 font-black hover:bg-slate-100">
              <Link to={routePaths.login}>Đăng nhập để đặt lịch</Link>
            </Button>
          </div>
          <div className="bg-orange-50/50 border border-orange-100/60 rounded-2xl p-4 flex items-center justify-between gap-4 max-w-xl">
            <div>
              <p className="text-xs font-bold text-slate-800">Bạn sở hữu Sân đua hoặc RC Cafe?</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Số hóa đặt lịch, quản trị xe rental & tăng doanh thu với giải pháp SaaS của RCField.</p>
            </div>
            <Link 
              to={routePaths.partnerLanding}
              className="inline-flex items-center gap-1 text-xs font-black text-orange-600 hover:text-orange-700 shrink-0 hover:underline"
            >
              Hợp tác đối tác <ArrowRight className="h-3 w-3" />
            </Link>
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
