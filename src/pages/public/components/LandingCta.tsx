import { ArrowRight } from "lucide-react"
import { Link } from "react-router"
import { routePaths } from "@/app/router/route-paths"
import { Button } from "@/shared/ui/button"

export function LandingCta() {
  return (
    <section className="bg-slate-950 py-16 text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 text-center md:px-6">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-400">Sẵn sàng chạy?</p>
        <h2 className="mx-auto max-w-3xl text-3xl font-black tracking-tight md:text-5xl">Khám phá cơ sở RC Cafe đang mở lịch hôm nay.</h2>
        <p className="mx-auto max-w-2xl font-medium leading-7 text-slate-300">Trang khám phá đã hỗ trợ grid/list, search, filter và quick view để bạn chọn nơi chơi phù hợp trước khi tạo booking.</p>
        <div className="flex justify-center">
          <Button asChild size="lg" className="h-12 rounded-full bg-orange-600 px-6 font-black text-white hover:bg-white hover:text-slate-950">
            <Link to={routePaths.cafes}>Đi tới trang khám phá <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
