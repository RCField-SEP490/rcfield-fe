import { useState } from "react"
import { Clock, ChefHat, Check, X, ClipboardList } from "lucide-react"
import { useStaffOperations } from "./context/StaffOperationContext"
import { cn } from "@/shared/lib/utils"
import {
  StaffHeader,
  StaffCard,
  StaffButton,
} from "./components/StaffUI"

type OrderTab = "PENDING" | "PREPARING" | "DELIVERED"

export default function StaffFnbOrdersPage() {
  const { fnbOrders, updateFnbOrderStatus } = useStaffOperations()
  const [activeTab, setActiveTab] = useState<OrderTab>("PENDING")

  // Filter orders according to tab
  const filteredOrders = fnbOrders.filter((o) => o.status === activeTab)

  // Sort queue: PENDING and PREPARING -> Oldest first (FIFO kitchen queue)
  // DELIVERED -> Newest first (history logs)
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime()
    const timeB = new Date(b.createdAt).getTime()
    return activeTab === "DELIVERED" ? timeB - timeA : timeA - timeB
  })

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <StaffHeader
        title="Gọi món & Chuẩn bị F&B"
        subtitle="Quản lý và điều phối các đơn gọi đồ uống, thức ăn tại quầy chi nhánh"
      />

      {/* 2. Custom Tabs List */}
      <div className="flex border-b border-[#e5e2e1] gap-2">
        <button
          onClick={() => setActiveTab("PENDING")}
          className={cn(
            "pb-3 text-sm font-bold px-4 transition-all border-b-2 flex items-center gap-2",
            activeTab === "PENDING"
              ? "border-orange-500 text-orange-600"
              : "border-transparent text-[#6b7280] hover:text-[#1c1b1b]"
          )}
        >
          Chờ làm
          {fnbOrders.filter((o) => o.status === "PENDING").length > 0 && (
            <span className="rounded-full bg-orange-600 px-2 py-0.5 text-[10px] text-white font-extrabold animate-pulse">
              {fnbOrders.filter((o) => o.status === "PENDING").length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("PREPARING")}
          className={cn(
            "pb-3 text-sm font-bold px-4 transition-all border-b-2 flex items-center gap-2",
            activeTab === "PREPARING"
              ? "border-orange-500 text-orange-600"
              : "border-transparent text-[#6b7280] hover:text-[#1c1b1b]"
          )}
        >
          Đang chuẩn bị
          {fnbOrders.filter((o) => o.status === "PREPARING").length > 0 && (
            <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] text-white font-extrabold">
              {fnbOrders.filter((o) => o.status === "PREPARING").length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("DELIVERED")}
          className={cn(
            "pb-3 text-sm font-bold px-4 transition-all border-b-2",
            activeTab === "DELIVERED"
              ? "border-orange-500 text-orange-600"
              : "border-transparent text-[#6b7280] hover:text-[#1c1b1b]"
          )}
        >
          Đã phục vụ
        </button>
      </div>

      {/* 3. Orders Grid Queue */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {sortedOrders.map((order) => {
          return (
            <StaffCard key={order.orderId} className="flex flex-col justify-between h-full space-y-4">
              <div>
                {/* Header card info */}
                <div className="flex items-center justify-between mb-3.5 font-bold text-xs">
                  <span className="text-[#6b7280] font-mono">{order.orderId}</span>
                  <span className="text-[#6b7280] flex items-center gap-1">
                    <Clock className="size-3 text-orange-600" />
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                {/* Items list */}
                <div className="space-y-2.5">
                  {order.items.map((i, index) => (
                    <div key={index} className="flex justify-between items-center text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="flex size-5 items-center justify-center rounded bg-[#f5f3f2] border border-[#e5e2e1] text-orange-600 text-[10px] font-bold">
                          x{i.qty}
                        </span>
                        <span className="text-[#1c1b1b]">{i.name}</span>
                      </div>
                      <span className="text-[#6b7280]">
                        {(i.qty * i.price).toLocaleString("vi-VN")} đ
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom details & action buttons */}
              <div className="border-t border-[#e5e2e1] pt-3.5 space-y-3 font-semibold">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#6b7280]">Tên bàn / Lượt:</span>
                  <span className="text-[#1c1b1b] font-bold">{order.tableName}</span>
                </div>

                <div className="flex justify-between items-center text-xs border-t border-dashed border-[#e5e2e1] pt-2">
                  <span className="text-[#6b7280]">Tổng hóa đơn:</span>
                  <span className="font-extrabold text-orange-600 text-sm">
                    {order.total.toLocaleString("vi-VN")} đ
                  </span>
                </div>

                {/* Transitions buttons */}
                <div className="flex gap-2 pt-1">
                  {order.status === "PENDING" && (
                    <>
                      <StaffButton
                        onClick={() => updateFnbOrderStatus(order.orderId, "CANCELLED")}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-orange-600 hover:bg-[#fff3eb]"
                      >
                        <X className="size-3.5" />
                        Hủy đơn
                      </StaffButton>
                      <StaffButton
                        onClick={() => updateFnbOrderStatus(order.orderId, "PREPARING")}
                        variant="primary"
                        size="sm"
                        className="flex-1"
                      >
                        <ChefHat className="size-3.5" />
                        Chế biến
                      </StaffButton>
                    </>
                  )}

                  {order.status === "PREPARING" && (
                    <StaffButton
                      onClick={() => updateFnbOrderStatus(order.orderId, "DELIVERED")}
                      variant="primary"
                      className="w-full text-xs"
                    >
                      <Check className="size-4" />
                      Xác nhận phục vụ
                    </StaffButton>
                  )}

                  {order.status === "DELIVERED" && (
                    <div className="w-full text-center py-1.5 text-xs text-[#6b7280] flex items-center justify-center gap-1 font-bold">
                      <Check className="size-4 text-emerald-600" />
                      Đã phục vụ
                    </div>
                  )}
                </div>
              </div>
            </StaffCard>
          )
        })}

        {sortedOrders.length === 0 && (
          <StaffCard className="col-span-full py-16 text-center text-[#6b7280] space-y-2 border-dashed">
            <ClipboardList className="size-10 text-[#6b7280] mx-auto" />
            <p className="text-sm font-bold">Không tìm thấy đơn F&B nào</p>
            <p className="text-xs">Các đơn gọi món gọi thêm từ quầy hoặc app sẽ hiển thị trực tiếp tại đây.</p>
          </StaffCard>
        )}
      </div>
    </div>
  )
}
