import { useEffect, useMemo, useState } from "react"
import { Flag, PlayCircle, Trophy } from "lucide-react"
import { contestGenerateMatchesSchema } from "@/features/contests/schemas/contest.schema"
import type {
  ContestItem,
  ContestMatch,
  ContestRegistration,
} from "@/features/contests/types"
import {
  areAllMatchesCompleted,
  formatContestDateTime,
  formatDurationSeconds,
  formatMatchLabel,
  getContestRuntimeFormat,
  getEligibleRuntimeRegistrations,
  getErrorMessage,
  getMatchParticipantName,
  getQualifyingStandings,
  getRegistrationDisplayName,
  groupMatchesByRound,
  isQualifyingFinalFormat,
  splitMatchesByPhase,
} from "@/features/contests/lib/contest-runtime"
import {
  getMatchStatusClass,
  getMatchStatusLabel,
  getMatchTypeLabel,
  getRegistrationStatusLabel,
} from "@/features/contests/lib/contest-status"
import { useGenerateFinalBracket } from "@/features/contests/hooks/use-contest-booking"
import {
  Panel,
  PanelTitle,
} from "@/pages/provider/components/ProviderPrimitives"
import { DriverTitleChip } from "@/features/racing/components/DriverTitleChip"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { ConfirmDialog } from "@/shared/ui/confirm-dialog"
import { toast } from "sonner"
import type { useContestRuntime } from "@/features/contests/hooks/useContestRuntime"

type RuntimeHook = ReturnType<typeof useContestRuntime>

export function ContestMatchBoard({
  contest,
  registrations,
  matches,
  selectedMatchId,
  onSelectMatch,
  runtime,
  showGenerate = true,
}: {
  contest: ContestItem
  registrations: ContestRegistration[]
  matches: ContestMatch[]
  selectedMatchId: string | null
  onSelectMatch: (matchId: string) => void
  runtime: RuntimeHook
  showGenerate?: boolean
}) {
  const eligibleRegistrations = useMemo(
    () => getEligibleRuntimeRegistrations(registrations),
    [registrations],
  )
  const [selectedRegistrationIds, setSelectedRegistrationIds] = useState<
    string[]
  >([])
  const [selectedCafeId, setSelectedCafeId] = useState("")
  const [driversPerMatch, setDriversPerMatch] = useState<number>(2)
  const [seedingMode, setSeedingMode] = useState<"MANUAL" | "CHECK_IN_ORDER">(
    "CHECK_IN_ORDER",
  )

  useEffect(() => {
    queueMicrotask(() => {
      setSelectedRegistrationIds(eligibleRegistrations.map((item) => item.id))
    })
  }, [eligibleRegistrations])

  useEffect(() => {
    queueMicrotask(() => {
      setSelectedCafeId(
        contest.host_branch?.cafe_id ??
          contest.participating_branches[0]?.cafe_id ??
          "",
      )
    })
  }, [contest])

  const matchGroups = useMemo(() => groupMatchesByRound(matches), [matches])

  const isQualifyingFinal = isQualifyingFinalFormat(
    getContestRuntimeFormat(contest),
  )
  const { qualifying: qualifyingMatches, final: finalMatches } = useMemo(
    () => splitMatchesByPhase(matches),
    [matches],
  )
  const qualifyingStandings = useMemo(
    () => getQualifyingStandings(qualifyingMatches),
    [qualifyingMatches],
  )
  const finalistsCount = Number(contest.config?.finalists ?? 4) || 4
  const generateFinalBracketMutation = useGenerateFinalBracket()
  const allQualifyingCompleted = areAllMatchesCompleted(qualifyingMatches)
  const canGenerateFinalBracket =
    isQualifyingFinal && allQualifyingCompleted && finalMatches.length === 0
  const generateFinalHint = !isQualifyingFinal
    ? null
    : finalMatches.length > 0
      ? "Nhánh chung kết đã được tạo."
      : qualifyingMatches.length === 0
        ? "Chưa có trận vòng loại nào."
        : !allQualifyingCompleted
          ? "Hoàn tất tất cả trận vòng loại để sinh bracket chung kết."
          : null

  const handleGenerateFinalBracket = async () => {
    try {
      await generateFinalBracketMutation.mutateAsync(contest.id)
      toast.success("Đã sinh bracket chung kết")
    } catch (error) {
      toast.error("Không thể sinh bracket chung kết", {
        description: getErrorMessage(error).message,
      })
    }
  }

  const handleGenerate = async () => {
    const rawData = {
      cafe_id: selectedCafeId,
      registration_ids: selectedRegistrationIds,
      drivers_per_match: driversPerMatch,
      seeding_mode: seedingMode,
    }

    const result = contestGenerateMatchesSchema.safeParse(rawData)
    if (!result.success) {
      const firstError = result.error.issues[0]
      toast.error(`Lỗi: ${firstError.message}`)
      return
    }

    try {
      await runtime.generateMatchesMutation.mutateAsync(result.data)
      toast.success("Đã tạo các lượt đấu")
    } catch (error) {
      toast.error("Không thể tạo lượt đấu", {
        description: getErrorMessage(error).message,
      })
    }
  }

  return (
    <div
      className={`grid gap-4 ${showGenerate ? "xl:grid-cols-[0.9fr_1.1fr]" : ""}`}
    >
      {showGenerate ? (
        <Panel>
          <PanelTitle
            title="Tạo nhánh thi đấu"
            subtitle="Chỉ người chơi đã điểm danh mới được đưa vào thi đấu."
          />
          <div className="space-y-4">
            <Field label="Chi nhánh vận hành">
              <select
                className="h-10 w-full rounded-lg border border-[#c4c7c8] bg-white px-3 text-sm"
                value={selectedCafeId}
                onChange={(event) => setSelectedCafeId(event.target.value)}
              >
                {contest.participating_branches.map((branch) => (
                  <option key={branch.id} value={branch.cafe_id}>
                    {branch.cafe?.name ?? branch.cafe_id}
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Số người mỗi trận/lượt">
                <input
                  type="number"
                  min={1}
                  max={64}
                  className="h-10 w-full rounded-lg border border-[#c4c7c8] bg-white px-3 text-sm"
                  value={driversPerMatch}
                  onChange={(event) =>
                    setDriversPerMatch(Number(event.target.value))
                  }
                />
              </Field>
              <Field label="Cách xếp thứ tự">
                <select
                  className="h-10 w-full rounded-lg border border-[#c4c7c8] bg-white px-3 text-sm"
                  value={seedingMode}
                  onChange={(event) =>
                    setSeedingMode(event.target.value as typeof seedingMode)
                  }
                >
                  <option value="CHECK_IN_ORDER">Theo thứ tự điểm danh</option>
                  <option value="MANUAL">Theo danh sách đã chọn</option>
                </select>
              </Field>
            </div>

            <div>
              <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-[#747878]">
                Người chơi đủ điều kiện vào thi đấu
              </p>
              <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg border border-[#e5e2e1] bg-[#fcf8f8] p-3">
                {eligibleRegistrations.map((registration) => {
                  const checked = selectedRegistrationIds.includes(
                    registration.id,
                  )
                  return (
                    <label
                      key={registration.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-[#e5e2e1] bg-white px-3 py-2"
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) =>
                            setSelectedRegistrationIds((current) =>
                              event.target.checked
                                ? [...current, registration.id]
                                : current.filter(
                                    (item) => item !== registration.id,
                                  ),
                            )
                          }
                        />
                        <span>
                          <span className="flex flex-wrap items-center gap-2 text-sm font-bold text-[#1c1b1b]">
                            <span>
                              {getRegistrationDisplayName(registration)}
                            </span>
                            <DriverTitleChip
                              label={registration.participant?.driverTitleLabel}
                            />
                          </span>
                          {registration.participant?.email ? (
                            <span className="block text-xs font-medium text-[#747878]">
                              {registration.participant.email}
                            </span>
                          ) : null}
                        </span>
                      </span>
                      <span className="text-xs font-semibold text-[#747878]">
                        {getRegistrationStatusLabel(registration.status)} ·{" "}
                        {registration.checkInCode ?? "--"}
                      </span>
                    </label>
                  )
                })}
                {eligibleRegistrations.length === 0 ? (
                  <p className="text-sm font-semibold text-[#747878]">
                    Chưa có người đăng ký đủ điều kiện thi đấu.
                  </p>
                ) : null}
              </div>
            </div>

            <Button
              className="h-10 gap-2 rounded-lg bg-[#1c1b1b] text-white hover:bg-[#313030]"
              onClick={() => void handleGenerate()}
            >
              <PlayCircle className="size-4" />
              Tạo nhánh thi đấu
            </Button>
          </div>
        </Panel>
      ) : null}

      <Panel>
        <PanelTitle
          title="Danh sách trận/lượt"
          subtitle={
            isQualifyingFinal
              ? "Vòng loại tính giờ trước, sau đó sinh bracket chung kết từ bảng xếp hạng."
              : "Theo dõi theo từng vòng và chọn để nhập kết quả."
          }
          action={
            isQualifyingFinal ? (
              <div className="flex flex-col items-end gap-1">
                <ConfirmDialog
                  title="Sinh bracket chung kết?"
                  description={`Hệ thống sẽ lấy top ${finalistsCount} VĐV theo hạng vòng loại (lap tốt nhất) để xếp nhánh knockout chung kết.`}
                  confirmLabel="Sinh bracket"
                  trigger={
                    <Button
                      type="button"
                      className="h-9 gap-2 rounded-lg bg-[#1c1b1b] text-white hover:bg-[#313030]"
                      disabled={!canGenerateFinalBracket}
                    >
                      <Trophy className="size-4" />
                      Sinh bracket chung kết
                    </Button>
                  }
                  onConfirm={handleGenerateFinalBracket}
                />
                {generateFinalHint ? (
                  <p className="text-xs font-semibold text-[#747878]">
                    {generateFinalHint}
                  </p>
                ) : null}
              </div>
            ) : undefined
          }
        />
        {matches.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#c4c7c8] p-10 text-center">
            <Flag className="mx-auto size-8 text-[#c4c7c8]" />
            <p className="mt-3 text-sm font-semibold text-[#747878]">
              Chưa có lượt đấu nào.
            </p>
          </div>
        ) : isQualifyingFinal ? (
          <div className="space-y-4">
            {qualifyingStandings.length > 0 ? (
              <div>
                <h4 className="mb-2 text-sm font-extrabold uppercase tracking-wider text-[#747878]">
                  Bảng xếp hạng vòng loại
                </h4>
                <div className="overflow-x-auto rounded-lg border border-[#e5e2e1]">
                  <table className="w-full min-w-[520px] text-sm">
                    <thead>
                      <tr className="border-b border-[#e5e2e1] bg-[#fcf8f8] text-left text-xs font-extrabold uppercase tracking-wider text-[#747878]">
                        <th className="px-3 py-2">Hạng</th>
                        <th className="px-3 py-2">Người chơi</th>
                        <th className="px-3 py-2">Lap tốt nhất</th>
                        <th className="px-3 py-2">Tổng thời gian</th>
                        <th className="px-3 py-2">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0eeee]">
                      {qualifyingStandings.map((standing, index) => (
                        <tr key={standing.registrationId}>
                          <td className="px-3 py-2 font-bold text-[#1c1b1b]">
                            {index + 1}
                          </td>
                          <td className="px-3 py-2">
                            <span className="flex flex-wrap items-center gap-2 font-semibold text-[#1c1b1b]">
                              {getMatchParticipantName(standing.participant)}
                              <DriverTitleChip
                                label={
                                  standing.participant.registration
                                    ?.driver_title_label
                                }
                                className="px-2 py-0 text-[10px]"
                              />
                            </span>
                          </td>
                          <td className="px-3 py-2 font-semibold text-[#5d5f5f]">
                            {formatDurationSeconds(standing.bestLapSeconds)}
                          </td>
                          <td className="px-3 py-2 font-semibold text-[#5d5f5f]">
                            {formatDurationSeconds(standing.totalTimeSeconds)}
                          </td>
                          <td className="px-3 py-2">
                            {index < finalistsCount ? (
                              <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700">
                                Vào chung kết
                              </Badge>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            <MatchPhaseSection
              title="Vòng loại (Qualifying)"
              matches={qualifyingMatches}
              selectedMatchId={selectedMatchId}
              onSelectMatch={onSelectMatch}
            />
            <MatchPhaseSection
              title="Chung kết (Final)"
              matches={finalMatches}
              emptyLabel="Chưa có nhánh chung kết. Hoàn tất vòng loại rồi bấm “Sinh bracket chung kết”."
              selectedMatchId={selectedMatchId}
              onSelectMatch={onSelectMatch}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {matchGroups.map((group) => (
              <div key={group.roundNo}>
                <h4 className="mb-2 text-sm font-extrabold uppercase tracking-wider text-[#747878]">
                  Vòng {group.roundNo}
                </h4>
                <div className="grid gap-3 lg:grid-cols-2">
                  {group.matches.map((match) => (
                    <button
                      key={match.id}
                      type="button"
                      onClick={() => onSelectMatch(match.id)}
                      className={`rounded-lg border p-4 text-left transition-colors ${
                        selectedMatchId === match.id
                          ? "border-orange-200 bg-orange-50"
                          : "border-[#e5e2e1] bg-white hover:bg-[#fcf8f8]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-extrabold text-[#1c1b1b]">
                            {formatMatchLabel(match)}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-[#747878]">
                            Dự kiến: {formatContestDateTime(match.scheduled_at)}
                          </p>
                        </div>
                        <Badge
                          className={`border ${getMatchStatusClass(match.status)}`}
                        >
                          {getMatchStatusLabel(match.status)}
                        </Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-[#5d5f5f]">
                        <span>{getMatchTypeLabel(match.match_type)}</span>
                        <span>{match.participants.length} người thi đấu</span>
                        <span>Trận #{match.match_no}</span>
                      </div>
                      <div className="mt-3 space-y-1">
                        {match.participants.slice(0, 3).map((participant) => (
                          <div
                            key={participant.id}
                            className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#5d5f5f]"
                          >
                            <span>{getMatchParticipantName(participant)}</span>
                            <DriverTitleChip
                              label={
                                participant.registration?.driver_title_label
                              }
                              className="px-2 py-0 text-[10px]"
                            />
                          </div>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-[#747878]">
        {label}
      </p>
      {children}
    </div>
  )
}

function MatchPhaseSection({
  title,
  matches,
  emptyLabel,
  selectedMatchId,
  onSelectMatch,
}: {
  title: string
  matches: ContestMatch[]
  emptyLabel?: string
  selectedMatchId: string | null
  onSelectMatch: (matchId: string) => void
}) {
  const groups = groupMatchesByRound(matches)
  return (
    <div>
      <h4 className="mb-2 text-sm font-extrabold uppercase tracking-wider text-[#747878]">
        {title}
      </h4>
      {matches.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[#c4c7c8] p-4 text-sm font-semibold text-[#747878]">
          {emptyLabel ?? "Chưa có trận nào."}
        </p>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <div key={group.roundNo} className="grid gap-3 lg:grid-cols-2">
              {group.matches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  selected={selectedMatchId === match.id}
                  onSelect={() => onSelectMatch(match.id)}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MatchCard({
  match,
  selected,
  onSelect,
}: {
  match: ContestMatch
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-lg border p-4 text-left transition-colors ${
        selected
          ? "border-orange-200 bg-orange-50"
          : "border-[#e5e2e1] bg-white hover:bg-[#fcf8f8]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-[#1c1b1b]">
            {formatMatchLabel(match)}
          </p>
          <p className="mt-1 text-xs font-semibold text-[#747878]">
            Dự kiến: {formatContestDateTime(match.scheduled_at)}
          </p>
        </div>
        <Badge className={`border ${getMatchStatusClass(match.status)}`}>
          {getMatchStatusLabel(match.status)}
        </Badge>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-[#5d5f5f]">
        <span>{getMatchTypeLabel(match.match_type)}</span>
        <span>{match.participants.length} người thi đấu</span>
        <span>Trận #{match.match_no}</span>
      </div>
      <div className="mt-3 space-y-1">
        {match.participants.slice(0, 3).map((participant) => (
          <div
            key={participant.id}
            className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#5d5f5f]"
          >
            <span>{getMatchParticipantName(participant)}</span>
            <DriverTitleChip
              label={participant.registration?.driver_title_label}
              className="px-2 py-0 text-[10px]"
            />
          </div>
        ))}
      </div>
    </button>
  )
}
