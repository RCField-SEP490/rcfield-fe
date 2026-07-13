import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useParams, Link } from "react-router"
import { Trophy, ShieldCheck, ArrowLeft, CreditCard } from "lucide-react"

import { bookingApi, bookingQueryKeys } from "@/features/booking/api/booking.api"
import { contestApi, contestQueryKeys } from "@/features/contests/api/contest.api"
import { useAuthStore } from "@/features/auth/stores/auth.store"
import { Button } from "@/shared/ui/button"
import { Card } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { routePaths } from "@/app/router/route-paths"
import { getRegistrationStatusLabel, getPaymentStatusLabel } from "@/features/contests/lib/contest-status"

export function PublicContestDetailPage() {
  const { contestId } = useParams()
  const queryClient = useQueryClient()
  const role = useAuthStore((state) => state.role)
  const [selectedBookingId, setSelectedBookingId] = useState("")
  const [selectedVehicleId, setSelectedVehicleId] = useState("")

  const contestQuery = useQuery({
    queryKey: contestQueryKeys.detail(contestId),
    queryFn: () => contestApi.getContest(contestId!),
    enabled: Boolean(contestId),
  })
  const myBookingsQuery = useQuery({
    queryKey: bookingQueryKeys.mine({ status: "CONFIRMED", page: 1, limit: 100 }),
    queryFn: () => bookingApi.listMyBookings({ status: "CONFIRMED", page: 1, limit: 100 }),
    enabled: role === "customer",
  })
  const bookingDetailQuery = useQuery({
    queryKey: bookingQueryKeys.detail(selectedBookingId),
    queryFn: () => bookingApi.getBooking(selectedBookingId),
    enabled: Boolean(selectedBookingId),
  })
  const myRegistrationsQuery = useQuery({
    queryKey: contestQueryKeys.myRegistrations(),
    queryFn: contestApi.listMyRegistrations,
    enabled: role === "customer",
  })

  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!contestId) throw new Error("Missing contestId")
      return contestApi.registerContest(contestId, {
        booking_id: selectedBookingId,
        vehicle_id: selectedVehicleId,
        vehicle_source: "RENTAL",
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: contestQueryKeys.myRegistrations() })
    },
  })

  const contest = contestQuery.data
  const bookingOptions = myBookingsQuery.data?.data ?? []
  const selectedBooking = bookingDetailQuery.data
  const existingRegistration = useMemo(
    () => myRegistrationsQuery.data?.find((item) => item.contestId === contestId) ?? null,
    [myRegistrationsQuery.data, contestId],
  )

  const handleRegister = async () => {
    try {
      await registerMutation.mutateAsync()
      toast.success("Đăng ký tham gia giải đấu thành công!")
    } catch (error) {
      toast.error("Không thể đăng ký giải đấu", {
        description: getErrorMessage(error),
      })
    }
  }

  const getVehiclePolicyLabel = (policy: string | null | undefined) => {
    if (!policy) return "--"
    switch (policy) {
      case "RENTAL_ONLY":
        return "Chỉ sử dụng xe thuê của chi nhánh"
      case "BYOC_ONLY":
        return "Chỉ sử dụng xe cá nhân (BYOC)"
      case "MIXED":
        return "Hỗn hợp (Xe thuê hoặc Xe cá nhân)"
      default:
        return policy
    }
  }

  return (
    <main className="w-full bg-slate-50/50 py-10">
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Back Link */}
        <Link
          to={routePaths.contests}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 mb-6 transition"
        >
          <ArrowLeft className="size-4" />
          <span>Quay lại danh sách giải đấu</span>
        </Link>

        {!contest ? (
          <div className="h-96 animate-pulse rounded-3xl bg-muted" />
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Left Column: Details */}
            <div className="space-y-6">
              <Card className="rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
                <div>
                  <span className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-600 border border-orange-100">
                    {contest.contest_type?.name ?? "Giải đấu"} · {contest.contest_format?.name ?? "Standard"}
                  </span>
                  <h1 className="text-2xl font-extrabold text-slate-950 mt-4 font-display">
                    {contest.name}
                  </h1>
                  <p className="mt-4 text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                    {contest.description || "Chưa có mô tả chi tiết giải đấu."}
                  </p>
                </div>

                <div className="mt-8 border-t border-slate-100 pt-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Thông số chi tiết</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Info label="Chi nhánh tổ chức" value={contest.host_branch?.cafe?.name ?? "--"} />
                    <Info label="Loại đường đua" value={contest.track_type?.name ?? "--"} />
                    <Info label="Lệ phí thi đấu" value={formatCurrency(contest.entry_fee)} />
                    <Info label="Luật sử dụng xe" value={getVehiclePolicyLabel(contest.vehicle_rule?.vehicle_policy as string)} />
                    <Info label="Mở đăng ký từ" value={formatDateTime(contest.registration_opens_at)} />
                    <Info label="Hạn chót đăng ký" value={formatDateTime(contest.registration_closes_at)} />
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column: Registration Widget */}
            <div>
              <Card className="rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm sticky top-[100px]">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
                  <Trophy className="size-5 text-orange-600 shrink-0" />
                  <h3 className="text-lg font-extrabold text-slate-900">Thông tin đăng ký</h3>
                </div>

                {role !== "customer" ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
                    <p className="text-sm font-semibold text-slate-600">
                      Vui lòng đăng nhập với tài khoản Khách hàng để đăng ký tham gia giải đấu này.
                    </p>
                  </div>
                ) : existingRegistration ? (
                  <div className="rounded-2xl border border-orange-100 bg-orange-50/30 p-5 space-y-4">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <ShieldCheck className="size-5 shrink-0" />
                      <span className="text-sm font-bold">Bạn đã đăng ký giải đấu này</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-orange-100">
                      <div>
                        <p className="font-bold text-slate-400">Trạng thái đăng ký</p>
                        <p className="mt-1 font-extrabold text-slate-900 text-sm">
                          {getRegistrationStatusLabel(existingRegistration.status)}
                        </p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-400">Lệ phí thi đấu</p>
                        <p className="mt-1 font-extrabold text-slate-900 text-sm">
                          {getPaymentStatusLabel(existingRegistration.paymentStatus)}
                        </p>
                      </div>
                    </div>
                    {existingRegistration.checkInCode && (
                      <div className="rounded-xl bg-white p-3 border border-orange-100/50 text-center">
                        <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Mã điểm danh (Check-in)</p>
                        <p className="mt-1 text-lg font-black tracking-widest text-slate-900">{existingRegistration.checkInCode}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label className="mb-2 block text-xs font-bold text-slate-700">Lịch đặt đã xác nhận (Confirmed)</Label>
                      <select
                        className="h-10 w-full rounded-lg border border-slate-200 bg-card px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        value={selectedBookingId}
                        onChange={(e) => {
                          setSelectedBookingId(e.target.value)
                          setSelectedVehicleId("")
                        }}
                      >
                        <option value="">-- Chọn lịch đặt sân phù hợp --</option>
                        {bookingOptions.map((booking) => (
                          <option key={booking.id} value={booking.id}>
                            {new Date(booking.slotStart).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })} · Mã: {booking.id.slice(0, 8)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label className="mb-2 block text-xs font-bold text-slate-700">Xe thuê từ lịch đặt</Label>
                      <select
                        className="h-10 w-full rounded-lg border border-slate-200 bg-card px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-slate-50 disabled:text-slate-400"
                        value={selectedVehicleId}
                        onChange={(e) => setSelectedVehicleId(e.target.value)}
                        disabled={!selectedBooking}
                      >
                        <option value="">-- Chọn xe thi đấu --</option>
                        {selectedBooking?.vehicles.map((vehicle) => (
                          <option key={vehicle.vehicleId} value={vehicle.vehicleId}>
                            {vehicle.catalogName ?? vehicle.identifier ?? `Xe #${vehicle.vehicleId.slice(0, 8)}`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label className="mb-2 block text-xs font-bold text-slate-700">Lệ phí giải đấu</Label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-3 size-4 text-slate-400" />
                        <Input
                          className="pl-9 font-bold text-slate-900 border-slate-200"
                          value={formatCurrency(contest.entry_fee)}
                          readOnly
                        />
                      </div>
                    </div>

                    <Button
                      type="button"
                      className="w-full rounded-xl bg-orange-600 py-6 text-sm font-bold text-white shadow-md shadow-orange-600/10 hover:bg-orange-700 transition mt-6"
                      disabled={!selectedBookingId || !selectedVehicleId || registerMutation.isPending}
                      onClick={() => void handleRegister()}
                    >
                      {registerMutation.isPending ? "Đang gửi đăng ký..." : "Đăng ký tham gia ngay"}
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200/60 bg-slate-50/40 p-4">
      <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-extrabold text-slate-900">{value}</p>
    </div>
  )
}

function formatDateTime(value: string | null) {
  if (!value) return "--"
  return new Date(value).toLocaleString("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function formatCurrency(value: number) {
  if (value === 0) return "Miễn phí"
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value)
}

function getErrorMessage(error: unknown) {
  const maybe = error as { response?: { data?: { message?: string } } }
  return maybe.response?.data?.message ?? "Vui lòng thử lại sau."
}
