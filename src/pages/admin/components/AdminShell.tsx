import { Link, useLocation, useNavigate } from "react-router"
import type { ReactNode } from "react"
import { useState } from "react"
import {
  Award,
  Building2,
  CircleHelp,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Scale,
  Settings2,
  Users,
  X,
  Zap,
} from "lucide-react"
import { toast } from "sonner"

import { routePaths } from "@/app/router/route-paths"
import { logoutSession } from "@/features/auth/api/auth.api"
import { useAuthStore } from "@/features/auth/stores/auth.store"
import { storageKeys } from "@/shared/lib/storage"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"

const adminNav = [
  { label: "Bảng điều khiển", icon: LayoutDashboard, to: routePaths.adminDashboard },
  { label: "Duyệt đối tác", icon: Building2, to: routePaths.adminCafes },
  { label: "Giải quyết khiếu nại", icon: Scale, to: routePaths.adminDisputes },
  { label: "Người dùng", icon: Users, to: routePaths.adminUsers },
  { label: "Thanh toán SaaS", icon: CreditCard, to: routePaths.adminPayments },
  { label: "Cấu hình hệ thống", icon: Settings2, to: routePaths.adminFeatureFlags },
  { label: "Lịch sử điểm uy tín", icon: Award, to: routePaths.adminTrustScoreLogs },
]

export function AdminShell({ children, contentClassName }: { children: ReactNode; contentClassName?: string }) {
  const navigate = useNavigate()
  const location = useLocation()
  const clearAuthenticated = useAuthStore((state) => state.clearAuthenticated)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
    toast.success("Đã đăng xuất khỏi tài khoản Quản trị viên.")
    navigate(routePaths.login, { replace: true })
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#fcf8f8] text-[#1c1b1b] font-sans">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col rounded-r-xl border-r border-[#e5e2e1] bg-white p-4 md:flex shadow-sm">
        <Link to={routePaths.adminDashboard} className="mb-8 px-4 flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-[#primary] text-white bg-orange-600 shadow-md">
            <Zap className="size-4 fill-current" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight tracking-tight text-[#1c1b1b]">RCField Admin</h1>
            <p className="text-[10px] font-semibold text-[#747878] uppercase tracking-wider">Hệ thống quản trị</p>
          </div>
        </Link>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto pr-1">
          {adminNav.map((item) => {
            const Icon = item.icon
            const active = location.pathname === item.to || (item.to !== routePaths.adminDashboard && location.pathname.startsWith(item.to))

            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold transition-all duration-150",
                  active
                    ? "bg-orange-50 text-orange-700 shadow-sm border border-orange-100/50"
                    : "text-[#444748] hover:bg-[#f6f3f2] hover:text-[#1c1b1b]"
                )}
              >
                <Icon className={cn("size-5", active ? "text-orange-600" : "text-[#747878]")} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="mt-3 flex flex-col gap-1 border-t border-[#e5e2e1] pt-3">
          <button className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold text-[#444748] hover:bg-[#f6f3f2] hover:text-[#1c1b1b] text-left">
            <CircleHelp className="size-5 text-[#747878]" />
            Hướng dẫn sử dụng
          </button>
          <button onClick={handleLogout} className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold text-[#444748] hover:bg-red-50 hover:text-red-700 text-left">
            <LogOut className="size-5 text-[#747878] group-hover:text-red-600" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-[#e5e2e1] bg-white px-4 md:hidden shadow-sm">
        <Link to={routePaths.adminDashboard} className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-orange-600 text-white">
            <Zap className="size-4 fill-current" />
          </div>
          <span className="text-lg font-bold text-[#1c1b1b]">RCField Admin</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)} className="text-[#444748] hover:bg-[#f6f3f2]">
          <Menu className="size-5" />
        </Button>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative flex w-full max-w-xs flex-col bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between mb-8 px-2">
              <span className="text-lg font-bold text-[#1c1b1b]">Menu Quản trị</span>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                <X className="size-5" />
              </Button>
            </div>

            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
              {adminNav.map((item) => {
                const Icon = item.icon
                const active = location.pathname === item.to || (item.to !== routePaths.adminDashboard && location.pathname.startsWith(item.to))

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold transition-all",
                      active
                        ? "bg-orange-50 text-orange-700 shadow-sm border border-orange-100"
                        : "text-[#444748] hover:bg-[#f6f3f2]"
                    )}
                  >
                    <Icon className={cn("size-5", active ? "text-orange-600" : "text-[#747878]")} />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            <div className="mt-3 flex flex-col gap-1 border-t border-[#e5e2e1] pt-3">
              <button onClick={handleLogout} className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 text-left">
                <LogOut className="size-5" />
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Pane */}
      <main className="h-full w-full flex-1 overflow-y-auto bg-[#fcf8f8] pb-24 pt-16 md:ml-64 md:pb-0 md:pt-0">
        <div className={cn("mx-auto max-w-7xl px-4 py-8 md:px-6", contentClassName)}>{children}</div>
      </main>
    </div>
  )
}
