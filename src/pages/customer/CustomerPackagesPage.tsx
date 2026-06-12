import { useState } from "react"
import { Link } from "react-router"
import {
  BadgePercent,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  Layers,
  Loader2,
} from "lucide-react"
import { useMyPackages, usePackageUsageHistory } from "@/features/customer-packages/hooks/use-customer-packages"
import type { MyPackageItem } from "@/features/customer-packages/api/customer-package.api"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card"
import { Skeleton } from "@/shared/ui/skeleton"
import { formatCurrency } from "@/shared/lib/format"
import { CustomerSubNav } from "./components/CustomerSubNav"

export function CustomerPackagesPage() {
  const { data: packages = [], isLoading } = useMyPackages()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6 md:p-12 relative">
      <div className="absolute top-0 right-[10%] w-[350px] h-[350px] rounded-full bg-orange-400/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[350px] h-[350px] rounded-full bg-indigo-400/10 blur-[100px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-6 relative z-10">
        <div>
          <Link
            to="/customer/bookings"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-sm hover:bg-slate-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Quay lại
          </Link>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
              <BadgePercent className="h-4 w-4 text-orange-500" />
              Tài khoản & Hội viên
            </div>
            <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight">Gói Của Bạn</h1>
          </div>
        </div>

        <CustomerSubNav activeTab="packages" />

        {/* Owned packages */}
        <div className="space-y-4">
          <h2 className="text-base font-extrabold text-slate-950 uppercase tracking-wider flex items-center gap-2">
            <Layers className="h-4 w-4 text-slate-400" />
            Gói Đang Sở Hữu
          </h2>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="h-1.5 bg-slate-100" />
                  <CardHeader><Skeleton className="h-5 w-48" /></CardHeader>
                  <CardContent className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-2 w-full rounded-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : packages.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {packages.map((pkg) => (
                <OwnedPackageCard
                  key={pkg.id}
                  pkg={pkg}
                  showUsage={expandedId === pkg.id}
                  onToggleUsage={() =>
                    setExpandedId(expandedId === pkg.id ? null : pkg.id)
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* CTA to discover more */}
        <div className="rounded-2xl border border-dashed border-orange-300 bg-orange-50/60 p-6 text-center space-y-3">
          <Compass className="h-8 w-8 text-orange-500 mx-auto" />
          <p className="text-sm font-bold text-slate-700">
            Muốn mua thêm gói? Truy cập trang cơ sở để xem các gói slot được cung cấp.
          </p>
          <Button asChild className="bg-slate-950 hover:bg-orange-600 text-white font-bold text-xs h-9 rounded-xl">
            <Link to="/cafes">
              Khám phá cơ sở <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

function OwnedPackageCard({
  pkg,
  showUsage,
  onToggleUsage,
}: {
  pkg: MyPackageItem
  showUsage: boolean
  onToggleUsage: () => void
}) {
  const { data: usage = [], isLoading: usageLoading } = usePackageUsageHistory(
    showUsage ? pkg.id : undefined,
  )

  const usedSlots = pkg.slots_total - pkg.slots_remaining
  const pct = pkg.slots_total > 0 ? (usedSlots / pkg.slots_total) * 100 : 0
  const isActive = pkg.status === "ACTIVE"
  const expiresAt = new Date(pkg.expires_at).toLocaleDateString("vi-VN")

  return (
    <Card className="border-slate-200/80 shadow-sm relative overflow-hidden bg-white hover:shadow-md transition-all flex flex-col">
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${isActive ? "bg-orange-500" : "bg-slate-300"}`} />

      <CardHeader className="flex flex-row items-start justify-between pb-3">
        <div className="min-w-0">
          <CardTitle className="text-base font-extrabold text-slate-950 leading-tight">
            {pkg.package_name}
          </CardTitle>
          <p className="text-[9px] font-bold text-slate-400 mt-1 truncate">{pkg.cafe_name}</p>
        </div>
        <StatusBadge status={pkg.status} />
      </CardHeader>

      <CardContent className="space-y-4 text-xs font-semibold text-slate-700 flex-grow">
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] font-bold text-slate-600">
            <span>Slots đã dùng</span>
            <span className="text-slate-950">{usedSlots} / {pkg.slots_total} lượt</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isActive ? "bg-orange-500" : "bg-slate-300"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500 font-bold text-right">
            {pkg.slots_remaining} lượt còn lại
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl text-[11px] font-bold text-slate-600">
          <div>
            <span className="block text-[9px] text-slate-400 uppercase">Giá mua</span>
            <span className="text-slate-900">{formatCurrency(pkg.purchased_price)}</span>
          </div>
          <div>
            <span className="block text-[9px] text-slate-400 uppercase">Hết hạn</span>
            <span className="text-slate-900 flex items-center gap-1">
              <Clock className="h-3 w-3 text-slate-400" />
              {expiresAt}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t border-slate-50 flex-col bg-slate-50/50">
        <Button
          variant="ghost"
          className="w-full h-8 text-xs font-bold text-orange-600 hover:text-orange-700 hover:bg-orange-50"
          onClick={onToggleUsage}
        >
          {showUsage ? "Ẩn lịch sử" : "Xem lịch sử dùng"}
        </Button>

        {showUsage && (
          <div className="w-full mt-2 border-t border-orange-100 pt-3 space-y-2">
            {usageLoading ? (
              <div className="flex justify-center py-3">
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              </div>
            ) : usage.length === 0 ? (
              <p className="text-[11px] text-slate-400 text-center py-2 font-semibold">
                Chưa sử dụng lượt nào
              </p>
            ) : (
              usage.map((u) => (
                <div
                  key={u.booking_id}
                  className="flex justify-between items-center text-[11px] font-semibold text-slate-600 bg-white rounded-lg px-3 py-2 border border-slate-100"
                >
                  <div>
                    <p className="text-slate-900">
                      {new Date(u.slot_start).toLocaleDateString("vi-VN")}
                    </p>
                    <p className="text-slate-400 text-[10px]">
                      {new Date(u.slot_start).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                      {" – "}
                      {new Date(u.slot_end).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    -{u.slots_used} slot
                  </Badge>
                </div>
              ))
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  )
}

function StatusBadge({ status }: { status: MyPackageItem["status"] }) {
  if (status === "ACTIVE")
    return (
      <Badge className="shrink-0 bg-emerald-500/10 text-emerald-700 border-none font-bold text-[10px]">
        Hoạt động
      </Badge>
    )
  if (status === "EXHAUSTED")
    return (
      <Badge className="shrink-0 bg-amber-500/10 text-amber-700 border-none font-bold text-[10px]">
        Hết slot
      </Badge>
    )
  return (
    <Badge className="shrink-0 bg-slate-200 text-slate-600 border-none font-bold text-[10px]">
      Hết hạn
    </Badge>
  )
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center space-y-3">
      <Layers className="h-8 w-8 text-slate-300 mx-auto" />
      <p className="text-sm font-bold text-slate-500">Bạn chưa sở hữu gói nào.</p>
      <p className="text-xs text-slate-400">
        Truy cập trang cơ sở và mua gói slot để tiết kiệm phí sân.
      </p>
      <Button asChild variant="outline" className="mt-2 font-bold text-xs">
        <Link to="/cafes">Khám phá cơ sở</Link>
      </Button>
    </div>
  )
}
