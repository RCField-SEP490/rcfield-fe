import { Menu, X } from "lucide-react"
import { useState } from "react"
import { NavLink } from "react-router"
import { routePaths } from "@/app/router/route-paths"
import { AppLogo } from "@/shared/components/AppLogo"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/lib/utils"

const navItems = [
  { label: "Khám phá", to: routePaths.cafes },
  { label: "Đơn đặt", to: routePaths.customerBookings },
  { label: "Cơ sở", to: routePaths.providerCafes },
  { label: "Quản trị", to: routePaths.adminDashboard },
]

export function PublicHeader() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 md:px-6">
        <AppLogo />

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "rounded-full px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950",
                  isActive && "bg-slate-100 text-slate-950",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button asChild variant="ghost" className="font-bold text-slate-700">
            <NavLink to={routePaths.login}>Đăng nhập</NavLink>
          </Button>
          <Button asChild className="rounded-full bg-slate-950 px-5 font-bold text-white hover:bg-orange-600">
            <NavLink to={routePaths.register}>Đăng ký</NavLink>
          </Button>
        </div>

        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="md:hidden"
          aria-label="Mở menu"
          onClick={() => setIsOpen((current) => !current)}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {isOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "rounded-xl px-3 py-3 text-sm font-bold text-slate-600",
                    isActive ? "bg-slate-100 text-slate-950" : "hover:bg-slate-50",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button asChild variant="outline" className="font-bold">
              <NavLink to={routePaths.login}>Đăng nhập</NavLink>
            </Button>
            <Button asChild className="bg-slate-950 font-bold text-white hover:bg-orange-600">
              <NavLink to={routePaths.register}>Đăng ký</NavLink>
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
