import { Link } from "react-router"
import { routePaths } from "@/app/router/route-paths"
import { AppLogo } from "@/shared/components/AppLogo"

const footerLinks = [
  { label: "Điều khoản", to: "#" },
  { label: "Bảo mật", to: "#" },
  { label: "Đối tác liên kết", to: routePaths.partnerLanding },
  { label: "Liên hệ", to: "#" },
  { label: "Hướng dẫn", to: routePaths.cafes },
]

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200/60 bg-white">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex items-center gap-4">
          <AppLogo />
          <p className="max-w-md text-xs leading-5 text-slate-400">
            Nền tảng tìm kiếm sân RC Cafe, đặt lịch nhanh và vận hành phiên chơi minh bạch.
          </p>
        </div>
        <div className="flex items-center gap-6 text-xs font-medium text-slate-400">
          {footerLinks.map((item) => (
            <Link key={item.label} to={item.to} className="transition-colors hover:text-slate-700">
              {item.label}
            </Link>
          ))}
          <span className="text-slate-300">© 2026 RCField</span>
        </div>
      </div>
    </footer>
  )
}
