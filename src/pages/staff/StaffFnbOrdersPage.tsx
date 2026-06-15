import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Clock, ChefHat, Check, X, ClipboardList } from "lucide-react"
import { staffApi, staffQueryKeys, type TodayFnbOrderItem } from "@/features/staff/api/staff.api"
import { cn } from "@/shared/lib/utils"
import { formatCurrency } from "@/shared/lib/format"
import {
  StaffHeader,
  StaffCard,
  StaffButton,
} from "./components/StaffUI"

type OrderTab = "PENDING" | "CONFIRMED" | "DELIVERED"

export default function StaffFnbOrdersPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<OrderTab>("PENDING")

  const { data: orders = [], isLoading } = useQuery({
    queryKey: staffQueryKeys.fnbOrders(),
    queryFn: staffApi.getFnbOrders,
    refetchInterval: 30_000,
  })

  const updateMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      staffApi.updateFnbOrder(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffQueryKeys.fnbOrders() })
    },
  })

  const filteredOrders = orders.filter((o) => o.status === activeTab)

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime()
    const timeB = new Date(b.createdAt).getTime()
    return activeTab === "DELIVERED" ? timeB - timeA : timeA - timeB
  })

  const pendingCount = orders.filter((o) => o.status === "PENDING").length
  const confirmedCount = orders.filter((o) => o.status === "CONFIRMED").length

  return (
    <div className="space-y-6">
      <StaffHeader
        title="Gọi món & Chuẩn bị F&B"
        subtitle="Quản lý và điều phối các đơn pre-order F&B từ booking hôm nay"
      />

      <div className="flex border-b border-[#e5e2e1] gap-2">
        <TabButton
          label="Chờ làm"
          active={activeTab === "PENDING"}
          count={pendingCount}
          badgeColor="bg-orange-600"
          onClick={() => setActiveTab("PENDING")}
        />
        <TabButton
          label="Đang chuẩn bị"
          active={activeTab === "CONFIRMED"}
          count={confirmedCount}
          badgeColor="bg-blue-600"
          onClick={() => setActiveTab("CONFIRMED")}
        />
        <button
          onClick={() => setActiveTab("DELIVERED")}
          className={cn(
            "pb-3 text-sm font-bold px-4 transition-all border-b-2",
            activeTab === "DELIVERED"
              ? "border-orange-500 text-orange-600"
              : "border-transparent text-[#6b7280] hover:text-[#1c1b1b]",
          )}
        >
          Đã phục vụ
        </button>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <StaffCard key={i} className="h-48 animate-pulse bg-[#f5f3f2]" />
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedOrders.map((order) => (
            <FnbOrderCard
              key={order.id}
              order={order}
              onAction={(status) =>
                updateMutation.mutate({ orderId: order.id, status })
              }
              isPending={updateMutation.isPending}
            />
          ))}

          {sortedOrders.length === 0 && (
            <StaffCard className="col-span-full py-16 text-center text-[#6b7280] space-y-2 border-dashed">
              <ClipboardList className="size-10 text-[#6b7280] mx-auto" />
              <p className="text-sm font-bold">Không có đơn F&B nào</p>
              <p className="text-xs">Đơn pre-order từ booking hôm nay sẽ hiển thị ở đây.</p>
            </StaffCard>
          )}
        </div>
      )}
    </div>
  )
}

function TabButton({
  label,
  active,
  count,
  badgeColor,
  onClick,
}: {
  label: string
  active: boolean
  count: number
  badgeColor: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "pb-3 text-sm font-bold px-4 transition-all border-b-2 flex items-center gap-2",
        active
          ? "border-orange-500 text-orange-600"
          : "border-transparent text-[#6b7280] hover:text-[#1c1b1b]",
      )}
    >
      {label}
      {count > 0 && (
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] text-white font-extrabold",
            badgeColor,
            active && "animate-pulse",
          )}
        >
          {count}
        </span>
      )}
    </button>
  )
}

function FnbOrderCard({
  order,
  onAction,
  isPending,
}: {
  order: TodayFnbOrderItem
  onAction: (status: string) => void
  isPending: boolean
}) {
  const slotTime = new Date(order.slotStart).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <StaffCard className="flex flex-col justify-between h-full space-y-4">
      <div>
        <div className="flex items-center justify-between mb-3.5 font-bold text-xs">
          <span className="text-[#1c1b1b] font-semibold truncate max-w-[60%]">
            {order.customerName}
          </span>
          <span className="text-[#6b7280] flex items-center gap-1 shrink-0">
            <Clock className="size-3 text-orange-600" />
            {slotTime}
          </span>
        </div>

        <div className="space-y-2.5">
          {order.items.length === 0 ? (
            <p className="text-xs text-[#6b7280]">Không có chi tiết món</p>
          ) : (
            order.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span className="flex size-5 items-center justify-center rounded bg-[#f5f3f2] border border-[#e5e2e1] text-orange-600 text-[10px] font-bold">
                    x{item.quantity}
                  </span>
                  <span className="text-[#1c1b1b]">{item.name}</span>
                </div>
                <span className="text-[#6b7280]">{formatCurrency(item.subtotal)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="border-t border-[#e5e2e1] pt-3.5 space-y-3 font-semibold">
        <div className="flex justify-between items-center text-xs border-t border-dashed border-[#e5e2e1] pt-2">
          <span className="text-[#6b7280]">Tổng:</span>
          <span className="font-extrabold text-orange-600 text-sm">
            {formatCurrency(order.totalAmount)}
          </span>
        </div>

        <div className="flex gap-2 pt-1">
          {order.status === "PENDING" && (
            <>
              <StaffButton
                onClick={() => onAction("CANCELLED")}
                variant="outline"
                size="sm"
                className="flex-1 text-orange-600 hover:bg-[#fff3eb]"
                disabled={isPending}
              >
                <X className="size-3.5" />
                Hủy
              </StaffButton>
              <StaffButton
                onClick={() => onAction("CONFIRMED")}
                variant="primary"
                size="sm"
                className="flex-1"
                disabled={isPending}
              >
                <ChefHat className="size-3.5" />
                Chế biến
              </StaffButton>
            </>
          )}

          {order.status === "CONFIRMED" && (
            <StaffButton
              onClick={() => onAction("DELIVERED")}
              variant="primary"
              className="w-full text-xs"
              disabled={isPending}
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
}
