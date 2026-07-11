import { useQuery } from "@tanstack/react-query"
import { Flag } from "lucide-react"
import { Link } from "react-router"

import { routePaths } from "@/app/router/route-paths"
import { contestApi, contestQueryKeys } from "@/features/contests/api/contest.api"
import { PublicPageShell } from "@/shared/components/PublicPageShell"
import { Badge } from "@/shared/ui/badge"

export function PublicContestsPage() {
  const contestsQuery = useQuery({
    queryKey: contestQueryKeys.list({ public: true }),
    queryFn: () => contestApi.listContests({ limit: 100 }),
  })

  const contests = contestsQuery.data?.data ?? []

  return (
    <PublicPageShell>
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-slate-950">Contest</h1>
          <p className="mt-2 text-sm font-medium text-slate-600">
            Khám phá các giải đấu đang mở, sắp diễn ra hoặc đã hoàn tất trên RCField.
          </p>
        </div>

        {contestsQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-40 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
        ) : contests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <Flag className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold text-muted-foreground">Hiện chưa có contest công khai.</p>
        </div>
        ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {contests.map((contest) => (
            <Link
              key={contest.id}
              to={routePaths.contestDetail.replace(":contestId", contest.id)}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-extrabold text-foreground">{contest.name}</h3>
                  <p className="mt-2 text-sm font-medium text-muted-foreground">
                    {contest.description || "Chưa có mô tả contest."}
                  </p>
                </div>
                <Badge variant="outline">{contest.status}</Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-muted-foreground">
                <span>{contest.contest_type?.name ?? "--"}</span>
                <span>{contest.contest_format?.name ?? "--"}</span>
                <span>{contest.host_branch?.cafe?.name ?? "--"}</span>
              </div>
            </Link>
          ))}
        </div>
        )}
      </section>
    </PublicPageShell>
  )
}
