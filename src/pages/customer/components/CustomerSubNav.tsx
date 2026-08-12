import { Link } from "react-router"
import { CalendarCheck, Package, Star, UserRound } from "lucide-react"
import { cn } from "@/shared/lib/utils"

export type CustomerTab = "profile" | "bookings" | "packages" | "reviews"

interface CustomerSubNavProps {
  activeTab: CustomerTab
}

const tabConfig = [
  { id: "profile" as const, label: "Hồ sơ", path: "/customer/profile", icon: UserRound },
  { id: "bookings" as const, label: "Lịch đặt sân", path: "/customer/bookings", icon: CalendarCheck },
  { id: "packages" as const, label: "Gói hội viên", path: "/customer/packages", icon: Package },
  { id: "reviews" as const, label: "Đánh giá của tôi", path: "/customer/reviews", icon: Star },
]

export function CustomerSubNav({ activeTab }: CustomerSubNavProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-slate-200/60 bg-white/70 p-1 shadow-sm backdrop-blur-sm">
      {tabConfig.map((tab) => {
        const Icon = tab.icon
        const isActive = tab.id === activeTab
        return (
          <Link
            key={tab.id}
            to={tab.path}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200",
              isActive
                ? "bg-slate-900 text-white shadow-md shadow-slate-900/15"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <Icon className={cn("h-4 w-4", isActive ? "text-orange-400" : "text-slate-400")} />
            <span className="hidden sm:inline">{tab.label}</span>
          </Link>
        )
      })}
    </div>
  )
}
