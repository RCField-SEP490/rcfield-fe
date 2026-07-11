import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useParams } from "react-router"

import { bookingApi, bookingQueryKeys } from "@/features/booking/api/booking.api"
import { contestApi, contestQueryKeys } from "@/features/contests/api/contest.api"
import { useAuthStore } from "@/features/auth/stores/auth.store"
import { PublicPageShell } from "@/shared/components/PublicPageShell"
import { Button } from "@/shared/ui/button"
import { Card } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"

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
      toast.success("Đã gửi đăng ký contest")
    } catch (error) {
      toast.error("Không thể đăng ký contest", {
        description: getErrorMessage(error),
      })
    }
  }

  return (
    <PublicPageShell>
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-slate-950">{contest?.name ?? "Contest detail"}</h1>
          <p className="mt-2 text-sm font-medium text-slate-600">
            {contest?.description ?? "Thông tin chi tiết contest và luồng đăng ký bằng booking rental hợp lệ."}
          </p>
        </div>

        {!contest ? (
        <div className="h-40 animate-pulse rounded-2xl bg-muted" />
        ) : (
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="rounded-2xl border-border p-6">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-muted-foreground">
                {contest.contest_type?.name ?? "--"} · {contest.contest_format?.name ?? "--"}
              </p>
              <p className="text-sm text-muted-foreground">{contest.description || "Chưa có mô tả contest."}</p>
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <Info label="Host branch" value={contest.host_branch?.cafe?.name ?? "--"} />
                <Info label="Track type" value={contest.track_type?.name ?? "--"} />
                <Info label="Entry fee" value={formatCurrency(contest.entry_fee)} />
                <Info label="Vehicle policy" value={String(contest.vehicle_rule?.vehicle_policy ?? "--")} />
                <Info label="Đăng ký mở" value={formatDateTime(contest.registration_opens_at)} />
                <Info label="Đăng ký đóng" value={formatDateTime(contest.registration_closes_at)} />
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border-border p-6">
            <h3 className="text-lg font-extrabold text-foreground">Đăng ký contest</h3>
            {role !== "customer" ? (
              <p className="mt-3 text-sm font-medium text-muted-foreground">
                Đăng nhập bằng tài khoản customer để đăng ký contest bằng booking rental hợp lệ.
              </p>
            ) : existingRegistration ? (
              <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
                <p className="text-sm font-semibold text-foreground">Bạn đã có đăng ký cho contest này.</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Trạng thái: {existingRegistration.status} · Phí: {existingRegistration.paymentStatus}
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div>
                  <Label className="mb-2 block">Booking confirmed</Label>
                  <select
                    className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
                    value={selectedBookingId}
                    onChange={(e) => {
                      setSelectedBookingId(e.target.value)
                      setSelectedVehicleId("")
                    }}
                  >
                    <option value="">Chọn booking</option>
                    {bookingOptions.map((booking) => (
                      <option key={booking.id} value={booking.id}>
                        {new Date(booking.slotStart).toLocaleString("vi-VN")} · {booking.id.slice(0, 8)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="mb-2 block">Vehicle từ booking</Label>
                  <select
                    className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    disabled={!selectedBooking}
                  >
                    <option value="">Chọn vehicle</option>
                    {selectedBooking?.vehicles.map((vehicle) => (
                      <option key={vehicle.vehicleId} value={vehicle.vehicleId}>
                        {vehicle.catalogName ?? vehicle.identifier ?? vehicle.vehicleId}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="mb-2 block">Contest fee</Label>
                  <Input value={formatCurrency(contest.entry_fee)} readOnly />
                </div>

                <Button
                  type="button"
                  className="w-full"
                  disabled={!selectedBookingId || !selectedVehicleId || registerMutation.isPending}
                  onClick={() => void handleRegister()}
                >
                  {registerMutation.isPending ? "Đang gửi..." : "Đăng ký contest"}
                </Button>
              </div>
            )}
          </Card>
        </div>
        )}
      </section>
    </PublicPageShell>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  )
}

function formatDateTime(value: string | null) {
  if (!value) return "--"
  return new Date(value).toLocaleString("vi-VN")
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value)
}

function getErrorMessage(error: unknown) {
  const maybe = error as { response?: { data?: { message?: string } } }
  return maybe.response?.data?.message ?? "Vui lòng thử lại."
}
