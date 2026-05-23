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
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex items-center gap-4">
          <AppLogo />
          <p className="max-w-md text-xs leading-5 text-slate-500">
            Nền tảng tìm kiếm sân RC Cafe, đặt lịch nhanh và vận hành phiên chơi minh bạch.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
          {footerLinks.map((item) => (
            <Link key={item.label} to={item.to} className="hover:text-slate-900">
              {item.label}
            </Link>
          ))}
          <span className="text-slate-300">© 2026</span>
        </div>
      </div>
    </footer>
  )
}
