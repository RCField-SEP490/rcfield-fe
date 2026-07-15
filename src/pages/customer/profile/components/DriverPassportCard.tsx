import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Barcode,
  Flag,
  Gauge,
  MapPinned,
  Save,
  Trophy,
  UserRound,
} from "lucide-react"
import { toast } from "sonner"
import { racingApi, racingQueryKeys } from "@/features/racing/api/racing.api"
import { DriverTitleChip } from "@/features/racing/components/DriverTitleChip"
import { routePaths } from "@/app/router/route-paths"
import { Link } from "react-router"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"

export function DriverPassportCard() {
  const queryClient = useQueryClient()
  const passportQuery = useQuery({
    queryKey: racingQueryKeys.passport(),
    queryFn: () => racingApi.getMyPassport(),
  })
  const [draftDisplayName, setDraftDisplayName] = useState<string | null>(null)
  const [draftDriverHandle, setDraftDriverHandle] = useState<string | null>(
    null,
  )

  const updateMutation = useMutation({
    mutationFn: () =>
      racingApi.updateMyPassport({
        display_name:
          (draftDisplayName ?? passportQuery.data?.display_name ?? "").trim() ||
          undefined,
        driver_handle:
          (
            draftDriverHandle ??
            passportQuery.data?.driver_handle ??
            ""
          ).trim() || undefined,
      }),
    onSuccess: async () => {
      setDraftDisplayName(null)
      setDraftDriverHandle(null)
      toast.success("Đã cập nhật Driver Passport.")
      await queryClient.invalidateQueries({
        queryKey: racingQueryKeys.passport(),
      })
    },
    onError: (error: unknown) => {
      const message =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : undefined
      toast.error("Không thể cập nhật Driver Passport", {
        description: message ?? "Vui lòng thử lại.",
      })
    },
  })

  const passport = passportQuery.data
  const achievementPreview = useMemo(
    () => passport?.achievements.slice(0, 4) ?? [],
    [passport?.achievements],
  )
  const displayNameValue = draftDisplayName ?? passport?.display_name ?? ""
  const driverHandleValue = draftDriverHandle ?? passport?.driver_handle ?? ""

  return (
    <Card className="overflow-hidden rounded-xl border-slate-200 shadow-sm">
      <div className="bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.22),transparent_45%),linear-gradient(135deg,#0f172a,#1e293b)] px-6 py-6 text-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-200">
              Driver Passport
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-black">
                {passport?.display_name ?? "Đang tải..."}
              </h2>
              <DriverTitleChip
                label={passport?.current_title.label}
                className="border-white/20 bg-white/10 text-orange-100"
              />
            </div>
            <p className="mt-2 text-sm font-medium text-slate-300">
              @{passport?.driver_handle ?? "--"} · Mã hộ chiếu:{" "}
              {passport?.passport_code ?? "--"}
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white"
          >
            <Link to={routePaths.globalLeaderboard}>
              Xem Global Leaderboard
            </Link>
          </Button>
        </div>
      </div>

      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UserRound className="size-4 text-orange-500" />
          Hồ sơ tay đua dùng chung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            icon={MapPinned}
            label="Quán đã chinh phục"
            value={String(passport?.stats.distinct_cafes_played ?? 0)}
          />
          <Metric
            icon={Flag}
            label="Lần chơi hoàn tất"
            value={String(passport?.stats.completed_plays ?? 0)}
          />
          <Metric
            icon={Trophy}
            label="Verified race record"
            value={String(passport?.stats.verified_race_records ?? 0)}
          />
          <Metric
            icon={Gauge}
            label="Best global lap"
            value={formatLap(passport?.stats.best_global_lap_ms)}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_0.95fr]">
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <Label>Tên hiển thị</Label>
                <Input
                  value={displayNameValue}
                  onChange={(event) => setDraftDisplayName(event.target.value)}
                />
              </label>
              <label className="space-y-2">
                <Label>Driver handle</Label>
                <Input
                  value={driverHandleValue}
                  onChange={(event) => setDraftDriverHandle(event.target.value)}
                />
              </label>
            </div>
            <Button
              disabled={updateMutation.isPending || passportQuery.isLoading}
              onClick={() => updateMutation.mutate()}
            >
              <Save className="size-4" />
              {updateMutation.isPending ? "Đang lưu..." : "Lưu Driver Passport"}
            </Button>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-slate-900">
              <Barcode className="size-4 text-orange-500" />
              <h3 className="text-sm font-black uppercase tracking-wide">
                Badge shelf
              </h3>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {achievementPreview.length > 0 ? (
                achievementPreview.map((achievement) => (
                  <div
                    key={achievement.code}
                    className="rounded-2xl border border-orange-100 bg-orange-50/40 p-3"
                  >
                    <p className="text-sm font-bold text-slate-900">
                      {achievement.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {achievement.description ??
                        "Badge đã mở khóa từ dữ liệu chơi thật."}
                    </p>
                    <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-orange-700">
                      {new Date(achievement.unlocked_at).toLocaleDateString(
                        "vi-VN",
                      )}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 sm:col-span-2">
                  Chưa có danh hiệu nào được mở khóa.
                </p>
              )}
            </div>
          </section>
        </div>
      </CardContent>
    </Card>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="size-4 text-orange-500" />
        <p className="text-xs font-bold uppercase tracking-wide">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </div>
  )
}

function formatLap(value?: number | null) {
  if (value === null || value === undefined) return "--"
  return `${(value / 1000).toFixed(3)}s`
}
