import { useState } from "react"
import { CreditCard, DollarSign, ShieldAlert, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { AdminShell } from "@/pages/admin/components/AdminShell"
import {
  AdminHeader,
  AdminPanel,
  AdminPanelTitle,
  AdminSearchBar,
  AdminTable,
  PaymentStatusBadge,
} from "@/pages/admin/components/AdminPrimitives"
import { mockAdminPayments as initialPayments } from "@/shared/data/admin-mock-data"
import type { AdminPayment } from "@/shared/data/admin-mock-data"
import { Button } from "@/shared/ui/button"

export function AdminPaymentsPage() {
  const [payments, setPayments] = useState<AdminPayment[]>(initialPayments)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("ALL")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")

  const handleApprovePayment = (paymentId: string) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === paymentId ? { ...p, status: "SUCCESS" } : p))
    )
    toast.success(`Đã xác nhận thanh toán thành công cho mã GD ${paymentId}!`)
  }

  // Calculate Metrics
  const totalRevenue = payments
    .filter((p) => p.status === "SUCCESS")
    .reduce((sum, p) => sum + p.amount, 0)

  const saasRevenue = payments
    .filter((p) => p.status === "SUCCESS" && p.type === "SAAS_SUBSCRIPTION")
    .reduce((sum, p) => sum + p.amount, 0)

  const commissionRevenue = payments
    .filter((p) => p.status === "SUCCESS" && p.type === "PLATFORM_COMMISSION")
    .reduce((sum, p) => sum + p.amount, 0)

  const pendingRevenue = payments
    .filter((p) => p.status === "PENDING")
    .reduce((sum, p) => sum + p.amount, 0)

  // Filter Payments
  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.cafeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "ALL" || p.type === typeFilter
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  // Table Setup
  const columns = ["Mã giao dịch", "Đối tác / Sân chơi", "Loại", "Số tiền", "Phương thức", "Ngày tạo", "Mô tả", "Trạng thái", "Hành động"]

  const rows = filteredPayments.map((p) => [
    <span key={p.id} className="font-mono text-xs text-[#747878]">{p.id}</span>,
    <span key={`${p.id}-cafe`} className="font-bold text-[#1c1b1b]">{p.cafeName}</span>,
    <span key={`${p.id}-type`} className={`text-xs font-bold ${p.type === "SAAS_SUBSCRIPTION" ? "text-purple-700" : "text-blue-700"}`}>
      {p.type === "SAAS_SUBSCRIPTION" ? "Gói SaaS định kỳ" : "15% Hoa hồng sân"}
    </span>,
    <span key={`${p.id}-amount`} className="font-mono font-extrabold text-sm text-[#1c1b1b]">
      {p.amount.toLocaleString()} ₫
    </span>,
    <span key={`${p.id}-method`} className="text-xs font-semibold text-[#444748]">{p.paymentMethod}</span>,
    <span key={`${p.id}-date`} className="font-mono text-xs text-[#747878]">{p.date}</span>,
    <span key={`${p.id}-desc`} className="text-xs font-semibold text-[#5d5f5f] block max-w-xs truncate" title={p.description}>
      {p.description}
    </span>,
    <PaymentStatusBadge key={`${p.id}-status`} status={p.status} />,
    <div key={`${p.id}-actions`}>
      {p.status === "PENDING" ? (
        <Button
          size="sm"
          onClick={() => handleApprovePayment(p.id)}
          className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-md shadow-none px-2.5"
        >
          Xác nhận thu
        </Button>
      ) : (
        <span className="text-xs font-bold text-[#747878] italic">Hoàn tất</span>
      )}
    </div>
  ])

  return (
    <AdminShell>
      <AdminHeader
        title="Thanh toán SaaS & Đối soát"
        description="Đối soát hóa đơn định kỳ các chủ sân và dòng tiền 15% hoa hồng thu phí từ các đơn booking thành công."
      />

      {/* Financial Metric Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Platform Revenue */}
        <div className="rounded-xl border border-[#e5e2e1] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#747878]">Tổng Doanh thu</span>
            <DollarSign className="size-5 text-orange-600" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-[#1c1b1b]">{totalRevenue.toLocaleString()} ₫</div>
            <p className="text-[10px] font-semibold text-emerald-600 mt-1">Dòng tiền thực thu đã hoàn tất</p>
          </div>
        </div>

        {/* SaaS Subscriptions */}
        <div className="rounded-xl border border-[#e5e2e1] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#747878]">Đăng ký SaaS</span>
            <CreditCard className="size-5 text-purple-600" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-[#1c1b1b]">{saasRevenue.toLocaleString()} ₫</div>
            <p className="text-[10px] font-semibold text-[#747878] mt-1">Từ các gói kích hoạt đối tác</p>
          </div>
        </div>

        {/* Platform Booking commission */}
        <div className="rounded-xl border border-[#e5e2e1] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#747878]">15% Hoa hồng Booking</span>
            <Sparkles className="size-5 text-blue-600" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-[#1c1b1b]">{commissionRevenue.toLocaleString()} ₫</div>
            <p className="text-[10px] font-semibold text-[#747878] mt-1">Ledger tích lũy từ các phiên thuê</p>
          </div>
        </div>

        {/* Pending Settlements */}
        <div className="rounded-xl border border-[#e5e2e1] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#747878]">Đang chờ duyệt</span>
            <ShieldAlert className="size-5 text-amber-500" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-[#1c1b1b]">{pendingRevenue.toLocaleString()} ₫</div>
            <p className="text-[10px] font-semibold text-amber-600 mt-1">Hóa đơn đăng ký/nâng cấp gói</p>
          </div>
        </div>
      </section>

      {/* Ledger Tables */}
      <AdminPanel className="mt-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <AdminSearchBar
            placeholder="Tìm theo ID giao dịch, đối tác, mô tả..."
            value={searchTerm}
            onChange={setSearchTerm}
          />

          <div className="flex flex-wrap gap-2.5">
            {/* Type filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#747878]">Loại doanh thu:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-9 rounded-lg border border-[#e5e2e1] bg-white px-2.5 text-xs font-bold text-[#1c1b1b] outline-none focus:border-orange-500"
              >
                <option value="ALL">Tất cả loại</option>
                <option value="SAAS_SUBSCRIPTION">Thuê bao gói SaaS</option>
                <option value="PLATFORM_COMMISSION">15% Phí hoa hồng</option>
              </select>
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#747878]">Giao dịch:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 rounded-lg border border-[#e5e2e1] bg-white px-2.5 text-xs font-bold text-[#1c1b1b] outline-none focus:border-orange-500"
              >
                <option value="ALL">Tất cả</option>
                <option value="SUCCESS">Thành công</option>
                <option value="PENDING">Đang chờ thu</option>
                <option value="FAILED">Thất bại</option>
              </select>
            </div>
          </div>
        </div>

        <AdminPanelTitle
          title={`Sổ cái giao dịch nền tảng (${filteredPayments.length})`}
          subtitle="Các bản ghi tài chính được đồng bộ từ luồng Booking của khách hàng và cổng SaaS."
        />

        <AdminTable columns={columns} rows={rows} />
      </AdminPanel>
    </AdminShell>
  )
}
