import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, CreditCard, ShieldCheck, Swords, Trophy } from "lucide-react"
import { Link, useParams } from "react-router"
import { toast } from "sonner"

import { bookingApi, bookingQueryKeys } from "@/features/booking/api/booking.api"
import { contestApi, contestQueryKeys } from "@/features/contests/api/contest.api"
import { useAuthStore } from "@/features/auth/stores/auth.store"
import { routePaths } from "@/app/router/route-paths"
import {
  formatContestDateTime,
  formatMatchLabel,
  getMatchParticipantName,
} from "@/features/contests/lib/contest-runtime"
import {
  getJourneyStatusClass,
  getJourneyStatusLabel,
  getMatchStatusClass,
  getMatchStatusLabel,
  getPaymentStatusLabel,
  getRegistrationStatusLabel,
} from "@/features/contests/lib/contest-status"
import { Button } from "@/shared/ui/button"
import { Card } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { DriverTitleChip } from "@/features/racing/components/DriverTitleChip"

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
  const matchesQuery = useQuery({
    queryKey: contestQueryKeys.matches(contestId),
    queryFn: () => contestApi.listMatches(contestId!),
    enabled: Boolean(contestId) && role === "customer",
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
    queryFn: () => contestApi.listMyRegistrations(),
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
      void queryClient.invalidateQueries({ queryKey: contestQueryKeys.detail(contestId) })
      void queryClient.invalidateQueries({ queryKey: contestQueryKeys.matches(contestId) })
    },
  })

  const contest = contestQuery.data
  const bookingOptions = myBookingsQuery.data?.data ?? []
  const selectedBooking = bookingDetailQuery.data
  const existingRegistration = useMemo(
    () => contest?.my_registration ?? myRegistrationsQuery.data?.find((item) => item.contestId === contestId) ?? null,
    [contest?.my_registration, myRegistrationsQuery.data, contestId],
  )
  const matches = matchesQuery.data ?? []
  const myMatches = useMemo(
    () => matches.filter((match) => match.participants.some((participant) => participant.registration?.is_my_registration)),
    [matches],
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

  return (
    <main className="w-full bg-slate-50/50 py-10">
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <Link
          to={routePaths.contests}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
        >
          <ArrowLeft className="size-4" />
          <span>Quay lại danh sách giải đấu</span>
        </Link>

        {!contest ? (
          <div className="h-96 animate-pulse rounded-3xl bg-muted" />
        ) : (
          <div className="space-y-8">
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="relative min-h-[280px] overflow-hidden bg-slate-900 p-8 text-white sm:p-10">
                {contest.banner_image_url ? (
                  <img src={contest.banner_image_url} alt={contest.name} className="absolute inset-0 h-full w-full object-cover" />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-950/80 to-orange-800/40" />
                <div className="relative z-10 max-w-3xl">
                  <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-orange-100 backdrop-blur">
                    {contest.contest_type?.name ?? "Giải đấu"} · {contest.contest_format?.name ?? "Standard"}
                  </span>
                  <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">{contest.name}</h1>
                  <p className="mt-4 max-w-2xl whitespace-pre-line text-sm leading-relaxed text-slate-200">
                    {contest.description || "Chưa có mô tả chi tiết giải đấu."}
                  </p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <HeroFact label="Chi nhánh tổ chức" value={contest.host_branch?.cafe?.name ?? "--"} />
                    <HeroFact label="Bắt đầu" value={formatContestDateTime(contest.starts_at)} />
                    <HeroFact label="Lệ phí" value={formatCurrency(contest.entry_fee)} />
                  </div>
                </div>
              </div>
            </section>

            <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-6">
                <Card className="rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Thông số chi tiết</h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <Info label="Chi nhánh tổ chức" value={contest.host_branch?.cafe?.name ?? "--"} />
                    <Info label="Loại đường đua" value={contest.track_type?.name ?? "--"} />
                    <Info label="Luật sử dụng xe" value={getVehiclePolicyLabel(contest.vehicle_rule?.vehicle_policy as string)} />
                    <Info label="Hạn chót đăng ký" value={formatContestDateTime(contest.registration_closes_at)} />
                  </div>
                </Card>

                {existingRegistration ? (
                  <Card className="rounded-3xl border border-slate-200/80 p-6 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-900">
                      <Swords className="size-5 text-orange-500" />
                      <h3 className="text-lg font-extrabold">Bracket của bạn</h3>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      Hệ thống đang ưu tiên highlight các trận có bạn tham gia và hiển thị tên đối thủ rõ ràng hơn.
                    </p>

                    <div className="mt-5 space-y-4">
                      {matchesQuery.isLoading ? (
                        Array.from({ length: 2 }).map((_, index) => (
                          <div key={index} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
                        ))
                      ) : myMatches.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm font-medium text-slate-500">
                          Bạn chưa có match nào hiển thị trong bracket hiện tại.
                        </div>
                      ) : (
                        myMatches.map((match) => {
                          const myParticipant = match.participants.find((participant) => participant.registration?.is_my_registration) ?? null
                          const opponents = match.participants.filter((participant) => !participant.registration?.is_my_registration)

                          return (
                            <article key={match.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <p className="text-base font-bold text-slate-900">{formatMatchLabel(match)}</p>
                                  <p className="text-sm text-slate-500">Thi đấu lúc {formatContestDateTime(match.scheduled_at)}</p>
                                </div>
                                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${getMatchStatusClass(match.status)}`}>
                                  {getMatchStatusLabel(match.status)}
                                </span>
                              </div>
                              <div className="mt-4 grid gap-3 md:grid-cols-2">
                                <BracketCard
                                  title="Bạn"
                                  name={myParticipant ? getMatchParticipantName(myParticipant) : existingRegistration.participant?.fullName ?? "Bạn"}
                                  detail={myParticipant?.status ?? existingRegistration.status}
                                  titleLabel={myParticipant?.registration?.driver_title_label ?? existingRegistration.participant?.driverTitleLabel ?? null}
                                  highlight
                                />
                                <BracketCard
                                  title="Đối thủ"
                                  name={opponents[0] ? getMatchParticipantName(opponents[0]) : "Đang chờ ghép"}
                                  detail={opponents[0]?.status ?? "PENDING"}
                                  titleLabel={opponents[0]?.registration?.driver_title_label ?? null}
                                />
                              </div>
                            </article>
                          )
                        })
                      )}
                    </div>
                  </Card>
                ) : null}
              </div>

              <div>
                <Card className="sticky top-[100px] rounded-3xl border border-slate-200/80 p-6 shadow-sm sm:p-8">
                  <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
                    <Trophy className="size-5 shrink-0 text-orange-600" />
                    <h3 className="text-lg font-extrabold text-slate-900">Thông tin đăng ký</h3>
                  </div>

                  {role !== "customer" ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
                      <p className="text-sm font-semibold text-slate-600">
                        Vui lòng đăng nhập với tài khoản Khách hàng để đăng ký tham gia giải đấu này.
                      </p>
                    </div>
                  ) : existingRegistration ? (
                    <div className="space-y-4 rounded-2xl border border-orange-100 bg-orange-50/30 p-5">
                      <div className="flex items-center gap-2 text-emerald-600">
                        <ShieldCheck className="size-5 shrink-0" />
                        <span className="text-sm font-bold">Bạn đã đăng ký giải đấu này</span>
                      </div>
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getJourneyStatusClass(existingRegistration.customerJourneyStatus)}`}>
                        {getJourneyStatusLabel(existingRegistration.customerJourneyStatus)}
                      </span>
                      <div className="grid grid-cols-2 gap-3 border-t border-orange-100 pt-2 text-xs">
                        <div>
                          <p className="font-bold text-slate-400">Trạng thái đăng ký</p>
                          <p className="mt-1 text-sm font-extrabold text-slate-900">{getRegistrationStatusLabel(existingRegistration.status)}</p>
                        </div>
                        <div>
                          <p className="font-bold text-slate-400">Lệ phí thi đấu</p>
                          <p className="mt-1 text-sm font-extrabold text-slate-900">{getPaymentStatusLabel(existingRegistration.paymentStatus)}</p>
                        </div>
                      </div>
                      {existingRegistration.checkInCode ? (
                        <div className="rounded-xl border border-orange-100/50 bg-white p-3 text-center">
                          <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Mã điểm danh (Check-in)</p>
                          <p className="mt-1 text-lg font-black tracking-widest text-slate-900">{existingRegistration.checkInCode}</p>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label className="mb-2 block text-xs font-bold text-slate-700">Lịch đặt đã xác nhận</Label>
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
                          <Input className="border-slate-200 pl-9 font-bold text-slate-900" value={formatCurrency(contest.entry_fee)} readOnly />
                        </div>
                      </div>

                      <Button
                        type="button"
                        className="mt-6 w-full rounded-xl bg-orange-600 py-6 text-sm font-bold text-white shadow-md shadow-orange-600/10 transition hover:bg-orange-700"
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
          </div>
        )}
      </section>
    </main>
  )
}

function HeroFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-orange-100/80">{label}</p>
      <p className="mt-2 text-sm font-bold text-white">{value}</p>
    </div>
  )
}

function BracketCard({
  title,
  name,
  detail,
  titleLabel,
  highlight = false,
}: {
  title: string
  name: string
  detail: string
  titleLabel?: string | null
  highlight?: boolean
}) {
  return (
    <div className={`rounded-2xl border p-4 ${highlight ? "border-orange-200 bg-orange-50/70" : "border-slate-200 bg-white"}`}>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{title}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <p className="text-base font-extrabold text-slate-900">{name}</p>
        <DriverTitleChip label={titleLabel} />
      </div>
      <p className="mt-1 text-sm font-medium text-slate-500">{detail}</p>
    </div>
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

function getVehiclePolicyLabel(policy: string | null | undefined) {
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

function formatCurrency(value: number) {
  if (value === 0) return "Miễn phí"
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value)
}

function getErrorMessage(error: unknown) {
  const maybe = error as { response?: { data?: { message?: string } } }
  return maybe.response?.data?.message ?? "Vui lòng thử lại sau."
}
