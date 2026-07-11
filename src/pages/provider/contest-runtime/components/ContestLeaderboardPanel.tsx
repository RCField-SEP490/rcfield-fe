import type { ContestItem, ContestLeaderboardPayload, ContestMetrics } from "@/features/contests/types"
import { Panel, PanelTitle } from "@/pages/provider/components/ProviderPrimitives"
import { Button } from "@/shared/ui/button"
import { toast } from "sonner"
import { getErrorMessage } from "@/features/contests/lib/contest-runtime"
import type { useContestRuntime } from "@/features/contests/hooks/useContestRuntime"

type RuntimeHook = ReturnType<typeof useContestRuntime>

export function ContestLeaderboardPanel({
  contest,
  leaderboard,
  metrics,
  runtime,
}: {
  contest: ContestItem
  leaderboard: ContestLeaderboardPayload | null
  metrics: ContestMetrics | undefined
  runtime: RuntimeHook
}) {
  const handlePublish = async () => {
    try {
      await runtime.publishLeaderboardMutation.mutateAsync()
      toast.success("Đã publish leaderboard")
    } catch (error) {
      toast.error("Không thể publish leaderboard", { description: getErrorMessage(error).message })
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
      <Panel>
        <PanelTitle title="Publish state" subtitle="Trạng thái leaderboard local của contest." />
        <div className="space-y-3 text-sm font-semibold text-[#5d5f5f]">
          <StatusRow label="Contest" value={contest.name} />
          <StatusRow label="Mode" value={leaderboard?.mode ?? metrics?.leaderboard.mode ?? "--"} />
          <StatusRow label="Published" value={leaderboard ? "Đã publish" : "Chưa publish"} />
          <StatusRow label="Published at" value={leaderboard?.published_at ?? "--"} />
        </div>
        <Button className="mt-4 h-10 rounded-lg bg-[#1c1b1b] text-white hover:bg-[#313030]" onClick={() => void handlePublish()}>
          Publish leaderboard
        </Button>
      </Panel>

      <Panel>
        <PanelTitle title="Leaderboard entries" subtitle="Bảng xếp hạng local publish cho runtime hiện tại." />
        {leaderboard?.entries?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-[#e5e2e1] text-left text-xs font-extrabold uppercase tracking-wider text-[#747878]">
                  <th className="pb-3">Rank</th>
                  <th className="pb-3">Registration</th>
                  <th className="pb-3">Wins</th>
                  <th className="pb-3">Best lap</th>
                  <th className="pb-3">Total time</th>
                  <th className="pb-3">Matches</th>
                  <th className="pb-3">Round</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0eeee]">
                {leaderboard.entries.map((entry) => (
                  <tr key={entry.registration_id}>
                    <td className="py-3 font-bold text-[#1c1b1b]">{entry.rank}</td>
                    <td className="py-3 font-semibold text-[#1c1b1b]">{entry.registration_id.slice(0, 8)}</td>
                    <td className="py-3 text-[#5d5f5f]">{entry.wins}</td>
                    <td className="py-3 text-[#5d5f5f]">{entry.best_lap_ms ?? "--"}</td>
                    <td className="py-3 text-[#5d5f5f]">{entry.total_time_ms ?? "--"}</td>
                    <td className="py-3 text-[#5d5f5f]">{entry.matches_completed}</td>
                    <td className="py-3 text-[#5d5f5f]">{entry.progressed_round}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm font-semibold text-[#747878]">Chưa có leaderboard được publish.</p>
        )}
      </Panel>
    </div>
  )
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[#e5e2e1] px-3 py-2">
      <span>{label}</span>
      <span className="text-[#1c1b1b]">{value}</span>
    </div>
  )
}
