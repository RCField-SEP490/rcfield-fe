import { CalendarClock, Clock, PackageCheck, Repeat2 } from "lucide-react"
import { Link } from "react-router"
import { routePaths } from "@/app/router/route-paths"
import { Button } from "@/shared/ui/button"

const actions = [
  { title: "Book theo giờ", desc: "Từ 150k/giờ", icon: Clock, query: "mode=hourly" },
  { title: "Mua gói slot", desc: "5, 10 hoặc 20 slot", icon: PackageCheck, query: "mode=slotPackage" },
  { title: "Lịch cố định", desc: "Giữ lịch hàng tuần", icon: Repeat2, query: "mode=recurring" },
]

export function ExploreBookingStrip() {
  return (
    <section className="mx-auto -mt-10 w-full max-w-7xl px-4 md:px-6">
      <div className="grid gap-3 rounded-[2rem] border border-white/70 bg-white/85 p-3 shadow-2xl shadow-slate-300/40 backdrop-blur-xl md:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Button key={action.title} asChild variant="ghost" className="h-auto justify-start rounded-3xl p-4 text-left hover:bg-slate-50">
              <Link to={`${routePaths.bookingCreate}?${action.query}`}>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white"><Icon className="h-5 w-5" /></span>
                <span className="ml-4 min-w-0">
                  <span className="block text-base font-black text-slate-950">{action.title}</span>
                  <span className="mt-1 flex items-center gap-1 text-xs font-bold text-slate-500"><CalendarClock className="h-3.5 w-3.5 text-orange-600" /> {action.desc}</span>
                </span>
              </Link>
            </Button>
          )
        })}
      </div>
    </section>
  )
}
