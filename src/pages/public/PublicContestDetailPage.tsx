import { useMemo, useState } from "react"
import type { ReactNode } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  CalendarClock,
  CreditCard,
  Info as InfoIcon,
  MapPinned,
  ShieldCheck,
  Swords,
  Timer,
  Trophy,
  Users,
} from "lucide-react"
import { Link, useParams } from "react-router"
import { toast } from "sonner"

import { routePaths } from "@/app/router/route-paths"
import { useAuthStore } from "@/features/auth/stores/auth.store"
import {
  bookingApi,
  bookingQueryKeys,
} from "@/features/booking/api/booking.api"
import {
  contestApi,
  contestQueryKeys,
} from "@/features/contests/api/contest.api"
import {
  formatContestDateTime,
  formatDurationSeconds,
  formatMatchLabel,
  getMatchParticipantName,
  groupMatchesByRound,
} from "@/features/contests/lib/contest-runtime"
import {
  getContestStatusClass,
  getContestStatusLabel,
  getContestRegistrationAvailability,
  getEffectiveContestStatus,
  getJourneyStatusClass,
  getJourneyStatusLabel,
  getMatchStatusClass,
  getMatchStatusLabel,
  getPaymentStatusLabel,
  getRegistrationStatusLabel,
  type ContestRegistrationAvailability,
} from "@/features/contests/lib/contest-status"
import type {
  ContestHighlightRound,
  ContestItem,
  ContestLeaderboardPayload,
  ContestMatch,
  ContestMatchParticipant,
  ContestRegistration,
} from "@/features/contests/types"
import { DriverTitleChip } from "@/features/racing/components/DriverTitleChip"
import { Button } from "@/shared/ui/button"
import { Card } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"

type DetailTab = "overview" | "matches" | "leaderboard" | "registration"

export function PublicContestDetailPage() {
  const { contestId } = useParams()
  const queryClient = useQueryClient()
  const role = useAuthStore((state) => state.role)
  const profile = useAuthStore((state) => state.user)
  const [selectedBookingId, setSelectedBookingId] = useState("")
  const [selectedVehicleId, setSelectedVehicleId] = useState("")
  const [registrationMode, setRegistrationMode] = useState<"RENTAL" | "BYOC">(
    "RENTAL",
  )
  const [byocVehicleName, setByocVehicleName] = useState("")
  const [byocVehicleBrand, setByocVehicleBrand] = useState("")
  const [byocVehicleClass, setByocVehicleClass] = useState("")
  const [byocVehicleNotes, setByocVehicleNotes] = useState("")
  const [activeTab, setActiveTab] = useState<DetailTab>("overview")

  const contestQuery = useQuery({
    queryKey: contestQueryKeys.detail(contestId),
    queryFn: () => contestApi.getContest(contestId!),
    enabled: Boolean(contestId),
  })
  const matchesQuery = useQuery({
    queryKey: contestQueryKeys.matches(contestId),
    queryFn: () => contestApi.listMatches(contestId!),
    enabled: Boolean(contestId),
  })
  const myBookingsQuery = useQuery({
    queryKey: bookingQueryKeys.mine({
      status: "CONFIRMED",
      page: 1,
      limit: 50,
    }),
    queryFn: () =>
      bookingApi.listMyBookings({ status: "CONFIRMED", page: 1, limit: 50 }),
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
      if (registrationMode === "BYOC") {
        return contestApi.registerContest(contestId, {
          vehicle_source: "BYOC",
          byoc_vehicle_name: byocVehicleName,
          byoc_vehicle_brand: byocVehicleBrand || undefined,
          byoc_vehicle_class: byocVehicleClass || undefined,
          byoc_vehicle_notes: byocVehicleNotes || undefined,
        })
      }
      return contestApi.registerContest(contestId, {
        booking_id: selectedBookingId,
        vehicle_id: selectedVehicleId,
        vehicle_source: "RENTAL",
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: contestQueryKeys.myRegistrations(),
      })
      void queryClient.invalidateQueries({
        queryKey: contestQueryKeys.detail(contestId),
      })
      void queryClient.invalidateQueries({
        queryKey: contestQueryKeys.matches(contestId),
      })
      setActiveTab("registration")
    },
  })
  const entryFeePaymentMutation = useMutation({
    mutationFn: async (registrationId: string) =>
      contestApi.createEntryFeePayment(registrationId),
  })

  const contest = contestQuery.data
  const bookingOptions = myBookingsQuery.data?.data ?? []
  const selectedBooking = bookingDetailQuery.data
  const existingRegistration = useMemo(
    () =>
      contest?.my_registration ??
      myRegistrationsQuery.data?.find((item) => item.contestId === contestId) ??
      null,
    [contest?.my_registration, myRegistrationsQuery.data, contestId],
  )
  const matches = useMemo(() => matchesQuery.data ?? [], [matchesQuery.data])
  const groupedMatches = useMemo(() => groupMatchesByRound(matches), [matches])
  const myMatches = useMemo(
    () =>
      matches.filter((match) =>
        match.participants.some(
          (participant) => participant.registration?.is_my_registration,
        ),
      ),
    [matches],
  )
  const selectedVehicle =
    selectedBooking?.vehicles.find(
      (vehicle) => vehicle.vehicleId === selectedVehicleId,
    ) ?? null
  const runtimeSummary = contest?.runtime_summary
  const highlightRounds = contest?.highlight_rounds ?? runtimeSummary?.highlight_rounds ?? []
  const leaderboard = contest?.published_leaderboard ?? null
  const effectiveStatus = contest ? getEffectiveContestStatus(contest) : null
  const registrationAvailability = contest
    ? getContestRegistrationAvailability(contest)
    : null
  const registrationClosed = registrationAvailability !== "AVAILABLE"
  const allowsByoc =
    contest?.vehicle_rule?.vehicle_policy === "BYOC_ONLY" ||
    contest?.vehicle_rule?.vehicle_policy === "MIXED"
  const rentalOnly = contest?.vehicle_rule?.vehicle_policy === "RENTAL_ONLY"
  const prizeStructure = contest?.prize_structure
  const prizeItems = Array.isArray(prizeStructure?.items)
    ? (prizeStructure.items as Array<Record<string, unknown>>)
    : Array.isArray(prizeStructure?.tiers)
      ? (prizeStructure.tiers as Array<Record<string, unknown>>)
      : []
  const bookingHelperMessage = useMemo(() => {
    if (!contest) return null
    if (myBookingsQuery.isLoading) {
      return "Đang tải danh sách booking phù hợp..."
    }
    if (bookingOptions.length > 0) return null

    const branchName = contest.host_branch?.cafe?.name ?? "chi nhánh tổ chức"
    const trackName = contest.track_type?.name ?? "track tương ứng"
    return `Bạn chưa có booking CONFIRMED phù hợp tại ${branchName} với track ${trackName}. Hãy tạo booking trước rồi quay lại đăng ký contest.`
  }, [contest, myBookingsQuery.isLoading, bookingOptions.length])

  const handleRegister = async () => {
    try {
      const registration = await registerMutation.mutateAsync()
      toast.success("Đăng ký tham gia giải đấu thành công!")
      if (
        (registration.entryFeeAmount ?? 0) > 0 &&
        registration.paymentStatus === "PENDING_PAYMENT"
      ) {
        const payment = await entryFeePaymentMutation.mutateAsync(
          registration.id,
        )
        window.location.assign(payment.payment_url)
      }
    } catch (error) {
      toast.error("Không thể đăng ký giải đấu", {
        description: getErrorMessage(error),
      })
    }
  }

  const handleContinuePayment = async () => {
    if (!existingRegistration) return
    try {
      const payment = await entryFeePaymentMutation.mutateAsync(
        existingRegistration.id,
      )
      window.location.assign(payment.payment_url)
    } catch (error) {
      toast.error("Không thể tạo thanh toán lệ phí", {
        description: getErrorMessage(error),
      })
    }
  }

  return (
    <section className="bg-[#f7f4f2]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Link
        to={routePaths.contests}
        className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[#5d5f5f] transition hover:text-[#1f2424]"
      >
        <ArrowLeft className="size-4" />
        <span>Quay lại danh sách giải đấu</span>
      </Link>

      {!contest ? (
        <div className="h-96 animate-pulse rounded-3xl bg-muted" />
      ) : (
        <div className="space-y-8">
          <ContestHero contest={contest} effectiveStatus={effectiveStatus ?? contest.status} />

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as DetailTab)}
            className="space-y-6"
          >
            <TabsList className="flex w-full flex-wrap gap-2 rounded-2xl border border-[#e5e2e1] bg-white p-2 shadow-sm">
              <TabsTrigger value="overview" className="rounded-xl px-4 py-2.5 data-[state=active]:bg-[#1f2424] data-[state=active]:text-white">
                Tổng quan
              </TabsTrigger>
              <TabsTrigger value="matches" className="rounded-xl px-4 py-2.5 data-[state=active]:bg-[#1f2424] data-[state=active]:text-white">
                Trận đấu
              </TabsTrigger>
              <TabsTrigger
                value="leaderboard"
                className="rounded-xl px-4 py-2.5 data-[state=active]:bg-[#1f2424] data-[state=active]:text-white"
              >
                Bảng xếp hạng
              </TabsTrigger>
              <TabsTrigger
                value="registration"
                className="rounded-xl px-4 py-2.5 data-[state=active]:bg-[#1f2424] data-[state=active]:text-white"
              >
                Đăng ký của tôi
              </TabsTrigger>
            </TabsList>

            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-6">
                <TabsContent value="overview" className="mt-0 space-y-6">
                  <ContestSummaryCards contest={contest} />
                  <ContestPrizeAndBranches
                    contest={contest}
                    prizeItems={prizeItems}
                  />
                  <ContestTimeline contest={contest} />
                </TabsContent>

                <TabsContent value="matches" className="mt-0 space-y-6">
                  <ContestRuntimeOverview
                    effectiveStatus={effectiveStatus ?? contest.status}
                    runtimeSummary={runtimeSummary}
                    highlightRounds={highlightRounds}
                  />
                  <ContestBracketBoard
                    matches={matches}
                    groupedMatches={groupedMatches}
                    existingRegistration={existingRegistration}
                    loading={matchesQuery.isLoading}
                  />
                </TabsContent>

                <TabsContent value="leaderboard" className="mt-0 space-y-6">
                  <ContestLeaderboardSection leaderboard={leaderboard} />
                </TabsContent>

                <TabsContent value="registration" className="mt-0 space-y-6">
                  {existingRegistration ? (
                    <MyRegistrationMatches
                      registration={existingRegistration}
                      matches={myMatches}
                      loading={matchesQuery.isLoading}
                    />
                  ) : (
                    <Card className="rounded-3xl border border-slate-200/80 p-6 shadow-sm">
                      <div className="flex items-start gap-3">
                        <InfoIcon className="mt-0.5 size-5 shrink-0 text-orange-500" />
                        <div className="space-y-2">
                          <h3 className="text-lg font-extrabold text-slate-900">
                            Chưa có đăng ký của bạn
                          </h3>
                          <p className="text-sm text-slate-500">
                            Hãy hoàn thành đăng ký ở khung bên phải. Sau khi
                            được duyệt và được xếp trận, bracket của bạn sẽ hiện
                            tại đây.
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}
                </TabsContent>
              </div>

              <div className="space-y-6">
                <ContestAsideStatus
                  effectiveStatus={effectiveStatus ?? contest.status}
                  runtimeSummary={runtimeSummary}
                  existingRegistration={existingRegistration}
                />
                <ContestRegistrationPanel
                  contest={contest}
                  registrationAvailability={registrationAvailability ?? "DRAFT"}
                  role={role}
                  profileName={profile?.email ?? profile?.fullName ?? "--"}
                  existingRegistration={existingRegistration}
                  entryFeePaymentPending={entryFeePaymentMutation.isPending}
                  onContinuePayment={() => void handleContinuePayment()}
                  allowsByoc={allowsByoc}
                  rentalOnly={rentalOnly}
                  registrationMode={registrationMode}
                  setRegistrationMode={setRegistrationMode}
                  byocVehicleName={byocVehicleName}
                  setByocVehicleName={setByocVehicleName}
                  byocVehicleBrand={byocVehicleBrand}
                  setByocVehicleBrand={setByocVehicleBrand}
                  byocVehicleClass={byocVehicleClass}
                  setByocVehicleClass={setByocVehicleClass}
                  byocVehicleNotes={byocVehicleNotes}
                  setByocVehicleNotes={setByocVehicleNotes}
                  bookingOptions={bookingOptions}
                  selectedBookingId={selectedBookingId}
                  setSelectedBookingId={setSelectedBookingId}
                  selectedVehicleId={selectedVehicleId}
                  setSelectedVehicleId={setSelectedVehicleId}
                  selectedBooking={selectedBooking}
                  selectedVehicle={selectedVehicle}
                  bookingHelperMessage={bookingHelperMessage}
                  registrationClosed={registrationClosed}
                  registerPending={registerMutation.isPending}
                  onRegister={() => void handleRegister()}
                />
              </div>
            </div>
          </Tabs>
        </div>
      )}
      </div>
    </section>
  )
}

function ContestHero({
  contest,
  effectiveStatus,
}: {
  contest: ContestItem
  effectiveStatus: ContestItem["status"]
}) {
  const statusClass = getContestStatusClass(effectiveStatus)

  return (
    <section className="overflow-hidden rounded-2xl border border-[#e5e2e1] bg-white shadow-sm">
      <div className="relative min-h-[340px] overflow-hidden bg-[#1f2424] p-6 text-white sm:p-8 lg:p-10">
        {contest.banner_image_url ? (
          <img
            src={contest.banner_image_url}
            alt={contest.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(31,36,36,0.94),rgba(31,36,36,0.72)_56%,rgba(196,90,26,0.38))]" />
        <div className="relative z-10 flex min-h-[292px] flex-col justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-orange-100 backdrop-blur">
              {contest.contest_type?.name ?? "Giải đấu"} ·{" "}
              {contest.contest_format?.name ?? "Standard"}
            </span>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass}`}
            >
              {getContestStatusLabel(effectiveStatus)}
            </span>
          </div>
          <div className="max-w-4xl">
            <h1 className="mt-8 text-3xl font-black leading-tight sm:text-5xl">
              {contest.name}
            </h1>
            <p className="mt-4 max-w-2xl whitespace-pre-line text-sm font-medium leading-7 text-slate-200">
              {contest.description || "Xem thể thức, lịch thi đấu, bracket và bảng xếp hạng công khai của giải."}
            </p>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <HeroFact
              label="Chi nhánh tổ chức"
              value={contest.host_branch?.cafe?.name ?? "--"}
            />
            <HeroFact
              label="Bắt đầu"
              value={formatContestDateTime(contest.starts_at)}
            />
            <HeroFact label="Lệ phí" value={formatCurrency(contest.entry_fee)} />
            <HeroFact
              label="Sức chứa"
              value={
                contest.capacity === null ? "Không giới hạn" : `${contest.capacity}`
              }
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function ContestSummaryCards({ contest }: { contest: ContestItem }) {
  const publicStats = contest.public_stats

  return (
    <>
      <Card className="rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          Thông số chi tiết
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Info
            label="Chi nhánh tổ chức"
            value={contest.host_branch?.cafe?.name ?? "--"}
          />
          <Info label="Loại đường đua" value={contest.track_type?.name ?? "--"} />
          <Info
            label="Mở đăng ký"
            value={formatContestDateTime(contest.registration_opens_at)}
          />
          <Info
            label="Luật sử dụng xe"
            value={getVehiclePolicyLabel(
              contest.vehicle_rule?.vehicle_policy as string,
            )}
          />
          <Info
            label="Hạn chót đăng ký"
            value={formatContestDateTime(contest.registration_closes_at)}
          />
          <Info
            label="Thời gian bắt đầu"
            value={formatContestDateTime(contest.starts_at)}
          />
        </div>
      </Card>

      <Card className="rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          Tổng quan tham gia
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Info
            label="Đã đăng ký"
            value={String(publicStats?.registration_count ?? 0)}
          />
          <Info
            label="Đã xác nhận"
            value={String(publicStats?.confirmed_count ?? 0)}
          />
          <Info
            label="Còn chỗ"
            value={
              publicStats?.capacity_remaining === null ||
              publicStats?.capacity_remaining === undefined
                ? "--"
                : String(publicStats.capacity_remaining)
            }
          />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <FactStrip
            icon={<Users className="size-4" />}
            label="Hình thức"
            value={contest.contest_format?.name ?? "--"}
          />
          <FactStrip
            icon={<Timer className="size-4" />}
            label="Track type"
            value={contest.track_type?.name ?? "--"}
          />
          <FactStrip
            icon={<MapPinned className="size-4" />}
            label="Điểm thi đấu"
            value={String(contest.participating_branches.length)}
          />
        </div>
      </Card>
    </>
  )
}

function ContestPrizeAndBranches({
  contest,
  prizeItems,
}: {
  contest: ContestItem
  prizeItems: Array<Record<string, unknown>>
}) {
  return (
    <Card className="rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
        Giải thưởng & địa điểm thi đấu
      </h3>
      <div className="mt-4 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-3">
          {prizeItems.length > 0 ? (
            prizeItems.map((item, index) => (
              <div
                key={`${index}-${String(item.position ?? item.rank ?? "prize")}`}
                className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
                  {String(item.position ?? item.rank ?? `Top ${index + 1}`)}
                </p>
                <p className="mt-1 text-sm font-extrabold text-slate-900">
                  {String(
                    item.label ??
                      item.reward ??
                      item.prize ??
                      "Giải thưởng công bố trong điều lệ",
                  )}
                </p>
                {item.note ? (
                  <p className="mt-1 text-xs text-slate-500">
                    {String(item.note)}
                  </p>
                ) : null}
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              Giải thưởng chưa được cấu hình chi tiết trên contest này.
            </div>
          )}
        </div>
        <div className="space-y-3">
          {contest.participating_branches.map((branch) => (
            <div
              key={branch.id}
              className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4"
            >
              <p className="font-bold text-slate-900">
                {branch.cafe?.name ?? branch.cafe_id}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {branch.cafe?.district}, {branch.cafe?.city}
              </p>
              <p className="mt-2 text-xs font-semibold text-slate-500">
                Vai trò: {branch.role} · Check-in{" "}
                {branch.check_in_enabled ? "bật" : "tắt"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

function ContestTimeline({ contest }: { contest: ContestItem }) {
  const timeline = [
    {
      label: "Mở đăng ký",
      value: formatContestDateTime(contest.registration_opens_at),
    },
    {
      label: "Đóng đăng ký",
      value: formatContestDateTime(contest.registration_closes_at),
    },
    {
      label: "Bắt đầu thi đấu",
      value: formatContestDateTime(contest.starts_at),
    },
    {
      label: "Kết thúc dự kiến",
      value: formatContestDateTime(contest.ends_at),
    },
  ]

  return (
    <Card className="rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
      <div className="flex items-center gap-2">
        <CalendarClock className="size-5 text-orange-500" />
        <h3 className="text-lg font-extrabold text-slate-900">
          Hành trình giải đấu
        </h3>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {timeline.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4"
          >
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
              {item.label}
            </p>
            <p className="mt-1 text-sm font-extrabold text-slate-900">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </Card>
  )
}

function ContestRuntimeOverview({
  effectiveStatus,
  runtimeSummary,
  highlightRounds,
}: {
  effectiveStatus: ContestItem["status"]
  runtimeSummary: ContestItem["runtime_summary"]
  highlightRounds: ContestHighlightRound[]
}) {
  return (
    <>
      <Card className="rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">
              Theo dõi các vòng đấu
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Public có thể xem bracket, danh sách người đi tiếp và lịch sử thi
              đấu khi giải đang diễn ra hoặc đã hoàn thành.
            </p>
          </div>
          <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">
            {getContestStatusLabel(effectiveStatus)}
          </span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <Info
            label="Tổng số trận"
            value={String(runtimeSummary?.total_matches ?? 0)}
          />
          <Info
            label="Tổng số vòng"
            value={String(runtimeSummary?.total_rounds ?? 0)}
          />
          <Info
            label="Vòng hiện tại"
            value={runtimeSummary?.current_round_no ? `Vòng ${runtimeSummary.current_round_no}` : "--"}
          />
          <Info
            label="Đã hoàn thành"
            value={String(runtimeSummary?.completed_matches ?? 0)}
          />
        </div>
      </Card>

      <Card className="rounded-3xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Trophy className="size-5 text-orange-500" />
          <h3 className="text-lg font-extrabold text-slate-900">
            Người đã vào vòng trong
          </h3>
        </div>
        <div className="mt-5 space-y-4">
          {highlightRounds.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-sm text-slate-500">
              Chưa có dữ liệu vòng đấu nổi bật để hiển thị.
            </div>
          ) : (
            highlightRounds.map((round) => (
              <div
                key={round.round_no}
                className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-extrabold text-slate-900">
                      {round.label || `Vòng ${round.round_no}`}
                    </p>
                    <p className="text-xs font-semibold text-slate-500">
                      {round.completed_match_count}/{round.match_count} trận đã
                      chốt kết quả
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-bold text-white">
                    {round.winners.length} người đi tiếp
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {round.winners.map((winner) => (
                    <div
                      key={`${round.round_no}-${winner.registration_id}`}
                      className="rounded-xl border border-orange-100 bg-white p-3"
                    >
                      <p className="font-bold text-slate-900">
                        {winner.participant_name ??
                          winner.participant_email ??
                          `Registration ${winner.registration_id.slice(0, 8)}`}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Đi tiếp từ {winner.source_match_name ?? "trận đã hoàn thành"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </>
  )
}

function ContestBracketBoard({
  matches,
  groupedMatches,
  existingRegistration,
  loading,
}: {
  matches: ContestMatch[]
  groupedMatches: Array<{ roundNo: number; matches: ContestMatch[] }>
  existingRegistration: ContestRegistration | null
  loading: boolean
}) {
  return (
    <Card className="rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
      <div className="flex items-center gap-2 text-slate-900">
        <Swords className="size-5 text-orange-500" />
        <h3 className="text-lg font-extrabold">Sơ đồ thi đấu</h3>
      </div>
      <p className="mt-2 text-sm text-slate-500">
        Hiển thị theo từng vòng, đồng thời tô nổi các trận có bạn tham gia nếu
        bạn đã đăng ký vào giải.
      </p>

      <div className="mt-5">
        {loading ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-72 animate-pulse rounded-2xl bg-slate-100"
              />
            ))}
          </div>
        ) : matches.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm font-medium text-slate-500">
            Chưa có trận nào được công bố trên bracket của giải đấu này.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex min-w-max gap-4 pb-2">
              {groupedMatches.map((group) => (
                <section key={group.roundNo} className="w-[320px] shrink-0 space-y-3">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                      Vòng {group.roundNo}
                    </p>
                  </div>
                  {group.matches.map((match) => {
                    const hasMyParticipant = match.participants.some(
                      (participant) =>
                        participant.registration?.is_my_registration ||
                        participant.registration_id === existingRegistration?.id,
                    )
                    return (
                      <article
                        key={match.id}
                        className={`rounded-2xl border p-4 ${
                          hasMyParticipant
                            ? "border-orange-200 bg-orange-50/60"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-extrabold text-slate-900">
                              {formatMatchLabel(match)}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-slate-500">
                              {formatContestDateTime(match.scheduled_at)}
                            </p>
                          </div>
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${getMatchStatusClass(match.status)}`}
                          >
                            {getMatchStatusLabel(match.status)}
                          </span>
                        </div>
                        <div className="mt-3 space-y-2">
                          {match.participants.length > 0 ? (
                            match.participants.map((participant) => (
                              <BracketParticipantRow
                                key={participant.id}
                                participant={participant}
                                highlight={
                                  participant.registration?.is_my_registration ||
                                  participant.registration_id === existingRegistration?.id
                                }
                              />
                            ))
                          ) : (
                            <div className="rounded-xl border border-dashed border-slate-200 px-3 py-3 text-sm text-slate-500">
                              Chưa chốt người thi đấu cho trận này.
                            </div>
                          )}
                        </div>
                      </article>
                    )
                  })}
                </section>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

function ContestLeaderboardSection({
  leaderboard,
}: {
  leaderboard: ContestLeaderboardPayload | null
}) {
  return (
    <Card className="rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
      <div className="flex items-center gap-2">
        <Trophy className="size-5 text-orange-500" />
        <h3 className="text-lg font-extrabold text-slate-900">
          Bảng xếp hạng công bố
        </h3>
      </div>
      <p className="mt-2 text-sm text-slate-500">
        Bảng xếp hạng chỉ hiển thị khi provider đã publish kết quả chính thức.
      </p>

      {!leaderboard?.entries?.length ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
          Chưa có leaderboard được công bố cho giải đấu này.
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Info label="Chế độ xếp hạng" value={leaderboard.mode} />
            <Info
              label="Số người trên bảng"
              value={String(leaderboard.entries.length)}
            />
            <Info
              label="Công bố lúc"
              value={formatContestDateTime(leaderboard.published_at)}
            />
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="pb-3">Hạng</th>
                  <th className="pb-3">Người chơi</th>
                  <th className="pb-3">Thắng</th>
                  <th className="pb-3">Lap tốt nhất</th>
                  <th className="pb-3">Tổng thời gian</th>
                  <th className="pb-3">Số trận</th>
                  <th className="pb-3">Vòng cao nhất</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaderboard.entries.map((entry) => (
                  <tr key={entry.registration_id}>
                    <td className="py-3 font-black text-slate-900">
                      {entry.rank}
                    </td>
                    <td className="py-3">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-900">
                          {entry.display_name ??
                            `Registration ${entry.registration_id.slice(0, 8)}`}
                        </p>
                        {entry.driver_title_label ? (
                          <p className="text-xs font-bold text-orange-700">
                            {entry.driver_title_label}
                          </p>
                        ) : null}
                      </div>
                    </td>
                    <td className="py-3 text-slate-600">{entry.wins}</td>
                    <td className="py-3 text-slate-600">
                      {formatDurationSeconds(entry.best_lap_seconds)}
                    </td>
                    <td className="py-3 text-slate-600">
                      {formatDurationSeconds(entry.total_time_seconds)}
                    </td>
                    <td className="py-3 text-slate-600">
                      {entry.matches_completed}
                    </td>
                    <td className="py-3 text-slate-600">
                      {entry.progressed_round}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  )
}

function MyRegistrationMatches({
  registration,
  matches,
  loading,
}: {
  registration: ContestRegistration
  matches: ContestMatch[]
  loading: boolean
}) {
  return (
    <Card className="rounded-2xl border border-[#e5e2e1] bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 text-slate-900">
        <Swords className="size-5 text-orange-500" />
        <h3 className="text-lg font-extrabold">Bracket của bạn</h3>
      </div>
      <p className="mt-2 text-sm text-slate-500">
        Tập trung vào các trận bạn tham gia và đối thủ trực tiếp của bạn.
      </p>

      <div className="mt-5 space-y-4">
        {loading ? (
          Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-2xl bg-slate-100"
            />
          ))
        ) : matches.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm font-medium text-slate-500">
            Bạn chưa có match nào hiển thị trong bracket hiện tại.
          </div>
        ) : (
          matches.map((match) => {
            const myParticipant =
              match.participants.find(
                (participant) =>
                  participant.registration?.is_my_registration ||
                  participant.registration_id === registration.id,
              ) ?? null
            const opponents = match.participants.filter(
              (participant) =>
                !participant.registration?.is_my_registration &&
                participant.registration_id !== registration.id,
            )

            return (
              <article
                key={match.id}
                className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-base font-bold text-slate-900">
                      {formatMatchLabel(match)}
                    </p>
                    <p className="text-sm text-slate-500">
                      Thi đấu lúc {formatContestDateTime(match.scheduled_at)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${getMatchStatusClass(match.status)}`}
                  >
                    {getMatchStatusLabel(match.status)}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <BracketCard
                    title="Bạn"
                    name={
                      myParticipant
                        ? getMatchParticipantName(myParticipant)
                        : (registration.participant?.fullName ??
                          registration.participant?.email ??
                          "Người chơi của bạn")
                    }
                    detail={
                      myParticipant?.status
                        ? `Trạng thái: ${myParticipant.status}`
                        : "Chờ cập nhật vào trận"
                    }
                    titleLabel={myParticipant?.registration?.driver_title_label}
                    highlight
                  />
                  <BracketCard
                    title="Đối thủ"
                    name={
                      opponents[0]
                        ? getMatchParticipantName(opponents[0])
                        : "Chưa xác định"
                    }
                    detail={
                      opponents[0]?.status
                        ? `Trạng thái: ${opponents[0].status}`
                        : "Chưa có người ghép trận"
                    }
                    titleLabel={opponents[0]?.registration?.driver_title_label}
                  />
                </div>
              </article>
            )
          })
        )}
      </div>
    </Card>
  )
}

function ContestAsideStatus({
  effectiveStatus,
  runtimeSummary,
  existingRegistration,
}: {
  effectiveStatus: ContestItem["status"]
  runtimeSummary: ContestItem["runtime_summary"]
  existingRegistration: ContestRegistration | null
}) {
  return (
    <Card className="rounded-2xl border border-[#e5e2e1] bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-5 text-emerald-500" />
        <h3 className="text-lg font-black text-[#1f2424]">
          Trạng thái theo dõi
        </h3>
      </div>
      <div className="mt-4 space-y-3">
        <StatusRow label="Giải đấu" value={getContestStatusLabel(effectiveStatus)} />
        <StatusRow
          label="Round hiện tại"
          value={
            runtimeSummary?.current_round_no
              ? `Vòng ${runtimeSummary.current_round_no}`
              : "Chưa có"
          }
        />
        <StatusRow
          label="Trận đang live"
          value={runtimeSummary?.has_live_matches ? "Có" : "Không"}
        />
        <StatusRow
          label="Hành trình của bạn"
          value={
            existingRegistration?.customerJourneyStatus
              ? getJourneyStatusLabel(existingRegistration.customerJourneyStatus)
              : "Chưa đăng ký"
          }
        />
      </div>
    </Card>
  )
}

function ContestRegistrationPanel({
  contest,
  registrationAvailability,
  role,
  profileName,
  existingRegistration,
  entryFeePaymentPending,
  onContinuePayment,
  allowsByoc,
  rentalOnly,
  registrationMode,
  setRegistrationMode,
  byocVehicleName,
  setByocVehicleName,
  byocVehicleBrand,
  setByocVehicleBrand,
  byocVehicleClass,
  setByocVehicleClass,
  byocVehicleNotes,
  setByocVehicleNotes,
  bookingOptions,
  selectedBookingId,
  setSelectedBookingId,
  selectedVehicleId,
  setSelectedVehicleId,
  selectedBooking,
  selectedVehicle,
  bookingHelperMessage,
  registrationClosed,
  registerPending,
  onRegister,
}: {
  contest: ContestItem
  registrationAvailability: ContestRegistrationAvailability
  role: string | null
  profileName: string
  existingRegistration: ContestRegistration | null
  entryFeePaymentPending: boolean
  onContinuePayment: () => void
  allowsByoc: boolean
  rentalOnly: boolean
  registrationMode: "RENTAL" | "BYOC"
  setRegistrationMode: (mode: "RENTAL" | "BYOC") => void
  byocVehicleName: string
  setByocVehicleName: (value: string) => void
  byocVehicleBrand: string
  setByocVehicleBrand: (value: string) => void
  byocVehicleClass: string
  setByocVehicleClass: (value: string) => void
  byocVehicleNotes: string
  setByocVehicleNotes: (value: string) => void
  bookingOptions: Array<{
    id: string
    slotStart: string
  }>
  selectedBookingId: string
  setSelectedBookingId: (value: string) => void
  selectedVehicleId: string
  setSelectedVehicleId: (value: string) => void
  selectedBooking: {
    slotStart: string
    cafe?: { name?: string | null } | null
    track_type_name?: string | null
    vehicles: Array<{
      vehicleId: string
      catalogName?: string | null
      identifier?: string | null
    }>
  } | undefined
  selectedVehicle:
    | {
        vehicleId: string
        catalogName?: string | null
        identifier?: string | null
      }
    | null
  bookingHelperMessage: string | null
  registrationClosed: boolean
  registerPending: boolean
  onRegister: () => void
}) {
  const registrationBlockedMessage = getRegistrationBlockedMessage(
    registrationAvailability,
    contest,
  )

  return (
    <Card className="rounded-2xl border border-[#e5e2e1] bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-orange-500" />
          <h3 className="text-lg font-black text-[#1f2424]">
            Đăng ký tham gia
          </h3>
        </div>
        <span className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-black ${registrationClosed ? "border-amber-200 bg-amber-50 text-amber-800" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
          {registrationClosed ? getClosedButtonLabel(registrationAvailability) : "Đang mở"}
        </span>
      </div>

      <div className="mt-5">
        {role !== "customer" ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
            <p className="text-sm font-semibold text-slate-600">
              Vui lòng đăng nhập với tài khoản Khách hàng để đăng ký tham gia
              giải đấu này.
            </p>
          </div>
        ) : existingRegistration ? (
          <div className="space-y-4 rounded-2xl border border-orange-100 bg-orange-50/30 p-5">
            <div className="flex items-center gap-2 text-emerald-600">
              <ShieldCheck className="size-5 shrink-0" />
              <span className="text-sm font-bold">
                Bạn đã đăng ký giải đấu này
              </span>
            </div>
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getJourneyStatusClass(existingRegistration.customerJourneyStatus)}`}
            >
              {getJourneyStatusLabel(existingRegistration.customerJourneyStatus)}
            </span>
            <div className="grid grid-cols-2 gap-3 border-t border-orange-100 pt-2 text-xs">
              <div>
                <p className="font-bold text-slate-400">Trạng thái đăng ký</p>
                <p className="mt-1 text-sm font-extrabold text-slate-900">
                  {getRegistrationStatusLabel(existingRegistration.status)}
                </p>
              </div>
              <div>
                <p className="font-bold text-slate-400">Lệ phí thi đấu</p>
                <p className="mt-1 text-sm font-extrabold text-slate-900">
                  {getPaymentStatusLabel(existingRegistration.paymentStatus)}
                </p>
              </div>
            </div>
            {existingRegistration.checkInCode ? (
              <div className="rounded-xl border border-orange-100/50 bg-white p-3 text-center">
                <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                  Mã điểm danh (Check-in)
                </p>
                <p className="mt-1 text-lg font-black tracking-widest text-slate-900">
                  {existingRegistration.checkInCode}
                </p>
              </div>
            ) : null}
            {existingRegistration.paymentStatus === "PENDING_PAYMENT" ? (
              <Button
                type="button"
                className="w-full rounded-xl bg-orange-600 py-5 text-sm font-bold text-white hover:bg-orange-700"
                disabled={entryFeePaymentPending}
                onClick={onContinuePayment}
              >
                {entryFeePaymentPending
                  ? "Đang chuyển sang thanh toán..."
                  : "Thanh toán lệ phí qua VNPay"}
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-start gap-3">
                <CalendarClock className="mt-0.5 size-4 shrink-0 text-orange-500" />
                <div className="space-y-1 text-sm">
                  <p className="font-bold text-slate-900">Điều kiện đăng ký</p>
                  <p className="text-slate-600">
                    Cần có booking <span className="font-semibold">CONFIRMED</span>{" "}
                    đúng chi nhánh, đúng loại track và khung giờ giao với
                    contest.
                  </p>
                  <p className="text-slate-600">
                    Sau khi gửi đăng ký, hệ thống sẽ gửi email xác nhận, tạo
                    thông báo trong app và nhắc lịch gần giờ thi đấu.
                  </p>
                </div>
              </div>
            </div>

            {registrationBlockedMessage ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                {registrationBlockedMessage}
              </div>
            ) : null}

            {allowsByoc ? (
              <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-2">
                <button
                  type="button"
                  className={`rounded-xl px-4 py-3 text-sm font-bold transition ${registrationMode === "RENTAL" ? "bg-slate-900 text-white" : "bg-white text-slate-600"}`}
                  disabled={
                    contest.vehicle_rule?.vehicle_policy === "BYOC_ONLY" ||
                    registrationClosed
                  }
                  onClick={() => setRegistrationMode("RENTAL")}
                >
                  Đi bằng xe thuê
                </button>
                <button
                  type="button"
                  className={`rounded-xl px-4 py-3 text-sm font-bold transition ${registrationMode === "BYOC" ? "bg-orange-600 text-white" : "bg-white text-slate-600"}`}
                  disabled={rentalOnly || registrationClosed}
                  onClick={() => setRegistrationMode("BYOC")}
                >
                  Đi bằng xe cá nhân
                </button>
              </div>
            ) : null}

            {registrationMode === "BYOC" ? (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label className="mb-2 block text-xs font-bold text-slate-700">
                      Tên xe cá nhân
                    </Label>
                    <Input
                      value={byocVehicleName}
                      onChange={(event) =>
                        setByocVehicleName(event.target.value)
                      }
                      disabled={registrationClosed}
                      placeholder="Ví dụ: MST RMX 2.5"
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block text-xs font-bold text-slate-700">
                      Hãng xe
                    </Label>
                    <Input
                      value={byocVehicleBrand}
                      onChange={(event) =>
                        setByocVehicleBrand(event.target.value)
                      }
                      disabled={registrationClosed}
                      placeholder="Ví dụ: MST"
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label className="mb-2 block text-xs font-bold text-slate-700">
                      Class
                    </Label>
                    <Input
                      value={byocVehicleClass}
                      onChange={(event) =>
                        setByocVehicleClass(event.target.value)
                      }
                      disabled={registrationClosed}
                      placeholder="Ví dụ: Drift / Touring"
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block text-xs font-bold text-slate-700">
                      Người đăng ký
                    </Label>
                    <Input value={profileName} readOnly />
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block text-xs font-bold text-slate-700">
                    Ghi chú xe tự mang
                  </Label>
                  <Input
                    value={byocVehicleNotes}
                    onChange={(event) => setByocVehicleNotes(event.target.value)}
                    disabled={registrationClosed}
                    placeholder="Phụ kiện, setup, lưu ý kỹ thuật..."
                  />
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                  Xe cá nhân sẽ đi theo luồng khai báo thủ công và chờ
                  provider/staff duyệt trước khi được xếp thi đấu.
                </div>
              </div>
            ) : (
              <>
                <div>
                  <Label className="mb-2 block text-xs font-bold text-slate-700">
                    Lịch đặt đã xác nhận
                  </Label>
                  <select
                    className="h-10 w-full rounded-lg border border-slate-200 bg-card px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    value={selectedBookingId}
                    disabled={registrationClosed}
                    onChange={(event) => {
                      setSelectedBookingId(event.target.value)
                      setSelectedVehicleId("")
                    }}
                  >
                    <option value="">-- Chọn lịch đặt sân phù hợp --</option>
                    {bookingOptions.map((booking) => (
                      <option key={booking.id} value={booking.id}>
                        {new Date(booking.slotStart).toLocaleString("vi-VN", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}{" "}
                        · Mã: {booking.id.slice(0, 8)}
                      </option>
                    ))}
                  </select>
                  {bookingHelperMessage ? (
                    <div className="mt-2 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      <InfoIcon className="mt-0.5 size-3.5 shrink-0" />
                      <span>{bookingHelperMessage}</span>
                    </div>
                  ) : null}
                </div>

                <div>
                  <Label className="mb-2 block text-xs font-bold text-slate-700">
                    Xe thuê từ lịch đặt
                  </Label>
                  <select
                    className="h-10 w-full rounded-lg border border-slate-200 bg-card px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-slate-50 disabled:text-slate-400"
                    value={selectedVehicleId}
                    onChange={(event) =>
                      setSelectedVehicleId(event.target.value)
                    }
                    disabled={registrationClosed || !selectedBooking}
                  >
                    <option value="">-- Chọn xe thi đấu --</option>
                    {selectedBooking?.vehicles.map((vehicle) => (
                      <option key={vehicle.vehicleId} value={vehicle.vehicleId}>
                        {vehicle.catalogName ??
                          vehicle.identifier ??
                          `Xe #${vehicle.vehicleId.slice(0, 8)}`}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedBooking ? (
                  <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-sm sm:grid-cols-2">
                    <MiniInfo
                      label="Booking đã chọn"
                      value={new Date(selectedBooking.slotStart).toLocaleString(
                        "vi-VN",
                        {
                          dateStyle: "short",
                          timeStyle: "short",
                        },
                      )}
                    />
                    <MiniInfo
                      label="Chi nhánh"
                      value={
                        selectedBooking.cafe?.name ??
                        contest.host_branch?.cafe?.name ??
                        "--"
                      }
                    />
                    <MiniInfo
                      label="Track"
                      value={
                        selectedBooking.track_type_name ??
                        contest.track_type?.name ??
                        "--"
                      }
                    />
                    <MiniInfo
                      label="Xe thi đấu"
                      value={
                        selectedVehicle?.catalogName ??
                        selectedVehicle?.identifier ??
                        (selectedVehicle
                          ? `Xe #${selectedVehicle.vehicleId.slice(0, 8)}`
                          : "--")
                      }
                    />
                  </div>
                ) : null}
              </>
            )}

            <div>
              <Label className="mb-2 block text-xs font-bold text-slate-700">
                Lệ phí giải đấu
              </Label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-3 size-4 text-slate-400" />
                <Input
                  className="border-slate-200 pl-9 font-bold text-slate-900"
                  value={formatCurrency(contest.entry_fee)}
                  readOnly
                />
              </div>
            </div>

            <Button
              type="button"
              className="mt-6 w-full rounded-xl bg-orange-600 py-6 text-sm font-bold text-white shadow-md shadow-orange-600/10 transition hover:bg-orange-700"
              disabled={
                registrationClosed ||
                registerPending ||
                (registrationMode === "BYOC"
                  ? byocVehicleName.trim().length === 0
                  : !selectedBookingId || !selectedVehicleId)
              }
              onClick={onRegister}
            >
              {registerPending
                ? "Đang gửi đăng ký..."
                : registrationClosed
                  ? getClosedButtonLabel(registrationAvailability)
                  : "Gửi đăng ký tham gia"}
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}

function HeroFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-orange-100/80">
        {label}
      </p>
      <p className="mt-2 text-sm font-bold text-white">{value}</p>
    </div>
  )
}

function BracketParticipantRow({
  participant,
  highlight = false,
}: {
  participant: ContestMatchParticipant
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-xl border px-3 py-3 ${
        highlight
          ? "border-orange-200 bg-white"
          : "border-slate-200 bg-slate-50/60"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-bold text-slate-900">
          {getMatchParticipantName(participant)}
        </p>
        <DriverTitleChip label={participant.registration?.driver_title_label} />
        {participant.is_winner ? (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
            Winner
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-xs font-semibold text-slate-500">
        {participant.status}
        {participant.finish_position
          ? ` · Về ${participant.finish_position}`
          : ""}
      </p>
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
    <div
      className={`rounded-2xl border p-4 ${highlight ? "border-orange-200 bg-orange-50/70" : "border-slate-200 bg-white"}`}
    >
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {title}
      </p>
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
      <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-extrabold text-slate-900">{value}</p>
    </div>
  )
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 font-semibold text-slate-900">{value}</p>
    </div>
  )
}

function FactStrip({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
      <div className="flex size-9 items-center justify-center rounded-xl bg-white text-orange-600">
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p className="text-sm font-extrabold text-slate-900">{value}</p>
      </div>
    </div>
  )
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm">
      <span className="font-semibold text-slate-500">{label}</span>
      <span className="font-extrabold text-slate-900">{value}</span>
    </div>
  )
}

function getVehiclePolicyLabel(policy: string | null | undefined) {
  if (!policy) return "--"
  switch (policy) {
    case "RENTAL_ONLY":
      return "Chỉ sử dụng xe thuê của chi nhánh"
    case "BYOC_ONLY":
      return "Chỉ sử dụng xe cá nhân"
    case "MIXED":
      return "Hỗn hợp (Xe thuê hoặc Xe cá nhân)"
    default:
      return policy
  }
}

function formatCurrency(value: number) {
  if (value === 0) return "Miễn phí"
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value)
}

function getErrorMessage(error: unknown) {
  const maybe = error as { response?: { data?: { message?: string } } }
  return maybe.response?.data?.message ?? "Vui lòng thử lại sau."
}

function getRegistrationBlockedMessage(
  status: ContestRegistrationAvailability,
  contest: ContestItem,
) {
  switch (status) {
    case "NOT_OPEN_YET":
      return `Giải sẽ mở đăng ký từ ${formatContestDateTime(contest.registration_opens_at)}. Bạn có thể xem trước thể thức, chi nhánh và chuẩn bị booking phù hợp.`
    case "CLOSED":
      return `Giải đã đóng đăng ký từ ${formatContestDateTime(contest.registration_closes_at)}. Bạn vẫn có thể vào tab Trận đấu để theo dõi bracket và các vòng đã vào trong.`
    case "RUNNING":
      return "Giải đang diễn ra nên hệ thống không nhận thêm đăng ký mới. Bạn vẫn có thể theo dõi trận live, bracket và kết quả từng vòng."
    case "COMPLETED":
      return "Giải đã kết thúc. Bạn vẫn có thể xem bracket lịch sử và bảng xếp hạng đã công bố."
    case "CANCELLED":
      return "Giải đấu này đã bị hủy và hiện không nhận đăng ký."
    default:
      return null
  }
}

function getClosedButtonLabel(status: ContestRegistrationAvailability) {
  switch (status) {
    case "CLOSED":
      return "Đã đóng đăng ký"
    case "RUNNING":
      return "Giải đang diễn ra"
    case "COMPLETED":
      return "Giải đã kết thúc"
    case "CANCELLED":
      return "Giải đã hủy"
    default:
      return "Chưa mở đăng ký"
  }
}
