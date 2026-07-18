import { Swords } from "lucide-react"

import { MatchStatusBadge } from "@/features/contests/components"
import {
  formatContestDateTime,
  formatMatchLabel,
  getMatchParticipantName,
} from "@/features/contests/lib/contest-runtime"
import type { ContestMatch, ContestRegistration } from "@/features/contests/types"
import { DriverTitleChip } from "@/features/racing/components/DriverTitleChip"
import { Card } from "@/shared/ui/card"
import { EmptyState } from "@/shared/ui/empty-state"
import { CardListSkeleton } from "@/shared/ui/loading-state"

export function MyRegistrationMatches({
  registration,
  matches,
  loading,
}: {
  registration: ContestRegistration
  matches: ContestMatch[]
  loading: boolean
}) {
  return (
    <Card className="rounded-2xl border border-[#e5e2e1] bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 text-slate-900">
        <Swords className="size-5 text-orange-500" />
        <h3 className="text-lg font-extrabold">Bracket của bạn</h3>
      </div>
      <p className="mt-2 text-sm text-slate-500">
        Tập trung vào các trận bạn tham gia và đối thủ trực tiếp của bạn.
      </p>

      <div className="mt-5 space-y-4">
        {loading ? (
          <CardListSkeleton count={2} itemClassName="h-28 rounded-2xl" />
        ) : matches.length === 0 ? (
          <EmptyState
            title="Bạn chưa có match nào hiển thị trong bracket hiện tại."
            className="rounded-2xl border-slate-200 p-6"
          />
        ) : (
          matches.map((match) => {
            const myParticipant =
              match.participants.find(
                (participant) =>
                  participant.registration?.is_my_registration ||
                  participant.registration_id === registration.id,
              ) ?? null
            const opponents = match.participants.filter(
              (participant) =>
                !participant.registration?.is_my_registration &&
                participant.registration_id !== registration.id,
            )

            return (
              <article
                key={match.id}
                className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-base font-bold text-slate-900">
                      {formatMatchLabel(match)}
                    </p>
                    <p className="text-sm text-slate-500">
                      Thi đấu lúc {formatContestDateTime(match.scheduled_at)}
                    </p>
                  </div>
                  <MatchStatusBadge
                    status={match.status}
                    className="h-auto px-2.5 py-1 font-bold"
                  />
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <BracketCard
                    title="Bạn"
                    name={
                      myParticipant
                        ? getMatchParticipantName(myParticipant)
                        : (registration.participant?.fullName ??
                          registration.participant?.email ??
                          "Người chơi của bạn")
                    }
                    detail={
                      myParticipant?.status
                        ? `Trạng thái: ${myParticipant.status}`
                        : "Chờ cập nhật vào trận"
                    }
                    titleLabel={myParticipant?.registration?.driver_title_label}
                    highlight
                  />
                  <BracketCard
                    title="Đối thủ"
                    name={
                      opponents[0]
                        ? getMatchParticipantName(opponents[0])
                        : "Chưa xác định"
                    }
                    detail={
                      opponents[0]?.status
                        ? `Trạng thái: ${opponents[0].status}`
                        : "Chưa có người ghép trận"
                    }
                    titleLabel={opponents[0]?.registration?.driver_title_label}
                  />
                </div>
              </article>
            )
          })
        )}
      </div>
    </Card>
  )
}

function BracketCard({
  title,
  name,
  detail,
  titleLabel,
  highlight = false,
}: {
  title: string
  name: string
  detail: string
  titleLabel?: string | null
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${highlight ? "border-orange-200 bg-orange-50/70" : "border-slate-200 bg-white"}`}
    >
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {title}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <p className="text-base font-extrabold text-slate-900">{name}</p>
        <DriverTitleChip label={titleLabel} />
      </div>
      <p className="mt-1 text-sm font-medium text-slate-500">{detail}</p>
    </div>
  )
}
