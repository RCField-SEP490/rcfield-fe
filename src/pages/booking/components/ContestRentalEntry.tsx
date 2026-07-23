import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ChevronLeft, Loader2, Trophy } from "lucide-react"
import { toast } from "sonner"

import { contestApi, contestQueryKeys } from "@/features/contests/api/contest.api"
import { useCreateContestRentalBooking } from "@/features/contests/hooks/use-contest-booking"
import { useCreateCheckout } from "@/features/booking/hooks/use-booking"
import { useAuthStore } from "@/features/auth/stores/auth.store"
import type { ContestItem } from "@/features/contests/types"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { Skeleton } from "@/shared/ui/skeleton"
import {
  ContestRentalSlotPicker,
  type RentalSlotValue,
} from "@/pages/public/contest-detail/components/ContestRentalSlotPicker"

function formatContestTime(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * WF-A entry: banner trên trang tạo booking mở dialog thuê xe thi đấu
 * (tạo booking source=CONTEST, chưa đăng ký thi). Sau khi tạo booking,
 * đi tiếp qua checkout giống flow đặt lịch thường.
 */
export function ContestRentalEntry() {
  const authRole = useAuthStore((state) => state.role)
  const [open, setOpen] = useState(false)
  const [selectedContest, setSelectedContest] = useState<ContestItem | null>(
    null,
  )
  const [rentalSlotValue, setRentalSlotValue] = useState<RentalSlotValue | null>(
    null,
  )

  const { data: contestsData, isLoading: isLoadingContests } = useQuery({
    queryKey: contestQueryKeys.list({ status: "OPEN" }),
    queryFn: () => contestApi.listContests({ status: "OPEN", limit: 20 }),
    enabled: open,
  })
  const openContests = contestsData?.data ?? []

  const createContestRental = useCreateContestRentalBooking()
  const createCheckout = useCreateCheckout()
  const isSubmitting =
    createContestRental.isPending || createCheckout.isPending

  const resetAndClose = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      setSelectedContest(null)
      setRentalSlotValue(null)
    }
  }

  const handleSelectContest = (contest: ContestItem) => {
    setSelectedContest(contest)
    // Gợi ý khung giờ quanh giờ bắt đầu contest (mặc định 1 giờ).
    const start = new Date(contest.starts_at)
    const end = new Date(start.getTime() + 60 * 60 * 1000)
    setRentalSlotValue({
      cafe_id: "",
      slot_start: start.toISOString(),
      slot_end: end.toISOString(),
      track_config_id: null,
      vehicle_catalog_id: null,
    })
  }

  const isSlotReady = Boolean(
    rentalSlotValue?.cafe_id &&
      rentalSlotValue.slot_start &&
      rentalSlotValue.slot_end &&
      rentalSlotValue.vehicle_catalog_id,
  )

  const handleSubmit = async () => {
    if (!authRole) {
      toast.error("Vui lòng đăng nhập bằng tài khoản khách hàng để thuê xe thi đấu.")
      return
    }
    if (authRole !== "customer") {
      toast.error("Vui lòng đăng nhập bằng tài khoản khách hàng để đặt lịch.")
      return
    }
    if (!selectedContest || !rentalSlotValue || !isSlotReady) {
      toast.error("Vui lòng chọn chi nhánh, khung giờ và dòng xe.")
      return
    }
    try {
      const result = await createContestRental.mutateAsync({
        contest_id: selectedContest.id,
        cafe_id: rentalSlotValue.cafe_id,
        slot_start: rentalSlotValue.slot_start,
        slot_end: rentalSlotValue.slot_end,
        track_config_id: rentalSlotValue.track_config_id ?? null,
        vehicle_catalog_id: rentalSlotValue.vehicle_catalog_id ?? null,
      })

      const checkout = await createCheckout.mutateAsync(result.bookingId)
      if (checkout.confirmed) {
        toast.success("Đặt thuê xe thi đấu thành công!")
        window.location.href = "/customer/bookings"
        return
      }
      window.location.href = checkout.payment_url!
    } catch (err) {
      const axiosErr = err as {
        response?: { data?: { message?: string } }
      }
      toast.error(
        axiosErr?.response?.data?.message ??
          "Không thể tạo đơn thuê xe thi đấu. Vui lòng thử lại.",
      )
      console.error("[ContestRentalEntry]", err)
    }
  }

  return (
    <>
      <div className="mt-4 flex flex-col gap-3 rounded-xl border border-orange-100 bg-orange-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-orange-200 bg-white text-orange-600">
            <Trophy className="size-4" />
          </div>
          <div className="text-sm">
            <p className="font-semibold text-orange-900">
              Bạn tham gia giải đấu?
            </p>
            <p className="text-orange-800/80">
              Thuê xe thi đấu cho contest đang mở — chọn giải, chi nhánh, khung
              giờ và dòng xe trong một bước.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="shrink-0 border-orange-200 bg-white text-orange-700 hover:bg-orange-100/60 hover:text-orange-800"
          onClick={() => setOpen(true)}
        >
          Thuê xe thi đấu
        </Button>
      </div>

      <Dialog open={open} onOpenChange={resetAndClose}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Thuê xe thi đấu</DialogTitle>
            <DialogDescription>
              {selectedContest
                ? `Giải: ${selectedContest.name} — chọn chi nhánh, khung giờ và dòng xe.`
                : "Chọn giải đấu đang mở đăng ký mà bạn muốn thuê xe."}
            </DialogDescription>
          </DialogHeader>

          {!selectedContest && (
            <div className="space-y-2">
              {isLoadingContests ? (
                <>
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </>
              ) : openContests.length === 0 ? (
                <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                  Hiện không có giải đấu nào đang mở đăng ký.
                </p>
              ) : (
                openContests.map((contest) => (
                  <button
                    key={contest.id}
                    type="button"
                    onClick={() => handleSelectContest(contest)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition-colors hover:border-orange-300 hover:bg-orange-50/40"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {contest.name}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600">
                      {formatContestTime(contest.starts_at)} –{" "}
                      {formatContestTime(contest.ends_at)}
                      {contest.host_branch?.cafe?.name
                        ? ` · ${contest.host_branch.cafe.name}`
                        : ""}
                    </p>
                  </button>
                ))
              )}
            </div>
          )}

          {selectedContest && (
            <div className="space-y-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="-ml-2 gap-1 text-muted-foreground"
                onClick={() => {
                  setSelectedContest(null)
                  setRentalSlotValue(null)
                }}
                disabled={isSubmitting}
              >
                <ChevronLeft className="size-4" />
                Chọn giải khác
              </Button>

              <ContestRentalSlotPicker
                contestId={selectedContest.id}
                value={rentalSlotValue}
                onChange={(value) => setRentalSlotValue(value)}
                disabled={isSubmitting}
              />

              <Button
                type="button"
                className="w-full"
                disabled={!isSlotReady || isSubmitting}
                onClick={() => void handleSubmit()}
              >
                {isSubmitting && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                Tạo đơn thuê xe & thanh toán
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
