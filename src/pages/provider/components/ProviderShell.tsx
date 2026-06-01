import { Link, useLocation, useNavigate } from "react-router"
import { Children, isValidElement } from "react"
import type { ElementType, ReactNode } from "react"
import { useEffect, useRef, useState } from "react"
import {
  BadgePercent,
  BarChart3,
  Building2,
  CalendarDays,
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
  Settings,
  ShieldCheck,
  Share2,
  Users,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { routePaths } from "@/app/router/route-paths"
import { logoutSession } from "@/features/auth/api/auth.api"
import { useAuthStore } from "@/features/auth/stores/auth.store"
import { storageKeys } from "@/shared/lib/storage"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { NotificationBell } from "@/features/notifications/components/NotificationBell"
import { ProviderHeader, ProviderPageHeader } from "@/pages/provider/components/ProviderPrimitives"
import { ImpersonationBanner } from "@/shared/components/ImpersonationBanner"

type NavItem = { label: string; icon: ElementType; to: string }
type NavGroup = { heading: string; items: NavItem[] }

const providerNavGroups: NavGroup[] = [
  {
    heading: "Tổng quan",
    items: [
      { label: "Bảng điều khiển", icon: LayoutDashboard, to: routePaths.providerDashboard },
      { label: "Doanh thu", icon: BarChart3, to: routePaths.providerRevenue },
    ],
  },
  {
    heading: "Vận hành chi nhánh",
    items: [
      { label: "Cơ sở", icon: Building2, to: routePaths.providerCafes },
      { label: "Quản lý xe", icon: Car, to: routePaths.providerVehicles },
      { label: "Đặt lịch", icon: ClipboardList, to: routePaths.providerBookings },
      { label: "Ca làm việc", icon: CalendarDays, to: routePaths.providerSchedule },
      { label: "Phiên chạy", icon: PlayCircle, to: routePaths.providerSessions },
      { label: "Nhân sự", icon: Users, to: routePaths.providerStaff },
    ],
  },
  {
    heading: "Kinh doanh",
    items: [
      { label: "Menu F&B", icon: Coffee, to: routePaths.providerMenu },
      { label: "Gói & Giá", icon: Package, to: routePaths.providerPackages },
      { label: "Hội viên", icon: ShieldCheck, to: routePaths.providerSubscriptions },
      { label: "Ưu đãi", icon: BadgePercent, to: routePaths.providerPromotions },
    ],
  },
  {
    heading: "Hệ thống",
    items: [
      { label: "Kênh Messenger", icon: Share2, to: routePaths.providerChannels },
      { label: "Cấu hình", icon: Settings, to: routePaths.providerConfiguration },
    ],
  },
]

const providerSidebarScrollKey = "rcfield:provider-sidebar-scroll"

function saveProviderSidebarScroll(element: HTMLElement | null) {
  if (!element) return

  sessionStorage.setItem(providerSidebarScrollKey, String(element.scrollTop))
}

function restoreProviderSidebarScroll(element: HTMLElement | null) {
  if (!element) return

  const savedScrollTop = Number(sessionStorage.getItem(providerSidebarScrollKey) ?? 0)
  if (Number.isFinite(savedScrollTop)) {
    element.scrollTop = savedScrollTop
  }
}

export function ProviderShell({ children, contentClassName }: { children: ReactNode; contentClassName?: string }) {
  const navigate = useNavigate()
  const location = useLocation()
  const clearAuthenticated = useAuthStore((state) => state.clearAuthenticated)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const desktopNavRef = useRef<HTMLElement | null>(null)
  const mobileNavRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      restoreProviderSidebarScroll(desktopNavRef.current)
      restoreProviderSidebarScroll(mobileNavRef.current)
    })

    return () => cancelAnimationFrame(frame)
  }, [location.pathname, mobileMenuOpen])
  
  // IMPERSONATION CANNOT DELETE
  const impersonation = useAuthStore((state) => state.impersonation)

  const handleLogout = async () => {
    // When impersonating, the logout button exits the impersonation session instead
    if (impersonation) {
      const adminRaw = localStorage.getItem(storageKeys.adminAuth)
      if (adminRaw) {
        localStorage.setItem(storageKeys.auth, adminRaw)
        localStorage.removeItem(storageKeys.adminAuth)
      }
      localStorage.removeItem(storageKeys.impersonation)
      window.location.href = `/admin/providers/${impersonation.providerUserId}`
      return
    }

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

  const childList = Children.toArray(children)
  const headerChildren = childList.filter(
    (child) => isValidElement(child) && (child.type === ProviderHeader || child.type === ProviderPageHeader)
  )
  const contentChildren = childList.filter(
    (child) => !(isValidElement(child) && (child.type === ProviderHeader || child.type === ProviderPageHeader))
  )

  return (
    <div className="provider-orange-theme flex min-h-screen bg-[#fcf8f8] text-[#1c1b1b]">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col rounded-r-xl border-r border-orange-200 bg-white p-4 shadow-sm md:flex">
        <Link to={routePaths.providerDashboard} className="mb-8 px-4">
          <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-orange-600 text-white shadow-md">
            <Building2 className="size-4" />
          </div>
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-orange-900">RCField Provider</h1>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-orange-700/70">Hệ thống quản lý chuỗi</p>
        </Link>

        <Button className="mb-8 h-12 w-full gap-2 rounded-lg bg-orange-600 text-white shadow-sm hover:bg-orange-700">
          <Plus className="size-5" />
          Tạo đơn mới
        </Button>

        <nav
          ref={desktopNavRef}
          onScroll={(event) => saveProviderSidebarScroll(event.currentTarget)}
          className="flex flex-1 flex-col gap-4 overflow-y-auto pr-1"
        >
          {providerNavGroups.map((group) => (
            <div key={group.heading}>
              <p className="mb-1 px-4 text-[10px] font-extrabold uppercase tracking-widest text-orange-700/45">
                {group.heading}
              </p>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const active = location.pathname === item.to || (item.to !== routePaths.providerDashboard && location.pathname.startsWith(item.to))

                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => saveProviderSidebarScroll(desktopNavRef.current)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-bold transition-all duration-150",
                        active
                          ? "border border-orange-100 bg-orange-50 text-orange-700 shadow-sm"
                          : "text-orange-950/75 hover:bg-orange-50 hover:text-orange-800"
                      )}
                    >
                      <Icon className={cn("size-4.5", active ? "text-orange-600" : "text-orange-700/55")} />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-3 flex flex-col gap-1 border-t border-orange-100 pt-3">
          <button className="flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-bold text-orange-950/75 hover:bg-orange-50 hover:text-orange-800">
            <CircleHelp className="size-5" />
            Trợ giúp
          </button>
          <button onClick={handleLogout} className="flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-bold text-orange-950/75 hover:bg-red-50 hover:text-red-700">
            <LogOut className="size-5" />
            Đăng xuất
          </button>
        </div>
      </aside>

      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-orange-200 bg-white px-4 shadow-sm md:hidden">
        <div className="text-2xl font-extrabold leading-tight tracking-tight text-orange-900">RCField</div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Button variant="ghost" size="icon" aria-label="Mở menu" className="text-orange-700 hover:bg-orange-50" onClick={() => setMobileMenuOpen(true)}>
            <Menu className="size-5" />
          </Button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative flex w-full max-w-xs flex-col bg-white p-4 shadow-xl">
            <div className="mb-8 flex items-center justify-between px-2">
              <span className="text-lg font-extrabold text-orange-900">Menu Provider</span>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)} className="text-orange-700 hover:bg-orange-50">
                <X className="size-5" />
              </Button>
            </div>

            <nav
              ref={mobileNavRef}
              onScroll={(event) => saveProviderSidebarScroll(event.currentTarget)}
              className="flex flex-1 flex-col gap-4 overflow-y-auto"
            >
              {providerNavGroups.map((group) => (
                <div key={group.heading}>
                  <p className="mb-1 px-4 text-[10px] font-extrabold uppercase tracking-widest text-orange-700/45">
                    {group.heading}
                  </p>
                  <div className="flex flex-col gap-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon
                      const active = location.pathname === item.to || (item.to !== routePaths.providerDashboard && location.pathname.startsWith(item.to))

                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => {
                            saveProviderSidebarScroll(mobileNavRef.current)
                            setMobileMenuOpen(false)
                          }}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-bold transition-all",
                            active
                              ? "border border-orange-100 bg-orange-50 text-orange-700 shadow-sm"
                              : "text-orange-950/75 hover:bg-orange-50"
                          )}
                        >
                          <Icon className={cn("size-4.5", active ? "text-orange-600" : "text-orange-700/55")} />
                          {item.label}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="mt-3 flex flex-col gap-1 border-t border-orange-100 pt-3">
              <button onClick={handleLogout} className="flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-bold text-red-600 hover:bg-red-50">
                <LogOut className="size-5" />
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="w-full flex-1 bg-[#fcf8f8] pb-24 pt-16 md:ml-64 md:pb-0 md:pt-0">
        <ImpersonationBanner />
        {headerChildren}
        <div className={cn("mx-auto max-w-7xl px-4 py-8 md:px-6", contentClassName)}>{contentChildren}</div>
      </main>
    </div>
  )
}
