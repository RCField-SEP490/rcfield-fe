import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router"

import { routePaths } from "@/app/router/route-paths"
import { racingApi, racingQueryKeys } from "@/features/racing/api/racing.api"
import { DriverIdentity } from "@/features/racing/components/DriverIdentity"

import { CafeSection } from "./SectionShell"

function formatLap(ms: number | null) {
  if (ms === null) return "--"
  return `${(ms / 1000).toFixed(3)}s`
}

const RANK_CLASS = [
  "bg-amber-400 text-white",
  "bg-slate-300 text-slate-700",
  "bg-orange-200 text-orange-800",
] as const

// Top tay đua của quán (theo race records verified) — ẩn hoàn toàn khi quán
// chưa có dữ liệu đua để không chiếm chỗ vô nghĩa trên trang chi tiết.
export function CafeTopDriversSection({ cafeId }: { cafeId: string }) {
  const { data } = useQuery({
    queryKey: racingQueryKeys.globalLeaderboard({ cafe_id: cafeId, limit: 5 }),
    queryFn: () => racingApi.listGlobalLeaderboard({ cafe_id: cafeId, limit: 5 }),
    staleTime: 60_000,
  })

  const entries = data ?? []
  if (entries.length === 0) return null

  return (
    <CafeSection
      title="Bảng vàng tay đua"
      lead="Những tay đua có thành tích đã xác thực tại quán này."
      action={
        <Link
          to={routePaths.globalLeaderboard}
          className="text-sm font-bold text-orange-600 hover:text-orange-700"
        >
          Xem bảng xếp hạng
        </Link>
      }
    >
      <div className="divide-y divide-slate-200 border-y border-slate-200">
        {entries.map((entry) => (
          <div key={entry.id} className="flex items-center gap-3 py-3">
            <span
              className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
                RANK_CLASS[entry.rank - 1] ?? "bg-slate-100 text-slate-500"
              }`}
            >
              {entry.rank}
            </span>
            <DriverIdentity
              name={entry.display_name}
              avatarUrl={entry.avatar_url}
              titleLabel={entry.current_title.label}
              titleCode={entry.current_title.code}
              handle={entry.driver_handle ?? undefined}
              size="sm"
              className="min-w-0 flex-1"
            />
            <span className="shrink-0 text-sm font-black text-orange-600">
              {formatLap(entry.best_lap_ms)}
            </span>
          </div>
        ))}
      </div>
    </CafeSection>
  )
}
