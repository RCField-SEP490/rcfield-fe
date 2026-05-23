import { Link, useLocation, useNavigate } from "react-router"
import type { ReactNode } from "react"
import {
  BadgePercent,
  BarChart3,
  Building2,
  Car,
  CircleHelp,
  ClipboardList,
  Coffee,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PlayCircle,
  Plus,
  ShieldCheck,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import { routePaths } from "@/app/router/route-paths"
import { logoutSession } from "@/features/auth/api/auth.api"
import { useAuthStore } from "@/features/auth/stores/auth.store"
import { storageKeys } from "@/shared/lib/storage"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"

const providerNav = [
  { label: "Bảng điều khiển", icon: LayoutDashboard, to: routePaths.providerDashboard },
  { label: "Doanh thu", icon: BarChart3, to: routePaths.providerRevenue },
  { label: "Cơ sở", icon: Building2, to: routePaths.providerCafes },
  { label: "Quản lý xe", icon: Car, to: routePaths.providerVehicles },
  { label: "Đặt lịch", icon: ClipboardList, to: routePaths.providerBookings },
  { label: "Phiên chạy", icon: PlayCircle, to: routePaths.providerSessions },
  { label: "Menu F&B", icon: Coffee, to: routePaths.providerMenu },
  { label: "Gói & Giá", icon: Package, to: routePaths.providerPackages },
  { label: "Hội viên", icon: ShieldCheck, to: routePaths.providerSubscriptions },
  { label: "Ưu đãi", icon: BadgePercent, to: routePaths.providerPromotions },
  { label: "Nhân sự", icon: Users, to: routePaths.providerStaff },
]

export function ProviderShell({ children, contentClassName }: { children: ReactNode; contentClassName?: string }) {
  const navigate = useNavigate()
  const location = useLocation()
  const clearAuthenticated = useAuthStore((state) => state.clearAuthenticated)

  const handleLogout = async () => {
    const storedAuth = localStorage.getItem(storageKeys.auth) ?? sessionStorage.getItem(storageKeys.auth)

    if (storedAuth) {
      try {
        const auth = JSON.parse(storedAuth) as { accessToken?: string; refreshToken?: string }

        if (auth.accessToken && auth.refreshToken) {
          await logoutSession(auth.accessToken, auth.refreshToken)
        }
      } catch {
        // Local logout still clears the app when the server session is already gone.
      }
    }

    clearAuthenticated()
    localStorage.removeItem(storageKeys.auth)
    sessionStorage.removeItem(storageKeys.auth)
    toast.success("Đã đăng xuất khỏi khu vực nhà cung cấp.")
    navigate(routePaths.login, { replace: true })
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#fcf8f8] text-[#1c1b1b]">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col rounded-r-xl border-r border-[#c4c7c8] bg-[#f6f3f2] p-4 md:flex">
        <Link to={routePaths.providerDashboard} className="mb-8 px-4">
          <h1 className="text-[32px] font-semibold leading-tight tracking-tight text-[#5d5f5f]">Quản trị viên</h1>
          <p className="mt-1 text-sm font-medium text-[#444748]">Hệ thống quản lý chuỗi</p>
        </Link>

        <Button className="mb-8 h-12 w-full gap-2 rounded-lg bg-[#1c1b1b] text-white hover:bg-[#313030]">
          <Plus className="size-5" />
          Tạo đơn mới
        </Button>

        <nav className="flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
          {providerNav.map((item) => {
            const Icon = item.icon
            const active = location.pathname === item.to || (item.to !== routePaths.providerDashboard && location.pathname.startsWith(item.to))

            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                  active ? "bg-[#e2e1eb] text-[#63646c]" : "text-[#444748] hover:bg-[#e5e2e1]"
                )}
              >
                <Icon className="size-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="mt-3 flex flex-col gap-2">
          <button className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-[#444748] hover:bg-[#e5e2e1]">
            <CircleHelp className="size-5" />
            Trợ giúp
          </button>
          <button onClick={handleLogout} className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-[#444748] hover:bg-[#e5e2e1]">
            <LogOut className="size-5" />
            Đăng xuất
          </button>
        </div>
      </aside>

      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-[#c4c7c8] bg-[#fcf8f8] px-4 md:hidden">
        <div className="text-[32px] font-bold leading-tight tracking-tight text-[#1c1b1b]">RCField</div>
        <Button variant="ghost" size="icon" aria-label="Mở menu" className="text-[#5d5f5f]">
          <Menu className="size-5" />
        </Button>
      </header>

      <main className="h-full w-full flex-1 overflow-y-auto bg-[#fcf8f8] pb-24 pt-16 md:ml-64 md:pb-0 md:pt-0">
        <div className={cn("mx-auto max-w-7xl px-4 py-8 md:px-6", contentClassName)}>{children}</div>
      </main>
    </div>
  )
}
