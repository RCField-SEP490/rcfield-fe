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
    <header className="sticky top-0 z-50 w-full">
      {/* Backdrop blur container */}
      <div className="mx-auto mt-3 w-[calc(100%-2rem)] max-w-[1440px] rounded-2xl border border-white/20 bg-white/70 px-3 shadow-lg shadow-slate-900/5 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 md:mt-4 md:w-[calc(100%-3rem)] md:px-5">
        <div className="flex h-14 items-center justify-between md:h-15">
          <AppLogo />

          {/* Desktop nav - pill style */}
          <nav className="hidden items-center gap-0.5 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "relative rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition-all duration-200 ease-out",
                    "hover:bg-slate-100 hover:text-slate-900",
                    isActive &&
                      "bg-slate-900 text-white shadow-md shadow-slate-900/20 hover:bg-slate-800 hover:text-white",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Desktop auth buttons */}
          <div className="hidden items-center gap-2 md:flex">
            <Button
              asChild
              variant="ghost"
              className="rounded-xl font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              <NavLink to={routePaths.login}>Đăng nhập</NavLink>
            </Button>
            <Button
              asChild
              className="rounded-xl bg-slate-900 px-5 font-semibold text-white shadow-md shadow-slate-900/20 hover:bg-orange-600 hover:shadow-orange-600/25"
            >
              <NavLink to={routePaths.register}>Đăng ký</NavLink>
            </Button>
          </div>

          {/* Mobile menu toggle */}
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="rounded-xl md:hidden hover:bg-slate-100"
            aria-label="Mở menu"
            onClick={() => setIsOpen((current) => !current)}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile menu panel */}
        {isOpen && (
          <div className="border-t border-slate-200/60 px-1 pb-4 pt-3 animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col gap-0.5">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
                      isActive
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100",
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button asChild variant="outline" className="rounded-xl font-semibold">
                <NavLink to={routePaths.login} onClick={() => setIsOpen(false)}>
                  Đăng nhập
                </NavLink>
              </Button>
              <Button asChild className="rounded-xl bg-slate-900 font-semibold text-white" onClick={() => setIsOpen(false)}>
                <NavLink to={routePaths.register}>Đăng ký</NavLink>
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
