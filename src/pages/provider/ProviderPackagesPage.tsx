import { Check, Download, Edit, Plus, Search, Trash2, TrendingUp } from "lucide-react"

import { ProviderPageHeader } from "@/pages/provider/components/ProviderPrimitives"
import { ProviderShell } from "@/pages/provider/components/ProviderShell"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"

const servicePackages = [
  {
    name: "Gói Rookie",
    code: "PKG-R01",
    duration: "1 Giờ",
    price: "150,000đ",
    unit: "~150k/giờ",
    benefits: ["Truy cập track cơ bản", "1 Bàn Pit chung"],
    active: true,
    popular: false,
  },
  {
    name: "Gói Pro",
    code: "PKG-P02",
    duration: "2 Giờ",
    price: "280,000đ",
    unit: "~140k/giờ",
    benefits: ["Truy cập track ưu tiên", "1 Bàn Pit riêng biệt", "Hệ thống tính giờ Mylaps", "Nguồn điện AC tại Pit"],
    active: true,
    popular: true,
  },
  {
    name: "Gói VIP (Half-Day)",
    code: "PKG-V04",
    duration: "4 Giờ",
    price: "500,000đ",
    unit: "~125k/giờ",
    benefits: ["Toàn bộ tiện ích Gói Pro", "1 Đồ uống miễn phí", "Hỗ trợ kỹ thuật cơ bản"],
    active: true,
    popular: false,
  },
  {
    name: "Gói Sinh Viên",
    code: "PKG-S01",
    duration: "1.5 Giờ",
    price: "100,000đ",
    unit: "Cần thẻ HSSV",
    benefits: ["Truy cập track khung giờ off-peak"],
    active: false,
    popular: false,
  },
]

export function ProviderPackagesPage() {
  return (
    <ProviderShell contentClassName="py-8 md:py-8">
      <ProviderPageHeader
        title="Quản lý Gói & Bảng giá"
        description="Cấu hình các gói dịch vụ thuê sân, thiết lập giá cả và các tiện ích đi kèm cho khách hàng."
      />

      <section className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
        <StatCard label="TỔNG SỐ GÓI">
          <div className="flex items-end gap-3">
            <span className="text-[40px] font-extrabold leading-none text-[#1c1b1b]">4</span>
            <span className="mb-1 text-sm font-bold text-[#747878]">Đang hoạt động</span>
          </div>
        </StatCard>
        <StatCard label="GÓI PHỔ BIẾN NHẤT">
          <div className="flex flex-col gap-1">
            <span className="mt-2 text-2xl font-extrabold leading-none text-[#1c1b1b]">Gói Pro (2 Giờ)</span>
            <span className="mb-1 flex items-center text-sm font-bold text-[#5d5f5f]">
              <TrendingUp className="mr-1 size-4 animate-pulse" />
              Chiếm 65% lượt đặt
            </span>
          </div>
        </StatCard>
        <StatCard label="TRẠNG THÁI HỆ THỐNG">
          <div className="mt-4 flex items-center gap-3">
            <div className="size-3 animate-pulse rounded-full bg-[#10b981]" />
            <span className="text-base font-bold text-[#1c1b1b]">Bảng giá đang đồng bộ</span>
          </div>
        </StatCard>
      </section>

      <section className="mt-16 flex flex-col overflow-hidden rounded-xl border border-[#c4c7c8] bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-[#e5e2e1] bg-white p-6 md:flex-row md:items-center">
          <h3 className="text-lg font-bold leading-tight tracking-tight text-[#1c1b1b]">Danh sách Gói dịch vụ</h3>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-[#c4c7c8]" />
              <input
                className="w-full rounded border border-[#c4c7c8] bg-[#f1edec] py-2 pl-10 pr-4 text-sm transition-all focus:border-[#5d5f5f] focus:outline-none focus:ring-1 focus:ring-[#5d5f5f] md:w-64"
                placeholder="Tìm kiếm gói..."
                type="text"
              />
            </div>
            <Button variant="outline" className="h-10 gap-2 rounded border-[#c4c7c8] bg-[#fcf8f8] px-4 text-sm font-bold text-[#1c1b1b] shadow-sm hover:bg-[#e5e2e1]">
              <Download className="size-[18px]" />
              Xuất báo cáo
            </Button>
            <Button className="h-10 gap-2 rounded bg-[#1c1b1b] px-5 text-sm font-bold text-white shadow-sm hover:bg-[#313030]">
              <Plus className="size-[18px]" />
              Tạo Gói Mới
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#e5e2e1] bg-[#fcf8f8]/60">
                {["TÊN GÓI", "THỜI LƯỢNG", "ĐƠN GIÁ", "TIỆN ÍCH BAO GỒM", "TRẠNG THÁI", "THAO TÁC"].map((heading, index) => (
                  <th key={heading} className={cn("px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#747878]", index === 3 && "min-w-[250px]", index === 4 && "text-center", index === 5 && "text-right")}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e2e1] text-sm text-[#1c1b1b]">
              {servicePackages.map((item) => (
                <tr key={item.code} className={cn("group transition-colors hover:bg-[#fcf8f8]", !item.active && "opacity-60")}>
                  <td className="px-6 py-4 align-top">
                    <div className="mb-1 flex items-center gap-2 text-base font-extrabold">
                      {item.name}
                      {item.popular ? <span className="rounded-full bg-[#fef3c7] px-2 py-0.5 text-[10px] font-extrabold uppercase text-[#92400e]">Phổ biến</span> : null}
                    </div>
                    <span className="inline-block text-xs font-bold text-[#747878]">Mã: {item.code}</span>
                  </td>
                  <td className="px-6 py-4 align-top font-bold">{item.duration}</td>
                  <td className="px-6 py-4 align-top">
                    <div className="text-base font-extrabold">{item.price}</div>
                    <span className="text-xs font-semibold text-[#747878]">{item.unit}</span>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <ul className="flex flex-col gap-1 text-sm font-semibold text-[#5d5f5f]">
                      {item.benefits.map((benefit) => (
                        <li key={benefit} className="flex items-start">
                          <Check className={cn("mr-1 mt-0.5 size-4 shrink-0", item.active ? "text-[#10b981]" : "text-[#747878]")} />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-6 py-4 text-center align-top">
                    <ToggleSwitch checked={item.active} />
                  </td>
                  <td className="px-6 py-4 text-right align-top">
                    <button className="rounded p-1 text-[#747878] transition-colors hover:bg-[#e5e2e1] hover:text-[#1c1b1b]" title="Chỉnh sửa">
                      <Edit className="size-5" />
                    </button>
                    <button className="ml-1 rounded p-1 text-[#747878] transition-colors hover:bg-[#ffdad6] hover:text-[#ba1a1a]" title="Xóa">
                      <Trash2 className="size-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-[#e5e2e1] bg-white p-4">
          <span className="text-sm font-bold text-[#5d5f5f]">Hiển thị 1 - 4 của 4 gói</span>
          <div className="flex gap-1">
            <button className="cursor-not-allowed rounded border border-[#c4c7c8] px-3 py-1 text-sm font-bold text-[#747878] opacity-50">Trước</button>
            <button className="rounded border border-[#c4c7c8] bg-[#1c1b1b] px-3 py-1 text-sm font-bold text-white">1</button>
            <button className="cursor-not-allowed rounded border border-[#c4c7c8] px-3 py-1 text-sm font-bold text-[#747878] opacity-50">Sau</button>
          </div>
        </div>
      </section>
    </ProviderShell>
  )
}

function StatCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-[#c4c7c8] bg-[#fcf8f8] p-6 shadow-sm">
      <div className="absolute -right-4 -top-4 size-24 rounded-bl-full bg-[#ebe7e7] opacity-50 transition-transform group-hover:scale-110" />
      <div className="relative z-10">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#747878]">{label}</p>
        {children}
      </div>
    </div>
  )
}

function ToggleSwitch({ checked }: { checked: boolean }) {
  return (
    <label className="relative inline-flex cursor-pointer items-center">
      <input checked={checked} className="peer sr-only" readOnly type="checkbox" />
      <div className="h-6 w-11 rounded-full border border-[#c4c7c8] bg-[#e5e2e1] after:absolute after:left-[2px] after:top-[2px] after:size-5 after:rounded-full after:border after:border-[#c4c7c8] after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#1c1b1b] peer-checked:after:translate-x-full peer-checked:after:border-white" />
    </label>
  )
}
