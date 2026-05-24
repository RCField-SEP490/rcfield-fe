import { useState } from "react"
import { useNavigate } from "react-router"
import { 
  mockCustomerPackages, 
  type MockPackage 
} from "@/shared/data/user-mock-data"
import { 
  Sparkles, 
  Clock, 
  Layers, 
  BadgePercent,
  CheckCircle2,
  Gift,
  ChevronLeft
} from "lucide-react"

import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { toast } from "sonner"
import { CustomerSubNav } from "./components/CustomerSubNav"

export function CustomerPackagesPage() {
  const navigate = useNavigate()
  const packages = mockCustomerPackages
  const [showBenefits, setShowBenefits] = useState<string | null>(null)

  // Format currency helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val)
  }

  // Get status color helper
  const getStatusBadge = (status: MockPackage["status"]) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-700 border-none font-bold text-[10px]">
            Đang hoạt động
          </Badge>
        )
      case "expired":
        return (
          <Badge className="bg-slate-200 text-slate-600 border-none font-bold text-[10px]">
            Hết hạn
          </Badge>
        )
    }
  }

  // Handle mock buy package
  const handleBuyMockPackage = (tierName: string) => {
    toast.success("Mua gói hội viên giả lập thành công!", {
      description: `Gói ${tierName} đã được kích hoạt ảo vào hệ thống tài khoản của bạn!`
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6 md:p-12 relative">
      
      {/* Decorative glows */}
      <div className="absolute top-0 right-[10%] w-[350px] h-[350px] rounded-full bg-orange-400/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[350px] h-[350px] rounded-full bg-indigo-400/10 blur-[100px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-6 relative z-10">
        
        {/* Back Button */}
        <div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-sm hover:bg-slate-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Quay lại trang trước
          </button>
        </div>

        {/* Header Ribbon */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
              <BadgePercent className="h-4 w-4 text-orange-500" />
              Tài khoản & Hội viên
            </div>
            <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight">
              Gói Hội Viên Của Bạn
            </h1>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm flex items-center gap-2">
            <Gift className="h-5 w-5 text-orange-600 animate-bounce" />
            <div className="text-[10px] font-bold text-slate-600">
              Bạn có <strong className="text-orange-600">3 ưu đãi nước</strong> chưa đổi!
            </div>
          </div>
        </div>

        {/* SUB NAVIGATION BAR FOR CUSTOMER SPACE */}
        <CustomerSubNav activeTab="packages" />

        {/* SECTION 1: USER ACTIVE PACKAGES */}
        <div className="space-y-4">
          <h2 className="text-base font-extrabold text-slate-950 uppercase tracking-wider flex items-center gap-2">
            <Layers className="h-4 w-4 text-slate-400" />
            Gói Đang Sở Hữu
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {packages.map((pkg) => (
              <Card key={pkg.packageId} className="border-slate-200/80 shadow-sm relative overflow-hidden bg-white hover:shadow-md transition-all flex flex-col">
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${pkg.status === 'active' ? 'bg-orange-500' : 'bg-slate-300'}`} />
                
                <CardHeader className="flex flex-row items-start justify-between pb-3">
                  <div>
                    <CardTitle className="text-base font-extrabold text-slate-950 leading-tight">
                      {pkg.name}
                    </CardTitle>
                    <CardDescription className="text-[9px] font-bold text-slate-400 mt-1">MÃ GÓI: {pkg.packageId}</CardDescription>
                  </div>
                  {getStatusBadge(pkg.status)}
                </CardHeader>

                <CardContent className="space-y-4 text-xs font-semibold text-slate-700 flex-grow">
                  
                  {/* Slots Tracker bar */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-[11px] font-bold text-slate-600">
                      <span>Lượt chạy đã dùng (Slots)</span>
                      <span className="text-slate-950">{pkg.usedSlots} / {pkg.totalSlots} lượt</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${pkg.status === 'active' ? 'bg-orange-500' : 'bg-slate-300'}`} 
                        style={{ width: `${(pkg.usedSlots / pkg.totalSlots) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Pricing and Dates */}
                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl text-[11px] font-bold text-slate-600">
                    <div>
                      <span className="block text-[9px] text-slate-400 uppercase">Giá mua</span>
                      <span className="text-slate-900">{formatCurrency(pkg.price)}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 uppercase">Hạn dùng tới</span>
                      <span className="text-slate-900 flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {pkg.expiryDate}
                      </span>
                    </div>
                  </div>

                </CardContent>

                {/* Card footer details toggle */}
                <CardFooter className="pt-3 border-t border-slate-50 justify-between bg-slate-50/50">
                  <span className="text-[10px] text-slate-400 font-bold">Ngày mua: {pkg.purchasedDate}</span>
                  <Button 
                    variant="ghost" 
                    className="h-8 text-xs font-bold text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                    onClick={() => setShowBenefits(showBenefits === pkg.packageId ? null : pkg.packageId)}
                  >
                    {showBenefits === pkg.packageId ? "Ẩn quyền lợi" : "Quyền lợi đính kèm"}
                  </Button>
                </CardFooter>

                {/* Benefits Drawer overlay */}
                {showBenefits === pkg.packageId && (
                  <div className="bg-orange-50/50 p-4 border-t border-orange-100 text-xs font-semibold text-orange-950 space-y-2 animate-in slide-in-from-bottom-2 duration-200">
                    <p className="font-extrabold text-orange-900 text-[10px] uppercase tracking-wider">ĐẶC QUYỀN GÓI HỘI VIÊN:</p>
                    <div className="space-y-1 text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        Giảm 10% toàn bộ đồ uống F&B tại RC Cafe liên kết.
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        Ưu tiên bảo dưỡng kỹ thuật (Inspection) miễn phí 1 lần/tháng.
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        Được đặt trước lịch đua vào giờ cao điểm (19:00 - 21:00 cuối tuần).
                      </div>
                    </div>
                  </div>
                )}

              </Card>
            ))}
          </div>
        </div>

        {/* SECTION 2: DISCOVER POPULAR TIER PACKAGES */}
        <div className="space-y-4 pt-4">
          <div className="space-y-1">
            <h2 className="text-base font-extrabold text-slate-950 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-orange-500 animate-pulse" />
              Khám Phá Gói Hội Viên Phổ Biến
            </h2>
            <p className="text-xs font-semibold text-slate-500">
              Nâng cấp lên các gói thành viên đặc quyền để tối ưu hóa chi phí thuê sân đua và đồ uống.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Gói Drift Đồng (Bronze)",
                price: 450000,
                slots: 5,
                desc: "Thích hợp cho người mới bắt đầu chạy trải nghiệm cuối tuần.",
                color: "from-amber-600 to-amber-700"
              },
              {
                name: "Gói Luyện Tập Bạc (Silver)",
                price: 1200000,
                slots: 15,
                desc: "Hội viên trung cấp chạy đều đặn hàng tuần với ưu đãi 10% nước uống.",
                color: "from-slate-400 to-slate-500"
              },
              {
                name: "Đội Đua Chuyên Nghiệp (Gold)",
                price: 2500000,
                slots: 35,
                desc: "Đặc quyền tối đa dành cho tay đua cự phách, miễn phí nước & bảo dưỡng xe.",
                color: "from-orange-500 to-red-600"
              }
            ].map((tier, idx) => (
              <Card key={idx} className="border-slate-200/80 hover:border-orange-200 shadow-sm hover:shadow-md transition-all flex flex-col bg-white overflow-hidden">
                <div className={`p-4 text-white bg-gradient-to-r ${tier.color} text-center space-y-1`}>
                  <p className="text-sm font-black tracking-tight">{tier.name}</p>
                  <p className="text-xs opacity-90 font-bold">{formatCurrency(tier.price)}</p>
                </div>
                <CardContent className="p-5 flex-grow text-xs font-semibold text-slate-600 space-y-4">
                  <div className="text-center font-black text-slate-950 text-xl py-2 bg-slate-50 rounded-xl">
                    {tier.slots} Lượt chạy sân
                  </div>
                  <p className="text-slate-400 leading-relaxed text-[11px] font-medium text-center">{tier.desc}</p>
                </CardContent>
                <CardFooter className="pt-2 pb-5 px-5">
                  <Button 
                    className="w-full bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs h-10 rounded-xl"
                    onClick={() => handleBuyMockPackage(tier.name)}
                  >
                    Đăng ký gói hội viên
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

      </div>

    </div>
  )
}
