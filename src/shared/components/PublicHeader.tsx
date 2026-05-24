import { CalendarCheck, Car, LogOut, Menu, Package, UserRound, X } from "lucide-react"
import { useState } from "react"
import { NavLink } from "react-router"
import { routePaths } from "@/app/router/route-paths"
import { useAuthStore, type AuthUser } from "@/features/auth/stores/auth.store"
import { AppLogo } from "@/shared/components/AppLogo"
import { cn } from "@/shared/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar"
import { Button } from "@/shared/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"

const navItems = [
  { label: "Khám phá", to: routePaths.cafes },
  { label: "Đơn đặt", to: routePaths.customerBookings },
  { label: "Khách hàng", to: routePaths.customerProfile },
  { label: "Cơ sở", to: routePaths.providerCafes },
  { label: "Quản trị", to: routePaths.adminDashboard },
]

const customerMenuItems = [
  { label: "Hồ sơ cá nhân", to: routePaths.customerProfile, icon: UserRound },
  { label: "Lịch đặt sân", to: routePaths.customerBookings, icon: CalendarCheck },
  { label: "Xe cá nhân", to: routePaths.customerVehicles, icon: Car },
  { label: "Gói hội viên", to: routePaths.customerPackages, icon: Package },
]

export function PublicHeader() {
  const [isOpen, setIsOpen] = useState(false)
  const { isAuthenticated, user, clearAuthenticated } = useAuthStore()

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="mx-auto mt-3 w-[calc(100%-2rem)] max-w-[1440px] rounded-2xl border border-white/20 bg-white/70 px-3 shadow-lg shadow-slate-900/5 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 md:mt-4 md:w-[calc(100%-3rem)] md:px-5">
        <div className="flex h-14 items-center justify-between gap-3 md:h-15">
          <AppLogo />

          <nav className="hidden items-center gap-0.5 lg:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "relative rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition-all duration-200 ease-out hover:bg-slate-100 hover:text-slate-900",
                    isActive && "bg-slate-900 text-white shadow-md shadow-slate-900/20 hover:bg-slate-800 hover:text-white",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            {isAuthenticated && user ? (
              <UserMenu user={user} onLogout={clearAuthenticated} />
            ) : (
              <>
                <Button asChild variant="ghost" className="rounded-xl font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                  <NavLink to={routePaths.login}>Đăng nhập</NavLink>
                </Button>
                <Button asChild className="rounded-xl bg-slate-900 px-5 font-semibold text-white shadow-md shadow-slate-900/20 hover:bg-orange-600 hover:shadow-orange-600/25">
                  <NavLink to={routePaths.register}>Đăng ký</NavLink>
                </Button>
              </>
            )}
          </div>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="rounded-xl hover:bg-slate-100 lg:hidden"
            aria-label="Mở menu"
            onClick={() => setIsOpen((current) => !current)}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {isOpen && (
          <div className="animate-in slide-in-from-top-2 border-t border-slate-200/60 px-1 pb-4 pt-3 duration-200">
            <nav className="flex flex-col gap-0.5">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
                      isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100",
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {isAuthenticated && user ? (
              <div className="mt-3 rounded-xl border bg-white p-3">
                <div className="flex items-center gap-3">
                  <Avatar size="lg">
                    <AvatarImage src={user.avatarUrl} />
                    <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-950">{user.fullName}</p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button asChild variant="outline" className="rounded-xl text-xs font-semibold">
                    <NavLink to={routePaths.customerProfile} onClick={() => setIsOpen(false)}>Hồ sơ</NavLink>
                  </Button>
                  <Button asChild variant="outline" className="rounded-xl text-xs font-semibold">
                    <NavLink to={routePaths.customerBookings} onClick={() => setIsOpen(false)}>Lịch đặt</NavLink>
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    className="col-span-2 rounded-xl text-xs font-semibold"
                    onClick={() => {
                      clearAuthenticated()
                      setIsOpen(false)
                    }}
                  >
                    Đăng xuất
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button asChild variant="outline" className="rounded-xl font-semibold">
                  <NavLink to={routePaths.login} onClick={() => setIsOpen(false)}>Đăng nhập</NavLink>
                </Button>
                <Button asChild className="rounded-xl bg-slate-900 font-semibold text-white">
                  <NavLink to={routePaths.register} onClick={() => setIsOpen(false)}>Đăng ký</NavLink>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

function UserMenu({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 py-1.5 pl-2 pr-3 shadow-sm transition hover:bg-white">
          <Avatar>
            <AvatarImage src={user.avatarUrl} />
            <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-32 truncate text-sm font-bold text-slate-800 xl:block">{user.fullName}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 rounded-xl p-2">
        <DropdownMenuLabel className="px-2 py-2">
          <div className="flex items-center gap-3">
            <Avatar size="lg">
              <AvatarImage src={user.avatarUrl} />
              <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-950">{user.fullName}</p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {customerMenuItems.map((item) => {
          const Icon = item.icon
          return (
            <DropdownMenuItem key={item.to} asChild className="cursor-pointer rounded-lg px-2 py-2">
              <NavLink to={item.to}>
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            </DropdownMenuItem>
          )
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" className="cursor-pointer rounded-lg px-2 py-2" onClick={onLogout}>
          <LogOut className="h-4 w-4" />
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(-2)
    .toUpperCase()
}
