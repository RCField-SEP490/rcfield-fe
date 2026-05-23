import { Link } from "react-router"
import { routePaths } from "@/app/router/route-paths"
import { AppLogo } from "@/shared/components/AppLogo"

const footerLinks = [
  { label: "Điều khoản", to: "#" },
  { label: "Bảo mật", to: "#" },
  { label: "Liên hệ", to: "#" },
  { label: "Hướng dẫn", to: routePaths.cafes },
]

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="space-y-3">
          <AppLogo className="items-center" />
          <p className="max-w-sm text-sm font-medium leading-6 text-slate-500">
            Nền tảng tìm kiếm sân RC Cafe, đặt lịch nhanh và vận hành phiên chơi minh bạch.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-5 text-sm font-bold text-slate-500">
          {footerLinks.map((item) => (
            <Link key={item.label} to={item.to} className="hover:text-orange-600">
              {item.label}
            </Link>
          ))}
        </div>
        <p className="text-xs font-bold text-slate-400">© 2026 RCField. All rights reserved.</p>
      </div>
    </footer>
  )
}
