import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, Info as InfoIcon, ShieldCheck } from "lucide-react"
import { Link, useParams } from "react-router"

import { routePaths } from "@/app/router/route-paths"
import { useAuthStore } from "@/features/auth/stores/auth.store"
import {
  contestApi,
  contestQueryKeys,
} from "@/features/contests/api/contest.api"
import { groupMatchesByRound, getContestRuntimeFormat } from "@/features/contests/lib/contest-runtime"
import {
  getContestStatusLabel,
  getContestRegistrationAvailability,
  getEffectiveContestStatus,
  getJourneyStatusLabel,
} from "@/features/contests/lib/contest-status"
import type { ContestItem, ContestRegistration } from "@/features/contests/types"
import { Card } from "@/shared/ui/card"
import { Skeleton } from "@/shared/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"

import { ContestBracketBoard, ContestRuntimeOverview } from "./components/ContestBracketSection"
import { ContestHero } from "./components/ContestHero"
import { ContestLeaderboardSection } from "./components/ContestLeaderboardSection"
import {
  ContestPrizeAndBranches,
  ContestSummaryCards,
  ContestTimeline,
} from "./components/ContestOverviewSection"
import { ContestRegistrationPanel } from "./components/ContestRegistrationPanel"
import { StatusRow } from "./components/DetailPrimitives"
import { MyRegistrationMatches } from "./components/MyRegistrationSection"

type DetailTab = "overview" | "matches" | "leaderboard" | "registration"

export function PublicContestDetailPage() {
  const { contestId } = useParams()
  const role = useAuthStore((state) => state.role)
  const profile = useAuthStore((state) => state.user)
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
  const myRegistrationsQuery = useQuery({
    queryKey: contestQueryKeys.myRegistrations(),
    queryFn: () => contestApi.listMyRegistrations(),
    enabled: role === "customer",
  })

  const contest = contestQuery.data
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
  const runtimeSummary = contest?.runtime_summary
  const highlightRounds = contest?.highlight_rounds ?? runtimeSummary?.highlight_rounds ?? []
  const leaderboard = contest?.published_leaderboard ?? null
  const effectiveStatus = contest ? getEffectiveContestStatus(contest) : null
  const registrationAvailability = contest
    ? getContestRegistrationAvailability(contest)
    : null
  const prizeStructure = contest?.prize_structure
  const prizeItems = Array.isArray(prizeStructure?.items)
    ? (prizeStructure.items as Array<Record<string, unknown>>)
    : Array.isArray(prizeStructure?.tiers)
      ? (prizeStructure.tiers as Array<Record<string, unknown>>)
      : []

  return (
    <section className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Link
        to={routePaths.contests}
        className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        <span>Quay lại danh sách giải đấu</span>
      </Link>

      {!contest ? (
        <Skeleton className="h-96 rounded-3xl" />
      ) : (
        <div className="space-y-8">
          <ContestHero contest={contest} effectiveStatus={effectiveStatus ?? contest.status} />

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as DetailTab)}
            className="space-y-6"
          >
            <TabsList className="flex w-full flex-wrap gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm">
              <TabsTrigger value="overview" className="rounded-xl px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Tổng quan
              </TabsTrigger>
              <TabsTrigger value="matches" className="rounded-xl px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Trận đấu
              </TabsTrigger>
              <TabsTrigger
                value="leaderboard"
                className="rounded-xl px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Bảng xếp hạng
              </TabsTrigger>
              <TabsTrigger
                value="registration"
                className="rounded-xl px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
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
                    format={getContestRuntimeFormat(contest)}
                  />
                </TabsContent>

                <TabsContent value="leaderboard" className="mt-0 space-y-6">
                  <ContestLeaderboardSection
                    leaderboard={leaderboard}
                    matches={matches}
                  />
                </TabsContent>

                <TabsContent value="registration" className="mt-0 space-y-6">
                  {existingRegistration ? (
                    <MyRegistrationMatches
                      registration={existingRegistration}
                      matches={myMatches}
                      loading={matchesQuery.isLoading}
                    />
                  ) : (
                    <Card className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                      <div className="flex items-start gap-3">
                        <InfoIcon className="mt-0.5 size-5 shrink-0 text-primary" />
                        <div className="space-y-2">
                          <h3 className="text-lg font-extrabold text-foreground">
                            Chưa có đăng ký của bạn
                          </h3>
                          <p className="text-sm text-muted-foreground">
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
                  onRegistered={() => setActiveTab("registration")}
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
    <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-5 text-emerald-500" />
        <h3 className="text-lg font-black text-foreground">
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
