import { Link } from "react-router"
import { useState, useEffect } from "react"
import type { ReactNode } from "react"
import { 
  ArrowRight, 
  BarChart3, 
  Car, 
  CheckCircle2, 
  ClipboardList, 
  Download, 
  MoreVertical, 
  PlayCircle, 
  Users, 
  Wrench,
  Building2,
  Clock,
  Sparkles,
  PartyPopper
} from "lucide-react"

import { routePaths } from "@/app/router/route-paths"
import { BranchList, MetricCard, Panel, PanelTitle, ProviderPageHeader, RevenueBars, tonePill } from "@/pages/provider/components/ProviderPrimitives"
import { ProviderShell } from "@/pages/provider/components/ProviderShell"
import type { ProviderTone } from "@/pages/provider/data"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { toast } from "sonner"

export function ProviderDashboardPage() {
  const [onboardingCompleted, setOnboardingCompleted] = useState(() => {
    return localStorage.getItem("onboarding_completed") === "true"
  })

  const [steps, setSteps] = useState({
    branchesCreated: localStorage.getItem("onboarding_branches_created") === "true",
    vehiclesAdded: localStorage.getItem("onboarding_vehicles_added") === "true",
    operationalHoursSet: localStorage.getItem("onboarding_operational_hours_set") === "true",
  })

  // Synchronize overall completion status if all steps are completed
  useEffect(() => {
    if (steps.branchesCreated && steps.vehiclesAdded && steps.operationalHoursSet && !onboardingCompleted) {
      localStorage.setItem("onboarding_completed", "true")
      setOnboardingCompleted(true)
      toast.success("Chúc mừng! Bạn đã hoàn thành tất cả các bước thiết lập cơ bản. Kích hoạt Dashboard thành công!")
    }
  }, [steps, onboardingCompleted])

  const handleToggleStep = (key: keyof typeof steps) => {
    const newValue = !steps[key]
    localStorage.setItem(`onboarding_${key.replace(/([A-Z])/g, "_$1").toLowerCase()}`, newValue ? "true" : "false")
    setSteps((prev) => ({ ...prev, [key]: newValue }))
    
    if (newValue) {
      toast.success("Nhiệm vụ đã hoàn thành!", {
        description: key === "branchesCreated" 
          ? "Đã liên kết chi nhánh đầu tiên." 
          : key === "vehiclesAdded" 
            ? "Đã đăng ký xe vào đội xe." 
            : "Đã thiết lập khung giờ hoạt động.",
      })
    }
  }

  const handleCompleteAll = () => {
    localStorage.setItem("onboarding_completed", "true")
    // Also mark individual steps as true for consistency
    localStorage.setItem("onboarding_branches_created", "true")
    localStorage.setItem("onboarding_vehicles_added", "true")
    localStorage.setItem("onboarding_operational_hours_set", "true")
    setSteps({
      branchesCreated: true,
      vehiclesAdded: true,
      operationalHoursSet: true,
    })
    setOnboardingCompleted(true)
    toast.success("Chào mừng bạn đến với Dashboard quản trị!")
  }

  const handleResetOnboarding = () => {
    localStorage.setItem("onboarding_completed", "false")
    localStorage.setItem("onboarding_branches_created", "false")
    localStorage.setItem("onboarding_vehicles_added", "false")
    localStorage.setItem("onboarding_operational_hours_set", "false")
    setSteps({
      branchesCreated: false,
      vehiclesAdded: false,
      operationalHoursSet: false,
    })
    setOnboardingCompleted(false)
    toast.info("Đã khôi phục trạng thái Onboarding để demo/thử nghiệm.")
  }

  if (!onboardingCompleted) {
    return (
      <ProviderShell>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Thiết lập tài khoản</h2>
            <p className="text-xs font-semibold text-slate-500 mt-1">Hoàn thành onboarding để kích hoạt đầy đủ tính năng</p>
          </div>
          <Button 
            variant="ghost" 
            onClick={handleCompleteAll}
            className="text-xs font-bold text-slate-500 hover:text-slate-900"
          >
            Bỏ qua thiết lập
          </Button>
        </div>
        
        <OnboardingChecklist 
          steps={steps} 
          onToggleStep={handleToggleStep} 
          onCompleteAll={handleCompleteAll} 
        />
      </ProviderShell>
    )
  }

  return (
    <ProviderShell>
      <ProviderHeaderBlock onResetOnboarding={handleResetOnboarding} />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Tổng doanh thu" value="124.5M ₫" helper="+12.5% so với tuần trước" icon={<BarChart3 />} tone="success" />
        <MetricCard label="Tổng lượt đặt" value="842" helper="+8.2% so với tuần trước" icon={<ClipboardList />} tone="success" />
        <MetricCard label="Tỷ lệ hoạt động xe" value="88%" helper="-2.1% do 12 xe bảo trì" icon={<Car />} tone="danger" />
        <MetricCard label="Khách hàng mới" value="156" helper="+15.3% so với tuần trước" icon={<Users />} tone="success" />
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Panel className="xl:col-span-8">
          <PanelTitle title="Biểu đồ doanh thu" subtitle="Theo tuần / triệu VNĐ" />
          <RevenueBars />
        </Panel>

        <Panel className="xl:col-span-4">
          <PanelTitle title="Hiệu suất cơ sở" action={<MoreVertical className="size-5" />} />
          <BranchList compact />
        </Panel>
      </section>

      <Panel className="mt-4">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <PanelTitle title="Tình trạng đội xe toàn hệ thống" subtitle="Tổng cộng 120 xe đang quản lý" />
          <Button asChild variant="outline" className="h-10 w-fit gap-2 rounded-lg border-[#c4c7c8] bg-[#f1edec] text-[#1c1b1b] hover:bg-[#e5e2e1]">
            <Link to={routePaths.providerVehicles}>
              Quản lý chi tiết
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FleetStatus label="Sẵn sàng hoạt động" value="94 xe" icon={<CheckCircle2 />} tone="success" />
          <FleetStatus label="Đang cho thuê" value="14 xe" icon={<PlayCircle />} tone="info" />
          <FleetStatus label="Bảo trì / sửa chữa" value="12 xe" icon={<Wrench />} tone="danger" note="Cần duyệt 3 hóa đơn sửa chữa" />
        </div>
      </Panel>
    </ProviderShell>
  )
}

function OnboardingChecklist({
  steps,
  onToggleStep,
  onCompleteAll
}: {
  steps: { branchesCreated: boolean; vehiclesAdded: boolean; operationalHoursSet: boolean }
  onToggleStep: (key: keyof typeof steps) => void
  onCompleteAll: () => void
}) {
  const completedCount = Object.values(steps).filter(Boolean).length
  const progressPercent = Math.round((completedCount / 3) * 100)
  
  return (
    <div className="max-w-4xl mx-auto space-y-6 py-2">
      
      {/* Celebration & Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50/70 via-white to-orange-50/20 p-8 shadow-sm">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-orange-200/20 blur-[80px] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold">
              <PartyPopper className="size-4 text-orange-600 animate-bounce" />
              🎉 Tài khoản đã được duyệt!
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Chào mừng đối tác RCField
            </h1>
            <p className="text-slate-600 max-w-xl text-sm leading-relaxed">
              Gói dùng thử <strong className="text-orange-700 font-extrabold">30 ngày</strong> đang chạy. Hãy hoàn thành các bước hướng dẫn thiết lập bên dưới để bắt đầu quản lý.
            </p>
          </div>
          
          <div className="flex flex-col items-center justify-center bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm min-w-[160px] self-start md:self-center">
            <span className="text-3xl font-black text-slate-900">{progressPercent}%</span>
            <span className="text-xs font-bold text-slate-500 mt-1">TIẾN TRÌNH THIẾT LẬP</span>
            <div className="w-28 h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
              <div 
                className="h-full bg-orange-500 transition-all duration-500 rounded-full animate-pulse" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-base font-bold text-slate-800 px-1">Việc cần làm ngay:</h3>
      </div>

      {/* Steps List */}
      <div className="space-y-4">
        
        {/* Step 1: Cafe/Branch */}
        <div className={cn(
          "group relative flex items-start gap-5 p-6 rounded-xl border transition-all bg-white",
          steps.branchesCreated 
            ? "border-emerald-100 bg-emerald-50/10" 
            : "border-slate-200 hover:border-orange-200 hover:shadow-md"
        )}>
          <button 
            onClick={() => onToggleStep('branchesCreated')}
            className="mt-1 flex items-center justify-center text-slate-300 hover:text-orange-500 transition-colors focus:outline-none"
          >
            {steps.branchesCreated ? (
              <CheckCircle2 className="size-7 text-emerald-600 fill-emerald-50" />
            ) : (
              <div className="size-7 rounded-full border-2 border-slate-300 group-hover:border-orange-500 transition-colors" />
            )}
          </button>
          
          <div className="flex-1 space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className={cn(
                  "text-lg font-bold text-slate-900",
                  steps.branchesCreated && "line-through text-slate-500"
                )}>
                  Tạo chi nhánh đầu tiên
                </h3>
                <Building2 className="size-4.5 text-slate-400" />
              </div>
              <p className="text-slate-500 text-sm mt-1 max-w-2xl">
                Cấu hình thông tin cơ sở RC Cafe của bạn để khách hàng có thể đặt lịch chơi và thuê xe.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                asChild
                className={cn(
                  "h-9 rounded-lg px-4 text-xs font-bold transition-all",
                  steps.branchesCreated 
                    ? "bg-slate-100 text-slate-700 hover:bg-slate-200" 
                    : "bg-slate-950 text-white hover:bg-slate-900 shadow-sm"
                )}
              >
                <Link to={routePaths.providerCafes}>
                  {steps.branchesCreated ? "Quản lý cơ sở" : "Thiết lập cơ sở ngay"}
                  <ArrowRight className="size-3.5 ml-1.5" />
                </Link>
              </Button>
              {!steps.branchesCreated && (
                <button 
                  onClick={() => onToggleStep('branchesCreated')}
                  className="text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline"
                >
                  Đánh dấu hoàn thành
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Step 2: Add vehicles */}
        <div className={cn(
          "group relative flex items-start gap-5 p-6 rounded-xl border transition-all bg-white",
          steps.vehiclesAdded 
            ? "border-emerald-100 bg-emerald-50/10" 
            : "border-slate-200 hover:border-orange-200 hover:shadow-md"
        )}>
          <button 
            onClick={() => onToggleStep('vehiclesAdded')}
            className="mt-1 flex items-center justify-center text-slate-300 hover:text-orange-500 transition-colors focus:outline-none"
          >
            {steps.vehiclesAdded ? (
              <CheckCircle2 className="size-7 text-emerald-600 fill-emerald-50" />
            ) : (
              <div className="size-7 rounded-full border-2 border-slate-300 group-hover:border-orange-500 transition-colors" />
            )}
          </button>
          
          <div className="flex-1 space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className={cn(
                  "text-lg font-bold text-slate-900",
                  steps.vehiclesAdded && "line-through text-slate-500"
                )}>
                  Thêm xe vào fleet (đội xe)
                </h3>
                <Car className="size-4.5 text-slate-400" />
              </div>
              <p className="text-slate-500 text-sm mt-1 max-w-2xl">
                Khai báo danh mục xe RC cho thuê có sẵn tại cơ sở để khách hàng chọn khi làm booking.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                asChild
                className={cn(
                  "h-9 rounded-lg px-4 text-xs font-bold transition-all",
                  steps.vehiclesAdded 
                    ? "bg-slate-100 text-slate-700 hover:bg-slate-200" 
                    : "bg-slate-950 text-white hover:bg-slate-900 shadow-sm"
                )}
              >
                <Link to={routePaths.providerVehicles}>
                  {steps.vehiclesAdded ? "Quản lý đội xe" : "Đăng ký xe mới"}
                  <ArrowRight className="size-3.5 ml-1.5" />
                </Link>
              </Button>
              {!steps.vehiclesAdded && (
                <button 
                  onClick={() => onToggleStep('vehiclesAdded')}
                  className="text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline"
                >
                  Đánh dấu hoàn thành
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Step 3: Operating Hours */}
        <div className={cn(
          "group relative flex items-start gap-5 p-6 rounded-xl border transition-all bg-white",
          steps.operationalHoursSet 
            ? "border-emerald-100 bg-emerald-50/10" 
            : "border-slate-200 hover:border-orange-200 hover:shadow-md"
        )}>
          <button 
            onClick={() => onToggleStep('operationalHoursSet')}
            className="mt-1 flex items-center justify-center text-slate-300 hover:text-orange-500 transition-colors focus:outline-none"
          >
            {steps.operationalHoursSet ? (
              <CheckCircle2 className="size-7 text-emerald-600 fill-emerald-50" />
            ) : (
              <div className="size-7 rounded-full border-2 border-slate-300 group-hover:border-orange-500 transition-colors" />
            )}
          </button>
          
          <div className="flex-1 space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className={cn(
                  "text-lg font-bold text-slate-900",
                  steps.operationalHoursSet && "line-through text-slate-500"
                )}>
                  Cài đặt giờ hoạt động
                </h3>
                <Clock className="size-4.5 text-slate-400" />
              </div>
              <p className="text-slate-500 text-sm mt-1 max-w-2xl">
                Cài đặt khung giờ làm việc mở cửa và đóng cửa hàng ngày tại cơ sở của bạn.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                asChild
                className={cn(
                  "h-9 rounded-lg px-4 text-xs font-bold transition-all",
                  steps.operationalHoursSet 
                    ? "bg-slate-100 text-slate-700 hover:bg-slate-200" 
                    : "bg-slate-950 text-white hover:bg-slate-900 shadow-sm"
                )}
              >
                <Link to={routePaths.providerCafes}>
                  {steps.operationalHoursSet ? "Quản lý khung giờ" : "Thiết lập giờ mở cửa"}
                  <ArrowRight className="size-3.5 ml-1.5" />
                </Link>
              </Button>
              {!steps.operationalHoursSet && (
                <button 
                  onClick={() => onToggleStep('operationalHoursSet')}
                  className="text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline"
                >
                  Đánh dấu hoàn thành
                </button>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Bypass Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-xl border border-slate-200/80 bg-slate-50/50">
        <span className="text-xs text-slate-500 font-medium max-w-md">
          <strong>Mẹo:</strong> Sau khi cấu hình, bạn có thể thiết lập chatbot Messenger và các gói ưu đãi dịch vụ của riêng bạn.
        </span>
        <div className="flex gap-3">
          <Button 
            variant="ghost" 
            onClick={onCompleteAll}
            className="h-10 text-xs font-bold text-slate-600 hover:text-slate-950 hover:bg-slate-100"
          >
            Bỏ qua thiết lập để xem Dashboard chính
          </Button>
          
          {completedCount === 3 && (
            <Button 
              onClick={onCompleteAll}
              className="h-10 px-5 text-xs font-bold bg-orange-600 text-white hover:bg-orange-700 shadow-md gap-2"
            >
              Kích Hoạt Dashboard
              <Sparkles className="size-4 fill-white animate-spin-slow" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function ProviderHeaderBlock({ onResetOnboarding }: { onResetOnboarding: () => void }) {
  return (
    <ProviderPageHeader
      title="Tổng quan hệ thống"
      description="Dữ liệu cập nhật hôm nay, 24 Thg 10 2024"
      actions={
        <>
        <Button 
          variant="outline" 
          onClick={onResetOnboarding}
          className="h-10 gap-2 rounded-lg border-orange-200 bg-orange-50/30 text-orange-700 hover:bg-orange-100/60 hover:text-orange-800"
        >
          Xem Hướng Dẫn Setup
        </Button>
        <Button variant="outline" className="h-10 rounded-lg border-[#c4c7c8] bg-[#f1edec] text-[#1c1b1b] hover:bg-[#e5e2e1]">
          Tháng này
        </Button>
        <Button className="h-10 gap-2 rounded-lg bg-[#1c1b1b] text-white hover:bg-[#313030]">
          <Download className="size-5" />
          Xuất báo cáo
        </Button>
        </>
      }
    />
  )
}

function FleetStatus({ label, value, icon, tone, note }: { label: string; value: string; icon: ReactNode; tone: ProviderTone; note?: string }) {
  return (
    <div className="rounded-lg border border-[#e5e2e1] bg-[#fcf8f8] p-4">
      <div className="mb-4 flex items-center gap-3">
        <div className={cn("flex size-9 items-center justify-center rounded-full [&_svg]:size-5", tonePill(tone))}>{icon}</div>
        <span className="text-sm font-semibold text-[#1c1b1b]">{label}</span>
      </div>
      <div className="text-3xl font-semibold tracking-tight text-[#1c1b1b]">{value}</div>
      {note ? <div className="mt-2 text-xs font-semibold text-red-600">{note}</div> : null}
    </div>
  )
}
