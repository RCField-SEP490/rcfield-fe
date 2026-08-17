import { useMemo, useState } from "react"
import type { ReactNode } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useSearchParams } from "react-router"
import {
  ArrowRight,
  CalendarClock,
  Car,
  CreditCard,
  MapPin,
  Pencil,
  ShieldAlert,
  Swords,
  Ticket,
  Trophy,
} from "lucide-react"
import { toast } from "sonner"

import {
  contestApi,
  contestQueryKeys,
} from "@/features/contests/api/contest.api"
import {
  formatContestDateTime,
  formatMatchLabel,
  getRegistrationDisplayName,
} from "@/features/contests/lib/contest-runtime"
import { getPaymentStatusLabel } from "@/features/contests/lib/contest-status"
import {
  ContestFilterBar,
  ContestStatusBadge,
  JourneyStatusBadge,
  PaymentStatusBadge,
  RegistrationStatusBadge,
} from "@/features/contests/components"
import { CustomerPageShell } from "@/pages/customer/components/CustomerPageShell"
import { routePaths } from "@/app/router/route-paths"
import { Button } from "@/shared/ui/button"
import { EmptyState } from "@/shared/ui/empty-state"
import { CardListSkeleton } from "@/shared/ui/loading-state"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"

const journeyOptions = [
  { value: "PENDING_APPROVAL", label: "Chờ duyệt" },
  { value: "APPROVED_WAITING_CHECKIN", label: "Chờ check-in" },
  { value: "READY_TO_RACE", label: "Sẵn sàng đua" },
  { value: "IN_BRACKET", label: "Đang trong bracket" },
  { value: "ADVANCED", label: "Đã vào vòng tiếp" },
  { value: "ELIMINATED", label: "Đã bị loại" },
  { value: "FINISHED", label: "Đã hoàn thành" },
] as const

const contestStatusOptions = [
  { value: "OPEN", label: "Đang mở" },
  { value: "CLOSED", label: "Đã đóng đăng ký" },
  { value: "RUNNING", label: "Đang diễn ra" },
  { value: "COMPLETED", label: "Đã hoàn thành" },
] as const

export function CustomerContestRegistrationsPage() {
  const [now] = useState(() => Date.now())
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [cancelId, setCancelId] = useState<string | null>(null)
  // Giữ CTA thanh toán disabled cho tới khi redirect sang VNPay (không reset
  // theo isPending vì mutation resolve trước khi điều hướng).
  const [payingId, setPayingId] = useState<string | null>(null)
  const query = searchParams.get("query") ?? ""
  const bookingIdFilter = searchParams.get("bookingId") ?? null
  const journeyStatus = searchParams.get("journey") ?? "ALL"
  const contestStatus = searchParams.get("contestStatus") ?? "ALL"

  const registrationsQuery = useQuery({
    queryKey: contestQueryKeys.myRegistrations({
      query,
      journeyStatus,
      contestStatus,
    }),
    queryFn: () =>
      contestApi.listMyRegistrations({
        query: query || undefined,
        customer_journey_status:
          journeyStatus === "ALL" ? undefined : (journeyStatus as never),
        contest_status:
          contestStatus === "ALL" ? undefined : (contestStatus as never),
      }),
    refetchInterval: 15_000,
  })

  const entryFeePaymentMutation = useMutation({
    mutationFn: (registrationId: string) =>
      contestApi.createEntryFeePayment(registrationId, {
        return_url: window.location.href,
      }),
    onSuccess: (payment) => {
      window.location.href = payment.payment_url
    },
    onError: (error) => {
      setPayingId(null)
      toast.error("Không thể tạo thanh toán lệ phí", {
        description: getErrorMessage(error),
      })
    },
  })

  const cancelMutation = useMutation({
    mutationFn: (registrationId: string) =>
      contestApi.cancelRegistration(registrationId),
    onSuccess: () => {
      toast.success("Hủy đăng ký giải đấu thành công!")
      void queryClient.invalidateQueries({
        queryKey: contestQueryKeys.myRegistrations(),
      })
      void queryClient.invalidateQueries({ queryKey: contestQueryKeys.all })
    },
    onError: (error) => {
      toast.error("Không thể hủy đăng ký", {
        description: getErrorMessage(error),
      })
    },
  })

  const registrations = useMemo(() => {
    const items = registrationsQuery.data ?? []
    return bookingIdFilter
      ? items.filter((registration) => registration.bookingId === bookingIdFilter)
      : items
  }, [bookingIdFilter, registrationsQuery.data])
  const stats = useMemo(() => {
    return {
      total: registrations.length,
      inBracket: registrations.filter(
        (item) => item.customerJourneyStatus === "IN_BRACKET",
      ).length,
      advanced: registrations.filter(
        (item) => item.customerJourneyStatus === "ADVANCED",
      ).length,
    }
  }, [registrations])

  return (
    <CustomerPageShell>
      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-950 font-display">
              Hành trình contest của bạn
            </h1>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Theo dõi trạng thái đăng ký, trận gần nhất và bracket của các giải
              bạn đang tham gia.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Đã tham gia" value={String(stats.total)} />
            <Metric label="Đang trong nhánh đấu" value={String(stats.inBracket)} />
            <Metric label="Đã vào vòng tiếp" value={String(stats.advanced)} />
          </div>
        </div>

        <ContestFilterBar
          className="mt-5 lg:grid-cols-[minmax(0,1fr)_220px_220px]"
          inputClassName="h-11 rounded-2xl border-slate-200 bg-slate-50 px-4 text-sm focus:border-orange-300 focus:bg-white"
          selectClassName="h-11 rounded-2xl border-slate-200 bg-white px-4"
          searchPlaceholder="Tìm theo tên giải, tên người chơi hoặc email"
          fields={[
            {
              param: "journey",
              options: [...journeyOptions],
              allLabel: "Tất cả hành trình",
              allValue: "ALL",
            },
            {
              param: "contestStatus",
              options: [...contestStatusOptions],
              allLabel: "Mọi trạng thái giải",
              allValue: "ALL",
            },
          ]}
        />
      </div>

      <div className="space-y-4">
        {registrationsQuery.isLoading ? (
          <CardListSkeleton
            count={3}
            className="space-y-4"
            itemClassName="h-52 rounded-3xl"
          />
        ) : registrations.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="Bạn chưa có contest phù hợp bộ lọc"
            description={bookingIdFilter
              ? "Không tìm thấy đăng ký giải đấu tương ứng với đơn đặt này."
              : "Hãy khám phá thêm các giải đang mở đăng ký hoặc điều chỉnh bộ lọc để xem hành trình thi đấu của bạn."}
            className="rounded-3xl border-2 border-slate-200 bg-white p-12 shadow-sm"
            action={
              <Button
                asChild
                className="rounded-xl bg-orange-600 px-6 py-5 font-bold text-white hover:bg-orange-700"
              >
                <Link to="/contests">Khám phá giải đấu</Link>
              </Button>
            }
          />
        ) : (
          registrations.map((registration) => {
            const contest = registration.contest
            const latestMatch = registration.latestMatch
            const byocDeclaration =
              registration.vehicleSource === "BYOC"
                ? ((registration.metadata?.byoc_declaration ?? null) as {
                    vehicle_name?: string | null
                    vehicle_brand?: string | null
                    vehicle_class?: string | null
                    notes?: string | null
                  } | null)
                : null
            const contestUpcoming = contest?.starts_at
              ? new Date(contest.starts_at).getTime() > now
              : false
            const entryFeeIsIncludedInBooking = Boolean(registration.bookingId)

            return (
              <article
                key={registration.id}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="grid gap-0 lg:grid-cols-[240px_minmax(0,1fr)]">
                  <div className="relative min-h-[210px] bg-slate-900">
                    {contest?.banner_image_url ? (
                      <img
                        src={contest.banner_image_url}
                        alt={contest.name}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/70 to-slate-900/30" />
                    <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-200">
                        {contest?.contest_format?.name ?? "Contest"}
                      </p>
                      <h3 className="mt-2 text-xl font-black leading-tight">
                        {contest?.name ?? "Contest đang cập nhật"}
                      </h3>
                      <div className="mt-3 flex items-center gap-2 text-sm text-white/80">
                        <MapPin className="size-4" />
                        <span>
                          {contest?.host_branch?.cafe?.name ??
                            "Chi nhánh RC Field"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <JourneyStatusBadge
                            status={registration.customerJourneyStatus}
                          />
                          <RegistrationStatusBadge
                            status={registration.status}
                          />
                          <PaymentStatusBadge
                            status={registration.paymentStatus}
                          />
                        </div>

                        {/*
                          Đăng ký bị huỷ mà không nói vì sao là chỗ khách hàng
                          mất phương hướng nhất: hệ thống có thể tự huỷ khi quá
                          hạn trả lệ phí, hoặc khi khách bấm huỷ ở cổng thanh
                          toán. Nhìn thấy mỗi chữ "Đã huỷ" thì họ không biết
                          mình còn đăng ký lại được hay không.
                        */}
                        {/* Hạn giữ suất — xem chú thích ở ContestRegistrationPanel. */}
                        {registration.entryFeeHoldExpiresAt ? (
                          <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
                            <p className="text-sm font-bold text-orange-900">
                              Suất được giữ đến{" "}
                              {new Date(
                                registration.entryFeeHoldExpiresAt,
                              ).toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                            <p className="mt-1 text-sm font-medium text-orange-800">
                              Chưa thanh toán lệ phí trước giờ đó thì suất sẽ trả
                              lại cho người khác.
                            </p>
                          </div>
                        ) : null}

                        {registration.status === "CANCELLED" &&
                        registration.cancellationReason ? (
                          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                            <p className="text-sm font-bold text-amber-900">
                              Lý do huỷ: {registration.cancellationReason}
                            </p>
                            <p className="mt-1 text-sm font-medium text-amber-800">
                              Suất đã được trả lại cho người khác. Giải còn mở
                              đăng ký thì bạn vẫn đăng ký lại được từ đầu.
                            </p>
                          </div>
                        ) : null}
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          <InfoTile
                            label="Người thi đấu"
                            value={getRegistrationDisplayName(registration)}
                          />
                          <InfoTile
                            label="Mã điểm danh"
                            value={registration.checkInCode ?? "--"}
                          />
                          <InfoTile
                            label="Lịch thi đấu"
                            value={formatContestDateTime(
                              contest?.starts_at ?? null,
                            )}
                            icon={<CalendarClock className="size-4" />}
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {registration.paymentStatus === "PENDING_PAYMENT" && entryFeeIsIncludedInBooking ? (
                          <Button
                            asChild
                            className="rounded-xl bg-orange-600 font-bold text-white hover:bg-orange-700"
                          >
                            <Link
                              to={routePaths.customerBookingDetail.replace(
                                ":bookingId",
                                registration.bookingId!,
                              )}
                            >
                              <CreditCard className="mr-2 size-4" />
                              Thanh toán đơn đặt
                            </Link>
                          </Button>
                        ) : registration.paymentStatus === "PENDING_PAYMENT" ? (
                          <Button
                            type="button"
                            className="rounded-xl bg-orange-600 font-bold text-white hover:bg-orange-700"
                            disabled={payingId === registration.id}
                            onClick={() => {
                              setPayingId(registration.id)
                              entryFeePaymentMutation.mutate(registration.id)
                            }}
                          >
                            <CreditCard className="mr-2 size-4" />
                            {payingId === registration.id
                              ? "Đang chuyển sang thanh toán..."
                              : "Thanh toán lệ phí"}
                          </Button>
                        ) : null}
                        <Button
                          asChild
                          variant="outline"
                          className="rounded-xl border-slate-200"
                        >
                          <Link
                            to={routePaths.contestDetail.replace(
                              ":contestId",
                              contest?.id ?? registration.contestId,
                            )}
                          >
                            Xem bracket
                            <ArrowRight className="ml-2 size-4" />
                          </Link>
                        </Button>
                        {registration.status === "CANCELLED" ? (
                          <Button
                            asChild
                            className="rounded-xl bg-orange-600 font-bold hover:bg-orange-700"
                          >
                            <Link
                              to={routePaths.contestDetail.replace(
                                ":contestId",
                                contest?.id ?? registration.contestId,
                              )}
                            >
                              Đăng ký lại
                            </Link>
                          </Button>
                        ) : null}
                        {["PENDING", "CONFIRMED"].includes(
                          registration.status,
                        ) ? (
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-xl border-red-200 bg-red-50 font-bold text-red-700 hover:bg-red-100 hover:text-red-800"
                            onClick={() => setCancelId(registration.id)}
                          >
                            Hủy đăng ký
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    {registration.status === "CONFIRMED" &&
                    contestUpcoming &&
                    registration.checkInCode ? (
                      <p className="mt-4 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800">
                        <Ticket className="size-4 shrink-0" />
                        Khi đến điểm danh, mang theo mã:{" "}
                        <span className="font-black tracking-widest">
                          {registration.checkInCode}
                        </span>
                      </p>
                    ) : null}

                    {byocDeclaration ? (
                      <ByocDeclarationCard
                        registrationId={registration.id}
                        declaration={byocDeclaration}
                        editable={registration.status === "PENDING"}
                      />
                    ) : null}

                    <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                      <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                        <div className="flex items-center gap-2 text-slate-900">
                          <Swords className="size-4 text-orange-500" />
                          <h4 className="text-sm font-black uppercase tracking-wide">
                            Trận gần nhất
                          </h4>
                        </div>
                        {latestMatch ? (
                          <div className="mt-3 space-y-2">
                            <p className="text-base font-bold text-slate-900">
                              {formatMatchLabel({
                                id: latestMatch.matchId,
                                contest_id: latestMatch.contestId,
                                cafe_id: contest?.host_branch?.cafe_id ?? "",
                                track_config_id: null,
                                round_no: latestMatch.roundNo,
                                match_no: latestMatch.matchNo,
                                name: latestMatch.name,
                                match_type: latestMatch.matchType,
                                status: latestMatch.status,
                                scheduled_at: latestMatch.scheduledAt,
                                started_at: latestMatch.startedAt,
                                ended_at: latestMatch.endedAt,
                                next_match_id: latestMatch.nextMatchId,
                                advancement_rule: {},
                                result_summary: {},
                                metadata: {},
                                decided_by: null,
                                decided_at: null,
                                participants: [],
                              })}
                            </p>
                            <p className="text-sm font-medium text-slate-600">
                              Trạng thái trận: {latestMatch.status}
                            </p>
                            <p className="text-sm font-medium text-slate-600">
                              Kết quả gần nhất:{" "}
                              {latestMatch.isWinner
                                ? "Bạn vừa thắng"
                                : latestMatch.finishPosition
                                  ? `Về vị trí #${latestMatch.finishPosition}`
                                  : "Đang chờ cập nhật"}
                            </p>
                            <p className="text-sm font-medium text-slate-600">
                              Đối thủ sẽ được cập nhật theo bracket.
                            </p>
                          </div>
                        ) : (
                          <p className="mt-3 text-sm font-medium text-slate-500">
                            Bạn đã được ghi nhận ở contest này, nhưng hệ thống
                            chưa có runtime match gần nhất.
                          </p>
                        )}
                      </section>

                      <section className="rounded-2xl border border-slate-200 bg-white p-4">
                        <h4 className="text-sm font-black uppercase tracking-wide text-slate-900">
                          Gợi ý theo dõi
                        </h4>
                        <div className="mt-3 space-y-2 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <span>Contest:</span>
                            {contest ? (
                              <ContestStatusBadge
                                status={contest.status}
                                size="sm"
                              />
                            ) : (
                              "--"
                            )}
                          </div>
                          <p>
                            Người thi đấu:{" "}
                            {registration.participant?.email ?? "Đang cập nhật"}
                          </p>
                          <p>
                            Lệ phí:{" "}
                            {getPaymentStatusLabel(registration.paymentStatus)}
                          </p>
                          <p>
                            Check-in:{" "}
                            {registration.checkedInAt
                              ? formatContestDateTime(registration.checkedInAt)
                              : "Chưa check-in"}
                          </p>
                        </div>
                      </section>
                    </div>
                  </div>
                </div>
              </article>
            )
          })
        )}
      </div>

      <Dialog
        open={!!cancelId}
        onOpenChange={(v) => {
          if (!v) setCancelId(null)
        }}
      >
        <DialogContent className="rounded-2xl border-none sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <ShieldAlert className="size-6" />
            </div>
            <DialogTitle className="text-center text-lg font-bold text-slate-950">
              Xác nhận hủy đăng ký
            </DialogTitle>
            <DialogDescription className="mt-2 text-center text-sm leading-relaxed text-slate-500">
              Bạn có chắc chắn muốn hủy đăng ký tham gia giải đấu này không?
              Hành động này không thể hoàn tác. Phí tham gia đã thanh toán sẽ
              được hoàn theo chính sách của giải. Nếu bạn đang thuê xe cho giải
              này, booking thuê cũng sẽ bị hủy tự động.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 gap-2 sm:justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCancelId(null)}
              disabled={cancelMutation.isPending}
              className="rounded-xl border-slate-200 font-bold"
            >
              Quay lại
            </Button>
            <Button
              type="button"
              disabled={cancelMutation.isPending}
              className="rounded-xl bg-red-600 font-bold text-white hover:bg-red-700"
              onClick={async () => {
                if (cancelId) {
                  await cancelMutation.mutateAsync(cancelId)
                  setCancelId(null)
                }
              }}
            >
              {cancelMutation.isPending ? "Đang hủy..." : "Xác nhận hủy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CustomerPageShell>
  )
}

function ByocDeclarationCard({
  registrationId,
  declaration,
  editable,
}: {
  registrationId: string
  declaration: {
    vehicle_name?: string | null
    vehicle_brand?: string | null
    vehicle_class?: string | null
    notes?: string | null
  }
  editable: boolean
}) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [vehicleName, setVehicleName] = useState(declaration.vehicle_name ?? "")
  const [vehicleBrand, setVehicleBrand] = useState(
    declaration.vehicle_brand ?? "",
  )
  const [vehicleClass, setVehicleClass] = useState(
    declaration.vehicle_class ?? "",
  )
  const [notes, setNotes] = useState(declaration.notes ?? "")

  const updateMutation = useMutation({
    mutationFn: () =>
      contestApi.updateByocDeclaration(registrationId, {
        vehicle_name: vehicleName.trim(),
        vehicle_brand: vehicleBrand.trim() || null,
        vehicle_class: vehicleClass.trim() || null,
        notes: notes.trim() || null,
      }),
    onSuccess: () => {
      toast.success("Cập nhật khai báo xe thành công!")
      setEditing(false)
      void queryClient.invalidateQueries({
        queryKey: contestQueryKeys.myRegistrations(),
      })
      void queryClient.invalidateQueries({ queryKey: contestQueryKeys.all })
    },
    onError: (error) => {
      toast.error("Không thể cập nhật khai báo xe", {
        description: getErrorMessage(error),
      })
    },
  })

  const isNameValid = vehicleName.trim().length >= 2
  const inputClassName =
    "h-10 w-full rounded-xl border border-amber-200 bg-white px-3 text-sm text-amber-950 focus:border-amber-400 focus:outline-none"

  return (
    <section className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
      <div className="flex items-center justify-between gap-2 text-amber-900">
        <div className="flex items-center gap-2">
          <Car className="size-4" />
          <h4 className="text-sm font-black uppercase tracking-wide">
            Khai báo xe cá nhân (BYOC)
          </h4>
        </div>
        {editable && !editing ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl border-amber-300 bg-white font-bold text-amber-800 hover:bg-amber-100"
            onClick={() => setEditing(true)}
          >
            <Pencil className="mr-1 size-3.5" />
            Chỉnh sửa
          </Button>
        ) : null}
      </div>

      {editing ? (
        <div className="mt-3 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-amber-800">
                Tên xe <span className="text-red-600">*</span>
              </label>
              <input
                className={inputClassName}
                value={vehicleName}
                onChange={(e) => setVehicleName(e.target.value)}
                placeholder="VD: Xe đua của tôi"
              />
              {!isNameValid && vehicleName.trim().length > 0 ? (
                <p className="mt-1 text-xs font-semibold text-red-600">
                  Tên xe cần ít nhất 2 ký tự.
                </p>
              ) : null}
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-amber-800">
                Hãng
              </label>
              <input
                className={inputClassName}
                value={vehicleBrand}
                onChange={(e) => setVehicleBrand(e.target.value)}
                placeholder="VD: Tamiya"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-amber-800">
                Class
              </label>
              <input
                className={inputClassName}
                value={vehicleClass}
                onChange={(e) => setVehicleClass(e.target.value)}
                placeholder="VD: Open"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-amber-800">
                Ghi chú
              </label>
              <input
                className={inputClassName}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ghi chú thêm (nếu có)"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              className="rounded-xl bg-amber-600 font-bold text-white hover:bg-amber-700"
              disabled={!isNameValid || updateMutation.isPending}
              onClick={() => updateMutation.mutate()}
            >
              {updateMutation.isPending ? "Đang lưu..." : "Lưu"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-amber-300 bg-white font-bold text-amber-800 hover:bg-amber-100"
              disabled={updateMutation.isPending}
              onClick={() => setEditing(false)}
            >
              Hủy
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-3 grid gap-3 text-sm text-amber-900 sm:grid-cols-2 xl:grid-cols-4">
          <p>
            <span className="font-semibold">Tên xe:</span>{" "}
            {declaration.vehicle_name ?? "--"}
          </p>
          <p>
            <span className="font-semibold">Hãng:</span>{" "}
            {declaration.vehicle_brand ?? "--"}
          </p>
          <p>
            <span className="font-semibold">Class:</span>{" "}
            {declaration.vehicle_class ?? "--"}
          </p>
          <p>
            <span className="font-semibold">Ghi chú:</span>{" "}
            {declaration.notes ?? "--"}
          </p>
        </div>
      )}
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string }) {  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
    </div>
  )
}

function InfoTile({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon?: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <div className="mt-1 flex items-center gap-2">
        {icon}
        <p className="text-sm font-bold text-slate-900">{value}</p>
      </div>
    </div>
  )
}

function getErrorMessage(error: unknown) {
  const maybe = error as { response?: { data?: { message?: string } } }
  return maybe.response?.data?.message ?? "Vui lòng thử lại."
}
