import { useState, useEffect } from "react"
import { Play, CheckSquare, Square } from "lucide-react"

import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { trackConfigApi } from "@/features/cafes/api/cafe.api"
import type { Contest, ContestRegistration } from "../types"

type MatchFormat = "KNOCKOUT" | "MULTI_DRIVER_HEAT" | "TIME_ATTACK"
type SeedingMode = "MANUAL" | "RANDOM" | "CHECK_IN_ORDER" | "QUALIFYING_RANK"

interface ContestGenerateMatchesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contest: Contest
  registrations: ContestRegistration[]
  isPending: boolean
  onGenerate: (params: {
    format: MatchFormat
    drivers_per_match: number
    registration_ids: string[]
    seeding_mode: SeedingMode
    cafe_id: string | null
    track_config_id: string | null
  }) => void
}

export function ContestGenerateMatchesDialog({
  open,
  onOpenChange,
  contest,
  registrations,
  isPending,
  onGenerate,
}: ContestGenerateMatchesDialogProps) {
  const [format, setFormat] = useState<MatchFormat>("KNOCKOUT")
  const [driversPerMatch, setDriversPerMatch] = useState(2)
  const [cafeId, setCafeId] = useState("")
  const [trackConfigId, setTrackConfigId] = useState("")
  const [seedingMode, setSeedingMode] = useState<SeedingMode>("MANUAL")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [trackConfigs, setTrackConfigs] = useState<any[]>([])
  const [loadingTracks, setLoadingTracks] = useState(false)

  const checkedInRegs = registrations.filter((r) => r.status === "CHECKED_IN")

  useEffect(() => {
    if (open) {
      setSelectedIds(checkedInRegs.map((r) => r.id))
      if (contest.participating_cafes?.length > 0) {
        setCafeId(contest.participating_cafes[0].id || "")
      }
    }
  }, [open])

  useEffect(() => {
    if (!cafeId) {
      setTrackConfigs([])
      setTrackConfigId("")
      return
    }
    setLoadingTracks(true)
    trackConfigApi
      .listTrackConfigs(cafeId)
      .then((configs) => {
        setTrackConfigs(configs || [])
        setTrackConfigId(configs?.[0]?.id || "")
      })
      .catch(() => {
        setTrackConfigs([])
        setTrackConfigId("")
      })
      .finally(() => setLoadingTracks(false))
  }, [cafeId])

  const toggleReg = (regId: string) => {
    setSelectedIds((prev) =>
      prev.includes(regId)
        ? prev.filter((id) => id !== regId)
        : [...prev, regId],
    )
  }

  const handleGenerate = () => {
    onGenerate({
      format,
      drivers_per_match: driversPerMatch,
      registration_ids: selectedIds,
      seeding_mode: seedingMode,
      cafe_id: cafeId || null,
      track_config_id: trackConfigId || null,
    })
  }

  const selectClass =
    "h-10 w-full rounded-lg border border-[#e5e2e1] bg-[#f6f3f2] px-3 text-sm font-bold text-[#1c1b1b] outline-none focus:border-orange-500 disabled:opacity-50"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[#e5e2e1] bg-white text-[#1c1b1b] max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5 font-extrabold text-[#1c1b1b]">
            <Play className="text-orange-600" size={18} /> Tự động xếp lịch &
            trận đấu
          </DialogTitle>
          <DialogDescription className="text-[#6f6c6a] text-xs">
            Cấu hình các thông số và chọn vận động viên để xếp lịch thi đấu tự
            động.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 text-xs font-semibold">
          {/* Format & Drivers Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[#6f6c6a] font-bold uppercase tracking-wider">
                Thể thức thi đấu
              </label>
              <select
                value={format}
                onChange={(e) => {
                  const fmt = e.target.value as MatchFormat
                  setFormat(fmt)
                  if (fmt === "KNOCKOUT") setDriversPerMatch(2)
                }}
                className={selectClass}
              >
                <option value="KNOCKOUT">
                  Knockout (Đấu loại trực tiếp)
                </option>
                <option value="MULTI_DRIVER_HEAT">
                  Multi-driver Heat (Chạy nhóm/lượt)
                </option>
                <option value="TIME_ATTACK">
                  Time Attack (Đua tính giờ)
                </option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[#6f6c6a] font-bold uppercase tracking-wider">
                Số xe mỗi trận/lượt
              </label>
              <select
                value={driversPerMatch}
                onChange={(e) => setDriversPerMatch(Number(e.target.value))}
                disabled={format === "KNOCKOUT"}
                className={selectClass}
              >
                <option value={2}>2 xe / trận</option>
                <option value={4}>4 xe / trận</option>
                <option value={6}>6 xe / trận</option>
                <option value={8}>8 xe / trận</option>
              </select>
            </div>
          </div>

          {/* Branch & Track Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[#6f6c6a] font-bold uppercase tracking-wider">
                Địa điểm thi đấu
              </label>
              <select
                value={cafeId}
                onChange={(e) => setCafeId(e.target.value)}
                className={selectClass}
              >
                <option value="">Chọn chi nhánh...</option>
                {contest.participating_cafes?.map((cafe) => (
                  <option key={cafe.id} value={cafe.id}>
                    {cafe.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[#6f6c6a] font-bold uppercase tracking-wider flex items-center gap-1">
                Cấu hình sa bàn
                {loadingTracks && (
                  <span className="h-2.5 w-2.5 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
                )}
              </label>
              <select
                value={trackConfigId}
                onChange={(e) => setTrackConfigId(e.target.value)}
                disabled={!cafeId || loadingTracks}
                className={selectClass}
              >
                <option value="">
                  {trackConfigs.length === 0
                    ? "Không tìm thấy sa bàn"
                    : "Chọn sa bàn..."}
                </option>
                {trackConfigs.map((config) => {
                  const typeObj = config.trackType || config.track_type
                  const typeLabel =
                    typeof typeObj === "object" && typeObj
                      ? typeObj.name || typeObj.code || "N/A"
                      : typeObj || "N/A"
                  return (
                    <option key={config.id} value={config.id}>
                      {config.name} ({typeLabel})
                    </option>
                  )
                })}
              </select>
            </div>
          </div>

          {/* Seeding Mode */}
          <div className="space-y-1.5">
            <label className="text-[#6f6c6a] font-bold uppercase tracking-wider">
              Cách xếp hạt giống / Bốc thăm
            </label>
            <select
              value={seedingMode}
              onChange={(e) => setSeedingMode(e.target.value as SeedingMode)}
              className={selectClass}
            >
              <option value="MANUAL">Thủ công (Manual)</option>
              <option value="RANDOM">Ngẫu nhiên (Random)</option>
              <option value="CHECK_IN_ORDER">Theo thứ tự Check-in</option>
              <option value="QUALIFYING_RANK">
                Theo thứ tự Vòng loại (Qualifying Rank)
              </option>
            </select>
          </div>

          {/* Checked-in Participants Checklist */}
          <div className="space-y-2 border-t border-[#e5e2e1] pt-4">
            <div className="flex items-center justify-between text-[#444748]">
              <span className="font-bold">
                Danh sách đã check-in ({checkedInRegs.length})
              </span>
              <span className="rounded-full bg-orange-50 px-2 py-0.5 font-mono text-[10px] text-orange-600">
                Đang chọn: {selectedIds.length} VĐV
              </span>
            </div>

            <div className="mb-2 flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedIds(checkedInRegs.map((r) => r.id))}
                className="rounded border border-[#e5e2e1] bg-[#f6f3f2] px-2 py-1 text-[10px] font-bold text-[#6f6c6a] hover:bg-[#e5e2e1] hover:text-[#1c1b1b]"
              >
                Chọn tất cả
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="rounded border border-[#e5e2e1] bg-[#f6f3f2] px-2 py-1 text-[10px] font-bold text-[#6f6c6a] hover:bg-[#e5e2e1] hover:text-[#1c1b1b]"
              >
                Bỏ chọn tất cả
              </button>
            </div>

            <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-xl border border-[#e5e2e1] bg-[#fcf8f8] p-3">
              {checkedInRegs.length === 0 ? (
                <div className="py-6 text-center font-medium text-[#747878]">
                  Chưa có vận động viên nào check-in.
                </div>
              ) : (
                checkedInRegs.map((reg) => {
                  const isSelected = selectedIds.includes(reg.id)
                  return (
                    <div
                      key={reg.id}
                      onClick={() => toggleReg(reg.id)}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-all ${
                        isSelected
                          ? "bg-orange-50 text-orange-700"
                          : "text-[#6f6c6a] hover:bg-[#f6f3f2]"
                      }`}
                    >
                      {isSelected ? (
                        <CheckSquare
                          size={16}
                          className="shrink-0 text-orange-600"
                        />
                      ) : (
                        <Square
                          size={16}
                          className="shrink-0 text-[#c4c7c8]"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-bold text-[#1c1b1b]">
                          {reg.user?.fullName || "VĐV Vô danh"}
                        </p>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-[#747878]">
                          ID: {reg.id.substring(0, 8)} • Xe:{" "}
                          {reg.vehicle?.name ||
                            reg.customer_vehicle?.name ||
                            "Tự túc"}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-[#e5e2e1] pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-xs font-bold text-[#6f6c6a]"
            >
              Hủy bỏ
            </Button>
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={isPending || selectedIds.length === 0}
              className="flex items-center gap-1.5 bg-orange-600 text-xs font-extrabold text-white hover:bg-orange-700"
            >
              {isPending && (
                <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              )}
              Xếp lịch ngay
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

