import { ArrowRight } from "lucide-react"
import { Link } from "react-router"
import { routePaths } from "@/app/router/route-paths"
import { Button } from "@/shared/ui/button"

export function LandingCta() {
  return (
    <section className="relative overflow-hidden bg-slate-950 py-20 text-white">
      {/* Glow effects */}
      <div className="pointer-events-none absolute top-0 left-1/2 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-orange-600/15 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-[300px] w-[400px] rounded-full bg-indigo-600/10 blur-[100px]" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center gap-6 px-4 text-center md:px-6">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-400">Sẵn sàng chạy?</p>
        <h2 className="mx-auto max-w-3xl text-3xl font-black tracking-tight md:text-5xl">Khám phá cơ sở RC Cafe đang mở lịch hôm nay.</h2>
        <p className="mx-auto max-w-2xl font-medium leading-7 text-slate-400">Trang khám phá đã hỗ trợ grid/list, search, filter và quick view để bạn chọn nơi chơi phù hợp trước khi tạo booking.</p>
        <div className="flex justify-center">
          <Button asChild size="lg" className="group h-12 rounded-xl bg-orange-600 px-6 font-black text-white shadow-lg shadow-orange-600/30 transition-all hover:bg-white hover:text-slate-950 hover:shadow-xl">
            <Link to={routePaths.cafes}>
              Đi tới trang khám phá <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
