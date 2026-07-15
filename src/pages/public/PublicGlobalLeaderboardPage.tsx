import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { TimerReset, Trophy } from "lucide-react"
import { racingApi, racingQueryKeys } from "@/features/racing/api/racing.api"
import { DriverTitleChip } from "@/features/racing/components/DriverTitleChip"

const periodOptions = [
  { value: "all_time", label: "All-time" },
  { value: "monthly", label: "30 ngày" },
  { value: "weekly", label: "7 ngày" },
  { value: "daily", label: "24 giờ" },
] as const

export function PublicGlobalLeaderboardPage() {
  const [period, setPeriod] = useState<(typeof periodOptions)[number]["value"]>("all_time")
  const [city, setCity] = useState("")
  const [vehicleSource, setVehicleSource] = useState<"" | "RENTAL" | "BYOC">("")

  const params = useMemo(
    () => ({
      period,
      city: city.trim() || undefined,
      vehicle_source: vehicleSource || undefined,
      limit: 50,
    }),
    [city, period, vehicleSource],
  )

  const leaderboardQuery = useQuery({
    queryKey: racingQueryKeys.globalLeaderboard(params),
    queryFn: () => racingApi.listGlobalLeaderboard(params),
  })

  const rows = leaderboardQuery.data ?? []

  return (
    <main className="w-full bg-slate-50/50 py-10">
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#111827,#1f2937)] px-6 py-12 text-white shadow-xl shadow-slate-900/10 sm:px-10">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-200">Universal Racing Network</p>
          <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">Global Leaderboard</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300">
            Bảng xếp hạng dùng chung toàn hệ thống, chỉ đọc từ race record đã verified sau khi contest local được publish và sync.
          </p>
        </div>

        <div className="mt-6 grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[220px_minmax(0,1fr)_220px]">
          <select value={period} onChange={(event) => setPeriod(event.target.value as typeof period)} className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm">
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <input
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="Lọc theo thành phố"
            className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-orange-300 focus:bg-white"
          />
          <select value={vehicleSource} onChange={(event) => setVehicleSource(event.target.value as typeof vehicleSource)} className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm">
            <option value="">Mọi vehicle source</option>
            <option value="RENTAL">RENTAL</option>
            <option value="BYOC">Xe tự mang</option>
          </select>
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {leaderboardQuery.isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="p-16 text-center">
              <TimerReset className="mx-auto size-10 text-slate-300" />
              <h3 className="mt-4 text-lg font-bold text-slate-900">Chưa có race record phù hợp</h3>
              <p className="mt-2 text-sm text-slate-500">Hãy thử đổi bộ lọc hoặc sync thêm contest đã publish.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-black uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-4">Rank</th>
                    <th className="px-5 py-4">Driver</th>
                    <th className="px-5 py-4">Cafe</th>
                    <th className="px-5 py-4">Vehicle</th>
                    <th className="px-5 py-4">Best lap</th>
                    <th className="px-5 py-4">Total time</th>
                    <th className="px-5 py-4">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((entry) => (
                    <tr key={entry.id} className="align-top">
                      <td className="px-5 py-4">
                        <div className="inline-flex size-9 items-center justify-center rounded-full bg-slate-900 text-sm font-black text-white">
                          {entry.rank}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold text-slate-900">{entry.display_name}</p>
                            <DriverTitleChip label={entry.current_title.label} />
                          </div>
                          <p className="text-xs font-medium text-slate-500">
                            {entry.driver_handle ? `@${entry.driver_handle}` : "Driver công khai"}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">{entry.cafe.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{entry.cafe.city}</p>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-700">{entry.vehicle_source}</td>
                      <td className="px-5 py-4 font-bold text-orange-600">{formatLap(entry.best_lap_ms)}</td>
                      <td className="px-5 py-4 text-slate-700">{formatLap(entry.total_time_ms)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-2 text-slate-700">
                          <Trophy className="mt-0.5 size-4 text-orange-500" />
                          <div>
                            <p className="font-semibold text-slate-900">{entry.contest_name ?? "Contest source"}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {new Date(entry.recorded_at).toLocaleString("vi-VN")}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

function formatLap(value?: number | null) {
  if (value === null || value === undefined) return "--"
  return `${(value / 1000).toFixed(3)}s`
}
