import { useMemo, useState } from "react"
import { Trophy, Plus, MapPin, Activity } from "lucide-react"

import { Button } from "@/shared/ui/button"
import { ContestClassCreatorDialog } from "./ContestClassCreatorDialog"
import { ContestMatchEditorDialog } from "./ContestMatchEditorDialog"
import { ContestGenerateMatchesDialog } from "./ContestGenerateMatchesDialog"
import { enrichBracketMatches, getRoundLabel, groupMatchesByRound, registrationName } from "../lib/tournament"
import type { BracketMatch, Contest, ContestClass, ContestRegistration, ContestRound } from "../types"

interface ContestBracketsTabProps {
  contest: Contest
  registrations: ContestRegistration[]
  bracketData: {
    classes: ContestClass[]
    rounds: ContestRound[]
    matches: BracketMatch[]
  } | undefined
  bracketSize: number
  onSaveMatchResult: (matchId: string, winnerId: string, score: string) => Promise<void>
  onGenerateMatches: (params: {
    format: "KNOCKOUT" | "MULTI_DRIVER_HEAT" | "TIME_ATTACK"
    drivers_per_match: number
    registration_ids: string[]
    seeding_mode: "MANUAL" | "RANDOM" | "CHECK_IN_ORDER" | "QUALIFYING_RANK"
    cafe_id: string | null
    track_config_id: string | null
  }) => void
  onCreateClass: (data: { code: string; name: string; capacity: number; display_order: number }) => void
  isGeneratePending: boolean
  isCreateClassPending: boolean
}

export function ContestBracketsTab({
  contest,
  registrations,
  bracketData,
  bracketSize,
  onSaveMatchResult,
  onGenerateMatches,
  onCreateClass,
  isGeneratePending,
  isCreateClassPending,
}: ContestBracketsTabProps) {
  const [filterCafeId, setFilterCafeId] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [showClassDialog, setShowClassDialog] = useState(false)
  const [showMatchDialog, setShowMatchDialog] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<BracketMatch | null>(null)

  const bracketMatches = useMemo(
    () => enrichBracketMatches(bracketData?.matches || [], registrations),
    [bracketData?.matches, registrations],
  )

  const filteredMatches = useMemo(() => {
    return bracketMatches.filter((match) => {
      const matchCafeId = (match as any).cafeId || (match as any).cafe_id
      if (filterCafeId !== "all" && matchCafeId !== filterCafeId) return false
      if (filterStatus !== "all" && match.status !== filterStatus) return false
      return true
    })
  }, [bracketMatches, filterCafeId, filterStatus])

  const bracketGroups = useMemo(
    () => groupMatchesByRound(filteredMatches, bracketData?.rounds || []),
    [filteredMatches, bracketData?.rounds],
  )

  const handleMatchClick = (match: BracketMatch) => {
    setSelectedMatch(match)
    setShowMatchDialog(true)
  }

  const renderCompetitor = (match: BracketMatch, slot: "A" | "B") => {
    const registration = slot === "A" ? match.competitorA : match.competitorB
    const registrationId =
      slot === "A"
        ? match.competitorARegistrationId
        : match.competitorBRegistrationId
    const isWinner = Boolean(
      registrationId && match.winnerRegistrationId === registrationId,
    )
    return (
      <div
        className={`flex items-center justify-between rounded p-1.5 text-sm ${isWinner ? "bg-orange-50 font-bold text-orange-700" : "text-[#6f6c6a]"}`}
      >
        <span className="max-w-[160px] truncate">
          {registrationName(registration)}
        </span>
        <span className="font-mono">{isWinner ? "W" : ""}</span>
      </div>
    )
  }

  const selectClass =
    "h-10 w-full rounded-lg border border-[#e5e2e1] bg-[#f6f3f2] px-3 text-sm font-semibold text-[#1c1b1b] outline-none focus:border-orange-500"

  return (
    <>
      <section className="space-y-6 rounded-xl border border-[#e5e2e1] bg-white p-6 shadow-sm">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 border-b border-[#e5e2e1] pb-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="flex items-center gap-2 font-bold text-[#1c1b1b]">
              <Trophy size={18} className="text-orange-600" /> Sơ đồ & Kết quả
              loại trực tiếp
            </h3>
            <p className="mt-0.5 text-[10px] text-[#747878]">
              Click vào trận đấu để ghi nhận kết quả thắng thua!
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowGenerateDialog(true)}
              disabled={isGeneratePending}
              className="bg-orange-600 font-bold text-white hover:bg-orange-700"
            >
              <Plus size={14} className="mr-1" /> Xếp lịch thi đấu
            </Button>
            <Button
              onClick={() => setShowClassDialog(true)}
              variant="outline"
              className="border-[#e5e2e1] font-bold text-[#444748] hover:bg-[#fcf8f8]"
            >
              <Plus size={14} className="mr-1" /> Tạo nhóm (Class)
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-[#e5e2e1] bg-[#fcf8f8] p-4 text-xs md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1 font-bold text-[#6f6c6a]">
              <MapPin size={12} className="text-orange-600" /> Bộ lọc chi nhánh
            </label>
            <select
              value={filterCafeId}
              onChange={(e) => setFilterCafeId(e.target.value)}
              className={selectClass}
            >
              <option value="all">Tất cả chi nhánh</option>
              {contest.participating_cafes?.map((cafe) => (
                <option key={cafe.id} value={cafe.id}>
                  {cafe.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1 font-bold text-[#6f6c6a]">
              <Activity size={12} className="text-orange-600" /> Bộ lọc trạng
              thái
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={selectClass}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="SCHEDULED">Chưa thi đấu (SCHEDULED)</option>
              <option value="COMPLETED">Đã kết thúc (COMPLETED)</option>
              <option value="CANCELLED">Đã hủy (CANCELLED)</option>
            </select>
          </div>
        </div>

        {/* Bracket Board */}
        <div className="overflow-x-auto py-6">
          {bracketGroups.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#c4c7c8] py-8 text-center text-sm text-[#747878]">
              Chưa có bracket. Hãy tạo Class, check-in đủ {bracketSize} người
              chơi rồi bấm xếp lịch.
            </div>
          ) : (
            <div className="flex min-w-[760px] items-stretch gap-5 px-4">
              {bracketGroups.map((group) => (
                <div
                  key={group.round?.id ?? group.matches[0]?.id}
                  className="flex min-w-64 flex-1 flex-col justify-center gap-3"
                >
                  <div className="border-b border-[#e5e2e1] pb-1.5 text-center text-xs font-bold uppercase tracking-widest text-[#747878]">
                    {getRoundLabel(group.round)}
                  </div>
                  {group.matches.map((match) => (
                    <button
                      key={match.id}
                      type="button"
                      onClick={() => handleMatchClick(match)}
                      className="cursor-pointer rounded-xl border border-[#e5e2e1] bg-[#fcf8f8] p-3 text-left transition-all hover:border-orange-300 hover:shadow-sm"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3 text-[10px] font-bold text-[#747878]">
                        <span>Trận {match.matchNo}</span>
                        <span className="text-orange-600">
                          {match.metadata?.score
                            ? `Điểm: ${match.metadata.score}`
                            : match.status}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {renderCompetitor(match, "A")}
                        {renderCompetitor(match, "B")}
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Dialogs */}
      <ContestMatchEditorDialog
        open={showMatchDialog}
        onOpenChange={setShowMatchDialog}
        match={selectedMatch}
        onSave={onSaveMatchResult}
      />
      <ContestGenerateMatchesDialog
        open={showGenerateDialog}
        onOpenChange={setShowGenerateDialog}
        contest={contest}
        registrations={registrations}
        isPending={isGeneratePending}
        onGenerate={(params) => {
          onGenerateMatches(params)
          setShowGenerateDialog(false)
        }}
      />
      <ContestClassCreatorDialog
        open={showClassDialog}
        onOpenChange={setShowClassDialog}
        isPending={isCreateClassPending}
        onCreate={(data) => {
          onCreateClass(data)
          setShowClassDialog(false)
        }}
      />
    </>
  )
}
