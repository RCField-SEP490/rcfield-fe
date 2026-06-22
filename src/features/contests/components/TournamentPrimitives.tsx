import type { ReactNode } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Flag,
  Gift,
  MapPin,
  Medal,
  QrCode,
  Trophy,
  Users,
} from "lucide-react";

import type {
  BracketMatch,
  Contest,
  ContestLeaderboardStanding,
  ContestRegistration,
  ContestReward,
  ContestRound,
} from "../types";
import {
  capacityPercent,
  formatContestDateTime,
  formatContestTime,
  formatCurrency,
  getContestStatusLabel,
  getRoundLabel,
  getRoundScheduledAt,
  groupMatchesByRound,
  registrationEmail,
  registrationName,
} from "../lib/tournament";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";

const toneByStatus: Record<string, string> = {
  DRAFT: "border-[#c4c7c8] bg-[#f6f3f2] text-[#444748]",
  OPEN: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CLOSED: "border-amber-200 bg-amber-50 text-amber-700",
  RUNNING: "border-orange-200 bg-orange-50 text-orange-700",
  COMPLETED: "border-blue-200 bg-blue-50 text-blue-700",
  CANCELLED: "border-red-200 bg-red-50 text-red-700",
};

export function ContestStatusBadge({ status }: { status: string }) {
  return (
    <Badge className={cn("rounded-md border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide shadow-none", toneByStatus[status] ?? toneByStatus.DRAFT)}>
      {getContestStatusLabel(status)}
    </Badge>
  );
}

export function TournamentPanel({
  title,
  subtitle,
  icon,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-[#e5e2e1] bg-white p-5 shadow-sm", className)}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          {icon ? (
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-orange-100 bg-orange-50 text-orange-600">
              {icon}
            </div>
          ) : null}
          <div className="min-w-0">
            <h3 className="text-lg font-extrabold leading-tight text-[#1c1b1b]">{title}</h3>
            {subtitle ? <p className="mt-1 text-xs font-semibold text-[#5d5f5f]">{subtitle}</p> : null}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function ContestMetric({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: ReactNode;
  helper?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[#e5e2e1] bg-[#fcf8f8] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#747878]">{label}</span>
        {icon ? <span className="text-[#747878] [&_svg]:size-4">{icon}</span> : null}
      </div>
      <div className="text-xl font-black leading-none text-[#1c1b1b]">{value}</div>
      {helper ? <div className="mt-2 text-xs font-semibold text-[#5d5f5f]">{helper}</div> : null}
    </div>
  );
}

export function ContestEventCard({
  contest,
  onOpen,
  actionLabel = "Xem giải đấu",
}: {
  contest: Contest;
  onOpen: () => void;
  actionLabel?: string;
}) {
  const percent = capacityPercent(contest);
  const registered = contest.registration_summary?.active ?? 0;
  const checkedIn = contest.registration_summary?.checked_in ?? 0;

  return (
    <article className="group flex h-full flex-col rounded-xl border border-[#e5e2e1] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <ContestStatusBadge status={contest.status} />
          <h3 className="mt-3 line-clamp-2 text-lg font-extrabold leading-tight text-[#1c1b1b]">
            {contest.name}
          </h3>
        </div>
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[#1c1b1b] text-white">
          <Trophy className="size-5" />
        </div>
      </div>

      <div className="space-y-2 text-xs font-semibold text-[#444748]">
        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-orange-600" />
          <span>Khai mạc: {formatContestDateTime(contest.starts_at)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-orange-600" />
          <span>Đóng đăng ký: {formatContestDateTime(contest.registration_closes_at)}</span>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 size-4 shrink-0 text-orange-600" />
          <span className="line-clamp-1">
            {contest.participating_cafes?.map((cafe) => cafe.name).join(", ") || "Chưa công bố địa điểm"}
          </span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <ContestMiniStat label="Tham dự" value={`${registered}/${contest.capacity}`} />
        <ContestMiniStat label="Check-in" value={String(checkedIn)} />
        <ContestMiniStat label="Lệ phí" value={formatCurrency(contest.entry_fee)} />
      </div>

      <div className="mt-5">
        <div className="mb-1.5 flex justify-between text-[10px] font-extrabold uppercase tracking-wider text-[#747878]">
          <span>Sức chứa</span>
          <span>{percent}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#e5e2e1]">
          <div className="h-full rounded-full bg-[#1c1b1b]" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <Button
        type="button"
        onClick={onOpen}
        className="mt-5 h-10 rounded-lg bg-[#1c1b1b] text-sm font-bold text-white hover:bg-[#313030]"
      >
        {actionLabel}
      </Button>
    </article>
  );
}

function ContestMiniStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-[#e5e2e1] bg-[#fcf8f8] px-3 py-2">
      <div className="text-[9px] font-extrabold uppercase tracking-wider text-[#747878]">{label}</div>
      <div className="mt-1 truncate text-xs font-black text-[#1c1b1b]">{value}</div>
    </div>
  );
}

export function ContestSchedulePanel({
  rounds,
  matches,
}: {
  rounds: ContestRound[];
  matches: BracketMatch[];
}) {
  const groups = groupMatchesByRound(matches, rounds);

  if (groups.length === 0) {
    return (
      <TournamentPanel title="Trận đấu" subtitle="BTC chưa công bố lịch thi đấu" icon={<Flag className="size-5" />}>
        <EmptyTournamentState title="Chưa có trận đấu" description="Lịch thi đấu sẽ xuất hiện khi ban tổ chức dựng bracket hoặc tạo heat." />
      </TournamentPanel>
    );
  }

  return (
    <TournamentPanel title="Trận đấu" subtitle="Lịch thi đấu theo từng vòng" icon={<Flag className="size-5" />}>
      <div className="grid gap-4 lg:grid-cols-2">
        {groups.map((group) => (
          <div key={group.round?.id ?? group.matches[0]?.id} className="rounded-lg border border-[#e5e2e1] bg-[#fcf8f8] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h4 className="font-extrabold text-[#1c1b1b]">{getRoundLabel(group.round)}</h4>
                <p className="mt-0.5 text-xs font-semibold text-[#747878]">
                  {formatContestDateTime(getRoundScheduledAt(group.round))}
                </p>
              </div>
              <Badge className="border-[#c4c7c8] bg-white text-[#444748]">
                {group.matches.length} trận
              </Badge>
            </div>
            <div className="space-y-2">
              {group.matches.map((match) => (
                <MatchRow key={match.id} match={match} scheduledAt={getRoundScheduledAt(group.round)} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </TournamentPanel>
  );
}

function MatchRow({ match, scheduledAt }: { match: BracketMatch; scheduledAt?: string | null }) {
  const winnerId = match.winnerRegistrationId;
  return (
    <div className="rounded-lg border border-[#e5e2e1] bg-white p-3">
      <div className="mb-2 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-[#747878]">
        <span>Trận {match.matchNo}</span>
        <span>{match.status === "COMPLETED" ? "KT" : formatContestTime(scheduledAt)}</span>
      </div>
      <CompetitorLine registration={match.competitorA} isWinner={winnerId === match.competitorARegistrationId} />
      <CompetitorLine registration={match.competitorB} isWinner={winnerId === match.competitorBRegistrationId} />
    </div>
  );
}

function CompetitorLine({ registration, isWinner }: { registration?: ContestRegistration; isWinner?: boolean }) {
  return (
    <div className={cn("mt-1 flex items-center justify-between rounded-md px-2 py-1.5 text-sm font-bold", isWinner ? "bg-orange-50 text-orange-700" : "text-[#1c1b1b]")}>
      <span className="truncate">{registrationName(registration)}</span>
      {isWinner ? <CheckCircle2 className="size-4 shrink-0" /> : null}
    </div>
  );
}

export function ContestLeaderboardPanel({ standings }: { standings: ContestLeaderboardStanding[] }) {
  return (
    <TournamentPanel title="Bảng xếp hạng" subtitle="Kết quả chỉ tính từ result đã verify" icon={<Medal className="size-5" />}>
      {standings.length === 0 ? (
        <EmptyTournamentState title="Chưa có bảng xếp hạng" description="Bảng xếp hạng sẽ hiển thị sau khi ban tổ chức xác nhận kết quả." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#e5e2e1]">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-[#fcf8f8] text-xs font-extrabold uppercase tracking-wider text-[#747878]">
              <tr>
                <th className="px-4 py-3">Hạng</th>
                <th className="px-4 py-3">Tay đua</th>
                <th className="px-4 py-3">Best lap</th>
                <th className="px-4 py-3">Tổng thời gian</th>
                <th className="px-4 py-3 text-right">Điểm</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((standing) => (
                <tr key={standing.registration_id} className="border-t border-[#e5e2e1]">
                  <td className="px-4 py-3 font-black text-[#1c1b1b]">#{standing.rank}</td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-[#1c1b1b]">{standing.fullName || "Tay đua RC"}</div>
                    <div className="text-xs font-semibold text-[#747878]">{standing.email}</div>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold">{standing.best_lap_ms ?? "--"}</td>
                  <td className="px-4 py-3 font-mono font-bold">{standing.total_time_ms ?? "--"}</td>
                  <td className="px-4 py-3 text-right font-black text-orange-700">{standing.points ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </TournamentPanel>
  );
}

export function ContestBracketPanel({
  rounds,
  matches,
  onMatchClick,
}: {
  rounds: ContestRound[];
  matches: BracketMatch[];
  onMatchClick?: (match: BracketMatch) => void;
}) {
  const groups = groupMatchesByRound(matches, rounds);

  return (
    <TournamentPanel title="Sơ đồ thi đấu" subtitle="Winner tự tiến sang vòng tiếp theo" icon={<Trophy className="size-5" />}>
      {groups.length === 0 ? (
        <EmptyTournamentState title="Chưa có bracket" description="Bracket sẽ hiển thị sau khi ban tổ chức dựng sơ đồ thi đấu." />
      ) : (
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-[760px] gap-4">
            {groups.map((group) => (
              <div key={group.round?.id ?? group.matches[0]?.id} className="flex min-w-56 flex-1 flex-col justify-center gap-3">
                <div className="text-center text-xs font-extrabold uppercase tracking-wider text-[#747878]">
                  {getRoundLabel(group.round)}
                </div>
                {group.matches.map((match) => (
                  <button
                    key={match.id}
                    type="button"
                    onClick={() => onMatchClick?.(match)}
                    className="rounded-lg border border-[#e5e2e1] bg-white p-3 text-left shadow-sm transition hover:border-orange-200 hover:bg-orange-50/30"
                  >
                    <div className="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-[#747878]">
                      Match {match.matchNo}
                    </div>
                    <CompetitorLine registration={match.competitorA} isWinner={match.winnerRegistrationId === match.competitorARegistrationId} />
                    <CompetitorLine registration={match.competitorB} isWinner={match.winnerRegistrationId === match.competitorBRegistrationId} />
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </TournamentPanel>
  );
}

export function ContestRewardPanel({ rewards }: { rewards: ContestReward[] }) {
  return (
    <TournamentPanel title="Phần thưởng" subtitle="Quà tặng theo thứ hạng chung cuộc" icon={<Gift className="size-5" />}>
      {rewards.length === 0 ? (
        <EmptyTournamentState title="Chưa công bố phần thưởng" description="BTC sẽ cập nhật phần thưởng trước ngày thi đấu." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rewards.map((reward) => (
            <div key={reward.id} className="rounded-lg border border-[#e5e2e1] bg-[#fcf8f8] p-4">
              <div className="mb-3 flex items-center justify-between">
                <Badge className="border-orange-200 bg-orange-50 text-orange-700">
                  Hạng {reward.position}
                </Badge>
                <span className="text-xs font-bold text-[#747878]">x{reward.quantity}</span>
              </div>
              <h4 className="font-extrabold text-[#1c1b1b]">{reward.title}</h4>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-[#5d5f5f]">{reward.description}</p>
            </div>
          ))}
        </div>
      )}
    </TournamentPanel>
  );
}

export function ContestRegistrationPanel({
  contest,
  myRegistration,
  onRegister,
  onCancel,
  registerPending,
  cancelPending,
}: {
  contest: Contest;
  myRegistration?: ContestRegistration | null;
  onRegister: () => void;
  onCancel: () => void;
  registerPending?: boolean;
  cancelPending?: boolean;
}) {
  const registered = contest.registration_summary?.active ?? 0;
  const checkedIn = contest.registration_summary?.checked_in ?? 0;
  const isFull = contest.remaining_capacity <= 0;
  const canRegister = contest.status === "OPEN" && contest.is_registration_open && !myRegistration && !isFull;

  return (
    <TournamentPanel title="Tham gia giải" subtitle="Thông tin đăng ký và check-in" icon={<QrCode className="size-5" />} className="lg:sticky lg:top-6">
      <div className="grid grid-cols-2 gap-3">
        <ContestMetric label="VĐV" value={`${registered}/${contest.capacity}`} helper={`${checkedIn} đã check-in`} icon={<Users />} />
        <ContestMetric label="Lệ phí" value={formatCurrency(contest.entry_fee)} helper="Thanh toán phase sau" icon={<Trophy />} />
      </div>
      <div className="mt-4 rounded-lg border border-[#e5e2e1] bg-[#fcf8f8] p-4 text-sm font-semibold text-[#444748]">
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-orange-600" />
          Đóng đăng ký: {formatContestDateTime(contest.registration_closes_at)}
        </div>
      </div>

      {myRegistration ? (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center">
          <CheckCircle2 className="mx-auto size-8 text-emerald-600" />
          <div className="mt-2 text-sm font-extrabold text-emerald-800">Bạn đã đăng ký</div>
          <div className="mt-3 rounded-lg bg-white p-3">
            <QrCode className="mx-auto size-24 text-[#1c1b1b]" />
            <div className="mt-2 break-all font-mono text-xs font-black text-[#1c1b1b]">{myRegistration.check_in_code}</div>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={cancelPending}
            onClick={onCancel}
            className="mt-4 w-full rounded-lg border-red-200 bg-white text-red-700 hover:bg-red-50"
          >
            Hủy đăng ký
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          disabled={!canRegister || registerPending}
          onClick={onRegister}
          className="mt-4 h-11 w-full rounded-lg bg-[#1c1b1b] font-bold text-white hover:bg-[#313030]"
        >
          {isFull ? "Đã hết chỗ" : canRegister ? "Đăng ký tham gia" : "Chưa mở đăng ký"}
        </Button>
      )}
    </TournamentPanel>
  );
}

export function EmptyTournamentState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[#c4c7c8] bg-[#fcf8f8] px-4 py-10 text-center">
      <Trophy className="mx-auto size-9 text-[#a09e9d]" />
      <h4 className="mt-3 text-sm font-extrabold text-[#1c1b1b]">{title}</h4>
      <p className="mx-auto mt-1 max-w-md text-xs font-semibold leading-relaxed text-[#747878]">{description}</p>
    </div>
  );
}

export function RegistrationTable({ registrations }: { registrations: ContestRegistration[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[#e5e2e1]">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-[#fcf8f8] text-xs font-extrabold uppercase tracking-wider text-[#747878]">
          <tr>
            <th className="px-4 py-3">Tay đua</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Mã check-in</th>
            <th className="px-4 py-3">Xe</th>
            <th className="px-4 py-3">Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {registrations.map((registration) => (
            <tr key={registration.id} className="border-t border-[#e5e2e1]">
              <td className="px-4 py-3 font-bold text-[#1c1b1b]">{registrationName(registration)}</td>
              <td className="px-4 py-3 font-semibold text-[#5d5f5f]">{registrationEmail(registration) || "--"}</td>
              <td className="px-4 py-3 font-mono text-xs font-black text-orange-700">{registration.check_in_code}</td>
              <td className="px-4 py-3 font-bold text-[#444748]">{registration.vehicle_source}</td>
              <td className="px-4 py-3">
                <Badge className={cn("border font-bold", registration.status === "CHECKED_IN" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : registration.status === "CANCELLED" ? "border-red-200 bg-red-50 text-red-700" : "border-orange-200 bg-orange-50 text-orange-700")}>
                  {registration.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
