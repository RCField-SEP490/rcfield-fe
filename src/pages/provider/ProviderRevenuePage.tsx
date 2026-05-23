import { Bell, Car, Download, Filter, Landmark, Wallet, MapPinned } from "lucide-react"

import { ProviderShell } from "@/pages/provider/components/ProviderShell"
import { Button } from "@/shared/ui/button"

const chartBars = [
  { label: "T2", value: "25%", amount: "5M", active: false },
  { label: "T3", value: "50%", amount: "10M", active: false },
  { label: "T4", value: "33%", amount: "7M", active: false },
  { label: "T5", value: "75%", amount: "15M", active: true },
  { label: "T6", value: "50%", amount: "10M", active: false },
  { label: "T7", value: "66%", amount: "12M", active: false },
  { label: "CN", value: "100%", amount: "20M", active: false },
]

const transactions = [
  { id: "#PO-2410-001", date: "24/10/2024, 14:30", type: "Rút tiền", icon: Landmark, status: "Đang xử lý", amount: "-12,500,000 ₫", tone: "neutral" },
  { id: "#BK-9843", date: "23/10/2024, 18:15", type: "Thuê xe", icon: Car, status: "Hoàn tất", amount: "+450,000 ₫", tone: "success" },
  { id: "#TK-1022", date: "23/10/2024, 16:00", type: "Thuê sân", icon: MapPinned, status: "Hoàn tất", amount: "+250,000 ₫", tone: "success" },
  { id: "#PO-2409-088", date: "15/10/2024, 09:00", type: "Rút tiền", icon: Landmark, status: "Thành công", amount: "-45,000,000 ₫", tone: "neutral" },
]

export function ProviderRevenuePage() {
  return (
    <ProviderShell contentClassName="mx-0 max-w-none px-0 py-0 md:px-0">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[#c4c7c8] bg-[#fcf8f8]/80 px-4 py-4 backdrop-blur-md md:px-6">
        <div>
          <h2 className="text-[32px] font-bold leading-tight tracking-tight text-[#1c1b1b]">Doanh thu & Rút tiền</h2>
          <p className="mt-1 text-sm font-medium text-[#444748]">Quản lý dòng tiền và các khoản thanh toán.</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full text-[#444748] hover:bg-[#f1edec]" aria-label="Thông báo">
            <Bell className="size-5" />
          </Button>
          <div className="size-10 overflow-hidden rounded-full border border-[#c4c7c8] bg-white">
            <img
              alt="Avatar"
              className="h-full w-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC9tptYWoLiFpiMQwQxABxTxNfHVkdFj8DLprZIx96_JpdoFqW-LfmzW0yrXvERuk4Bc0JSiStL-IAdqDFnASgvEZM3MNDRNoD_Xx8DC-albyTmvrJCFM67T8C629f0yFQp_e6Drwvt3XPxHv3xl2hUeMEECllu33L1YoGB6xxbAD-IxiTsP0lylibWcy-VD8eIUqheIU8nCJYDIrtCepHsMhCl8xzQb5tNkRrQIRjh_q1-wqh6z0gEe-UQ2cCpuk"
            />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-16 px-4 py-16 md:px-6">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="relative col-span-1 flex min-h-72 flex-col justify-between overflow-hidden rounded-xl border border-[#c4c7c8] bg-white p-6 shadow-sm md:col-span-2">
            <Wallet className="absolute right-4 top-4 size-28 text-[#1c1b1b]/10" />
            <div>
              <p className="mb-2 font-mono text-xs font-medium uppercase tracking-[0.05em] text-[#444748]">Số dư khả dụng</p>
              <h3 className="text-4xl font-bold leading-[1.1] tracking-tight text-[#1c1b1b] md:text-5xl">125,450,000 ₫</h3>
              <p className="mt-2 text-sm font-medium text-[#444748]">Đã bao gồm doanh thu từ các phiên chạy hôm nay.</p>
            </div>
            <div className="mt-6">
              <Button className="h-12 gap-2 rounded-lg bg-[#1c1b1b] px-6 font-bold text-white hover:bg-[#313030]">
                <Landmark className="size-4" />
                Rút tiền về ngân hàng
              </Button>
            </div>
          </div>

          <div className="flex min-h-72 flex-col justify-between rounded-xl border border-[#c4c7c8] bg-white p-6 shadow-sm">
            <div>
              <p className="mb-2 font-mono text-xs font-medium uppercase tracking-[0.05em] text-[#444748]">Đang chờ xử lý</p>
              <h3 className="text-[32px] font-semibold leading-tight text-[#1c1b1b]">12,500,000 ₫</h3>
              <p className="mt-2 text-sm font-medium text-[#444748]">Dự kiến thanh toán vào 24/10/2024</p>
            </div>
            <div className="mt-4 border-t border-[#c4c7c8] pt-4">
              <div className="flex items-center justify-between text-sm text-[#444748]">
                <span>Lần rút gần nhất</span>
                <span className="font-medium text-[#1c1b1b]">45,000,000 ₫</span>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-[#c4c7c8] bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h3 className="text-xl font-semibold text-[#1c1b1b]">Biểu đồ doanh thu</h3>
            <div className="flex rounded-lg bg-[#f1edec] p-1">
              <button className="rounded-md px-4 py-1 text-sm font-medium text-[#444748] hover:bg-[#ebe7e7]">Tuần</button>
              <button className="rounded-md bg-white px-4 py-1 text-sm font-medium text-[#1c1b1b] shadow-sm">Tháng</button>
              <button className="rounded-md px-4 py-1 text-sm font-medium text-[#444748] hover:bg-[#ebe7e7]">Năm</button>
            </div>
          </div>

          <div className="relative flex h-64 w-full items-end justify-between rounded-lg border border-dashed border-[#c4c7c8] px-4 pb-0 pt-8">
            {chartBars.map((bar) => (
              <div key={bar.label} className="group relative w-8 rounded-t-sm bg-[#e2e1eb] sm:w-12" style={{ height: bar.value }}>
                <div className="absolute -top-8 left-1/2 hidden -translate-x-1/2 rounded bg-[#1c1b1b] px-2 py-1 text-xs text-white group-hover:block">{bar.amount}</div>
                {bar.active ? <div className="h-full w-full rounded-t-sm border-2 border-[#5d5f5f] bg-white" /> : null}
              </div>
            ))}
            <div className="absolute bottom-0 left-0 h-px w-full bg-[#c4c7c8]" />
          </div>
          <div className="mt-2 flex justify-between px-4 font-mono text-xs font-medium text-[#444748]">
            {chartBars.map((bar) => (
              <span key={bar.label}>{bar.label}</span>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between gap-4">
            <h3 className="text-xl font-semibold text-[#1c1b1b]">Lịch sử giao dịch & Rút tiền</h3>
            <div className="flex gap-2">
              <Button variant="outline" className="h-10 gap-1 rounded-lg border-[#c4c7c8] bg-transparent text-sm text-[#444748] hover:bg-[#f1edec]">
                <Filter className="size-4" />
                Lọc
              </Button>
              <Button variant="outline" className="h-10 gap-1 rounded-lg border-[#c4c7c8] bg-transparent text-sm text-[#444748] hover:bg-[#f1edec]">
                <Download className="size-4" />
                Xuất CSV
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#c4c7c8] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#c4c7c8] bg-[#f6f3f2] font-mono text-xs font-medium uppercase tracking-[0.05em] text-[#444748]">
                    <th className="p-4 font-medium">Mã GD</th>
                    <th className="p-4 font-medium">Ngày giờ</th>
                    <th className="p-4 font-medium">Loại</th>
                    <th className="p-4 font-medium">Trạng thái</th>
                    <th className="p-4 text-right font-medium">Số tiền</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {transactions.map((transaction) => {
                    const Icon = transaction.icon
                    const success = transaction.tone === "success"

                    return (
                      <tr key={transaction.id} className="border-b border-[#c4c7c8] transition-colors last:border-b-0 hover:bg-[#f6f3f2]/50">
                        <td className="p-4 font-medium text-[#1c1b1b]">{transaction.id}</td>
                        <td className="p-4 text-[#444748]">{transaction.date}</td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1 text-[#1c1b1b]">
                            <Icon className="size-4 text-[#747878]" />
                            {transaction.type}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={success ? "inline-flex rounded bg-[#e8f5e9] px-2 py-1 text-xs font-medium text-[#1b5e20]" : "inline-flex rounded bg-[#f1edec] px-2 py-1 text-xs font-medium text-[#444748]"}>
                            {transaction.status}
                          </span>
                        </td>
                        <td className={success ? "p-4 text-right font-bold text-[#1b5e20]" : "p-4 text-right font-bold text-[#1c1b1b]"}>{transaction.amount}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex justify-center border-t border-[#c4c7c8] p-4">
              <button className="text-sm font-medium text-[#444748] transition-colors hover:text-[#1c1b1b]">Xem thêm</button>
            </div>
          </div>
        </section>
      </div>
    </ProviderShell>
  )
}
