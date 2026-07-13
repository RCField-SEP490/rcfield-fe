import { useEffect, useMemo, useState } from "react"
import { Flag, PlayCircle } from "lucide-react"
import { contestGenerateMatchesSchema } from "@/features/contests/schemas/contest.schema"
import type { ContestItem, ContestMatch, ContestRegistration } from "@/features/contests/types"
import {
  formatContestDateTime,
  formatMatchLabel,
  getEligibleRuntimeRegistrations,
  getErrorMessage,
  getMatchParticipantName,
  getRegistrationDisplayName,
  groupMatchesByRound,
} from "@/features/contests/lib/contest-runtime"
import { getMatchStatusClass } from "@/features/contests/lib/contest-status"
import { Panel, PanelTitle } from "@/pages/provider/components/ProviderPrimitives"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
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
  const [selectedRegistrationIds, setSelectedRegistrationIds] = useState<string[]>([])
  const [selectedCafeId, setSelectedCafeId] = useState("")
  const [driversPerMatch, setDriversPerMatch] = useState<number>(2)
  const [seedingMode, setSeedingMode] = useState<"MANUAL" | "CHECK_IN_ORDER">("CHECK_IN_ORDER")

  useEffect(() => {
    setSelectedRegistrationIds(eligibleRegistrations.map((item) => item.id))
  }, [eligibleRegistrations])

  useEffect(() => {
    setSelectedCafeId(contest.host_branch?.cafe_id ?? contest.participating_branches[0]?.cafe_id ?? "")
  }, [contest])

  const matchGroups = useMemo(() => groupMatchesByRound(matches), [matches])

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
      toast.success("Đã generate contest runtime")
    } catch (error) {
      toast.error("Không thể generate matches", { description: getErrorMessage(error).message })
    }
  }

  return (
    <div className={`grid gap-4 ${showGenerate ? "xl:grid-cols-[0.9fr_1.1fr]" : ""}`}>
      {showGenerate ? <Panel>
        <PanelTitle title="Generate runtime" subtitle="Chọn branch và registration hợp lệ để sinh runtime thật." />
        <div className="space-y-4">
          <Field label="Branch runtime">
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
            <Field label="Drivers per match">
              <input
                type="number"
                min={1}
                max={64}
                className="h-10 w-full rounded-lg border border-[#c4c7c8] bg-white px-3 text-sm"
                value={driversPerMatch}
                onChange={(event) => setDriversPerMatch(Number(event.target.value))}
              />
            </Field>
            <Field label="Seeding mode">
              <select
                className="h-10 w-full rounded-lg border border-[#c4c7c8] bg-white px-3 text-sm"
                value={seedingMode}
                onChange={(event) => setSeedingMode(event.target.value as typeof seedingMode)}
              >
                <option value="CHECK_IN_ORDER">CHECK_IN_ORDER</option>
                <option value="MANUAL">MANUAL</option>
              </select>
            </Field>
          </div>

          <div>
            <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-[#747878]">
              Eligible registrations
            </p>
            <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg border border-[#e5e2e1] bg-[#fcf8f8] p-3">
              {eligibleRegistrations.map((registration) => {
                const checked = selectedRegistrationIds.includes(registration.id)
                return (
                  <label key={registration.id} className="flex items-center justify-between gap-3 rounded-lg border border-[#e5e2e1] bg-white px-3 py-2">
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) =>
                          setSelectedRegistrationIds((current) =>
                            event.target.checked
                              ? [...current, registration.id]
                              : current.filter((item) => item !== registration.id),
                          )
                        }
                      />
                      <span>
                        <span className="text-sm font-bold text-[#1c1b1b]">{getRegistrationDisplayName(registration)}</span>
                        {registration.participant?.email ? (
                          <span className="block text-xs font-medium text-[#747878]">{registration.participant.email}</span>
                        ) : null}
                      </span>
                    </span>
                    <span className="text-xs font-semibold text-[#747878]">
                      {registration.status} · {registration.checkInCode ?? "--"}
                    </span>
                  </label>
                )
              })}
              {eligibleRegistrations.length === 0 ? (
                <p className="text-sm font-semibold text-[#747878]">Chưa có registration đủ điều kiện runtime.</p>
              ) : null}
            </div>
          </div>

          <Button className="h-10 gap-2 rounded-lg bg-[#1c1b1b] text-white hover:bg-[#313030]" onClick={() => void handleGenerate()}>
            <PlayCircle className="size-4" />
            Generate matches
          </Button>
        </div>
      </Panel> : null}

      <Panel>
        <PanelTitle title="Match board" subtitle="Theo dõi runtime theo round, chọn từng match để nhập kết quả." />
        {matches.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#c4c7c8] p-10 text-center">
            <Flag className="mx-auto size-8 text-[#c4c7c8]" />
            <p className="mt-3 text-sm font-semibold text-[#747878]">Chưa có runtime match nào.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {matchGroups.map((group) => (
              <div key={group.roundNo}>
                <h4 className="mb-2 text-sm font-extrabold uppercase tracking-wider text-[#747878]">
                  Round {group.roundNo}
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
                          <p className="text-sm font-extrabold text-[#1c1b1b]">{formatMatchLabel(match)}</p>
                          <p className="mt-1 text-xs font-semibold text-[#747878]">
                            Scheduled: {formatContestDateTime(match.scheduled_at)}
                          </p>
                        </div>
                        <Badge className={`border ${getMatchStatusClass(match.status)}`}>{match.status}</Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-[#5d5f5f]">
                        <span>{match.match_type}</span>
                        <span>{match.participants.length} participants</span>
                        <span>Match #{match.match_no}</span>
                      </div>
                      <div className="mt-3 space-y-1">
                        {match.participants.slice(0, 3).map((participant) => (
                          <p key={participant.id} className="text-xs font-semibold text-[#5d5f5f]">
                            {getMatchParticipantName(participant)}
                          </p>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-[#747878]">{label}</p>
      {children}
    </div>
  )
}
