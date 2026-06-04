import React, { useState } from "react"
import { Search, Phone, Mail, Shield, Compass, Calendar, Layers, HelpCircle, CheckCircle2, Info } from "lucide-react"
import { useStaffOperations } from "./context/StaffOperationContext"
import {
  StaffHeader,
  StaffCard,
  StaffBadge,
  StaffButton,
} from "./components/StaffUI"

export default function StaffPackagesPage() {
  const { customerPackages } = useStaffOperations()

  // Search query input state
  const [searchQuery, setSearchQuery] = useState("")
  const [searchedCustomer, setSearchedCustomer] = useState<typeof customerPackages[0] | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setHasSearched(true)

    if (!searchQuery.trim()) {
      setSearchedCustomer(null)
      return
    }

    const cleanQuery = searchQuery.trim()
    const found = customerPackages.find(
      (p) => p.phone === cleanQuery || p.email.toLowerCase() === cleanQuery.toLowerCase()
    )
    setSearchedCustomer(found || null)
  }

  // Pre-fill query buttons for easy demo checking
  const handleQuickDemoSearch = (phone: string) => {
    setSearchQuery(phone)
    const found = customerPackages.find((p) => p.phone === phone)
    setSearchedCustomer(found || null)
    setHasSearched(true)
  }

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <StaffHeader
        title="Gói hội viên & Số dư"
        subtitle="Tra cứu nhanh thời hạn thẻ, số dư tài khoản ví và các gói combo của người chơi"
      />

      {/* 2. QUICK DEMO PICKERS */}
      <StaffCard className="p-4 space-y-3">
        <span className="text-[10px] uppercase tracking-wider text-[#6b7280] font-bold flex items-center gap-1.5">
          <HelpCircle className="size-3.5 text-[#ea580c]" />
          Danh sách khách hàng mẫu (Chọn để tra nhanh):
        </span>
        <div className="flex flex-wrap gap-2">
          {customerPackages.map((p) => (
            <button
              key={p.phone}
              onClick={() => handleQuickDemoSearch(p.phone)}
              className="text-[11px] font-bold border border-[#e5e2e1] bg-[#fcf8f8] hover:border-[#ea580c] hover:bg-[#fff3eb] rounded-lg px-3 py-1.5 transition-all text-[#4c4a49]"
            >
              {p.fullName} ({p.phone})
            </button>
          ))}
        </div>
      </StaffCard>

      {/* 3. SEARCH FORM */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-4 flex items-center text-[#6b7280]">
            <Phone className="size-4" />
          </span>
          <input
            type="text"
            placeholder="Nhập chính xác số điện thoại hoặc email thành viên cần tra cứu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[#e5e2e1] bg-white pl-11 pr-4 py-3 text-xs font-semibold text-[#1c1b1b] focus:outline-none focus:ring-1 focus:ring-[#ea580c] focus:border-[#ea580c] shadow-sm"
          />
        </div>
        <StaffButton
          type="submit"
          variant="primary"
          className="uppercase tracking-wider text-xs px-6 shrink-0"
        >
          Tra cứu
        </StaffButton>
      </form>

      {/* 4. RESULTS DISPLAY GRID */}
      {hasSearched && searchedCustomer ? (
        <div className="grid md:grid-cols-3 gap-6 animate-fadeIn">
          {/* CUSTOMER DETAILED CARD */}
          <StaffCard className="p-5 space-y-5 h-fit flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-full bg-[#fff3eb] border border-[#ffdbca] flex items-center justify-center text-[#ea580c] font-bold text-sm">
                  {searchedCustomer.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1c1b1b]">{searchedCustomer.fullName}</h3>
                  <StaffBadge variant="orange" className="mt-1">
                    Thành viên
                  </StaffBadge>
                </div>
              </div>

              <div className="space-y-3 border-t border-[#e5e2e1] pt-4 font-semibold text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#6b7280] flex items-center gap-1.5">
                    <Phone className="size-3.5 text-[#6b7280]" /> SĐT:
                  </span>
                  <span className="text-[#1c1b1b]">{searchedCustomer.phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6b7280] flex items-center gap-1.5">
                    <Mail className="size-3.5 text-[#6b7280]" /> Email:
                  </span>
                  <span className="text-[#1c1b1b] truncate max-w-[140px]" title={searchedCustomer.email}>
                    {searchedCustomer.email}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-[#fffbf9]/80 border border-orange-100 p-4 text-center space-y-1 mt-4">
              <span className="text-[10px] uppercase tracking-wider text-[#6b7280] font-bold block">
                Số dư tài khoản ví
              </span>
              <span className="text-xl font-extrabold text-[#ea580c] block">
                {searchedCustomer.balanceAmount.toLocaleString("vi-VN")} đ
              </span>
              <p className="text-[9px] text-[#6b7280]">Khách hàng dùng thanh toán tại quầy gọi F&B nhanh</p>
            </div>
          </StaffCard>

          {/* ACTIVE PACKAGES AND SUBSCRIPTIONS */}
          <div className="md:col-span-2 space-y-6">
            {/* SUB PLAN */}
            <StaffCard className="p-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1c1b1b] flex items-center gap-1.5">
                <Shield className="size-4 text-[#ea580c]" />
                Thành viên tháng (Subscriptions)
              </h4>

              {searchedCustomer.activeSubscriptions.length > 0 ? (
                <div className="space-y-3">
                  {searchedCustomer.activeSubscriptions.map((sub, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-orange-200 bg-[#fffbf9]/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <h5 className="text-xs font-bold text-[#1c1b1b] flex items-center gap-1">
                          <CheckCircle2 className="size-3.5 text-emerald-600" />
                          {sub.planName}
                        </h5>
                        <p className="text-[10px] text-[#6b7280] font-semibold flex items-center gap-1">
                          <Calendar className="size-3 text-[#6b7280]" />
                          Hạn sử dụng: {new Date(sub.expiresAt).toLocaleDateString("vi-VN")}
                        </p>
                      </div>

                      <div className="rounded-lg bg-white border border-[#e5e2e1] px-3 py-1.5 text-center shrink-0 font-semibold">
                        <span className="text-[9px] text-[#6b7280] uppercase block">Còn lại</span>
                        <span className="text-xs text-[#ea580c] font-bold">
                          {sub.remainingSessions} / {sub.totalSessions} lượt chạy
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[#e5e2e1] p-6 text-center text-xs text-[#6b7280] font-semibold">
                  Chưa đăng ký gói chạy tháng nào.
                </div>
              )}
            </StaffCard>

            {/* COMBOS AND RETAIL PACKAGES */}
            <StaffCard className="p-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1c1b1b] flex items-center gap-1.5">
                <Layers className="size-4 text-[#ea580c]" />
                Gói Combo ca chơi (Combos)
              </h4>

              {searchedCustomer.purchasedPackages.length > 0 ? (
                <div className="space-y-3">
                  {searchedCustomer.purchasedPackages.map((pkg, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-[#e5e2e1] bg-[#fcf8f8] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <h5 className="text-xs font-bold text-[#1c1b1b]">{pkg.packageName}</h5>
                        <p className="text-[10px] text-[#6b7280] font-semibold flex items-center gap-1">
                          <Compass className="size-3 text-[#6b7280]" />
                          Ngày kích hoạt: {new Date(pkg.purchasedAt).toLocaleDateString("vi-VN")}
                        </p>
                      </div>

                      <div className="rounded-lg bg-white border border-[#e5e2e1] px-3 py-1.5 text-center shrink-0 font-semibold">
                        <span className="text-[9px] text-[#6b7280] uppercase block">Số ca còn lại</span>
                        <span className="text-xs text-[#1c1b1b] font-bold">
                          {pkg.remainingSlots} / {pkg.totalSlots} ca
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[#e5e2e1] p-6 text-center text-xs text-[#6b7280] font-semibold">
                  Không có gói combo lượt chạy nào hoạt động.
                </div>
              )}
            </StaffCard>
          </div>
        </div>
      ) : hasSearched ? (
        <StaffCard className="py-12 text-center text-[#6b7280] space-y-1 border-dashed">
          <Info className="size-8 text-red-500 mx-auto" />
          <p className="text-sm font-bold text-[#1c1b1b]">Không tìm thấy khách hàng!</p>
          <p className="text-xs">Vui lòng kiểm tra lại số điện thoại hoặc email mẫu được cung cấp.</p>
        </StaffCard>
      ) : (
        <StaffCard className="py-20 text-center text-[#6b7280] space-y-1 border-dashed">
          <Search className="size-10 text-[#6b7280] mx-auto" />
          <p className="text-sm font-bold text-[#1c1b1b]">Nhập thông tin để tra cứu</p>
          <p className="text-xs">Thông tin số dư ví và hạn dùng gói của khách sẽ hiển thị tại đây.</p>
        </StaffCard>
      )}
    </div>
  )
}
