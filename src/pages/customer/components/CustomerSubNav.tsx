import { Link } from "react-router"

export type CustomerTab = "bookings" | "vehicles" | "packages" | "reviews"

interface CustomerSubNavProps {
  activeTab: CustomerTab
}

export function CustomerSubNav({ activeTab }: CustomerSubNavProps) {
  const tabs = [
    { id: "bookings", label: "Lịch đặt sân", path: "/customer/bookings" },
    { id: "vehicles", label: "Đội xe cá nhân", path: "/customer/vehicles" },
    { id: "packages", label: "Gói hội viên", path: "/customer/packages" },
    { id: "reviews", label: "Đánh giá của tôi", path: "/customer/reviews" },
  ] as const

  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-2 border-b border-slate-200/50 text-xs font-bold text-slate-500">
      <Link to="/" className="hover:text-slate-900 shrink-0 transition-colors">
        Trang chủ
      </Link>
      <span className="text-slate-300">/</span>
      
      {tabs.map((tab, idx) => (
        <span key={tab.id} className="flex items-center gap-3">
          {tab.id === activeTab ? (
            <span className="text-slate-900 shrink-0 font-extrabold">{tab.label}</span>
          ) : (
            <Link 
              to={tab.path} 
              className="hover:text-slate-900 shrink-0 transition-colors"
            >
              {tab.label}
            </Link>
          )}
          {idx < tabs.length - 1 && <span className="text-slate-300">/</span>}
        </span>
      ))}
    </div>
  )
}
