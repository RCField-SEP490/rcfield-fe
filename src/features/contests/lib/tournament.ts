import type {
  BracketMatch,
  Contest,
  ParticipatingCafe,
  ContestRegistration,
  ContestRound,
  ContestStatus,
} from "../types";

export function formatContestDateTime(value?: string | Date | null) {
  if (!value) return "Chưa lên lịch";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatContestTime(value?: string | Date | null) {
  if (!value) return "--:--";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export function formatCurrency(value: number) {
  if (value <= 0) return "Miễn phí";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export function capacityPercent(contest: Pick<Contest, "capacity" | "registration_summary">) {
  const capacity = Math.max(contest.capacity || 0, 1);
  const active = contest.registration_summary?.active ?? 0;
  return Math.min(Math.round((active / capacity) * 100), 100);
}

export function getContestStatusLabel(status: ContestStatus | string) {
  const labels: Record<string, string> = {
    DRAFT: "Nháp",
    OPEN: "Mở đăng ký",
    CLOSED: "Đóng đăng ký",
    RUNNING: "Đang thi đấu",
    COMPLETED: "Hoàn tất",
    CANCELLED: "Đã hủy",
  };
  return labels[status] ?? status;
}

export function getRegistrationStatusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    PENDING: "Chờ xác nhận",
    CONFIRMED: "Đã xác nhận",
    CHECKED_IN: "Đã check-in",
    CANCELLED: "Đã hủy",
  };
  return status ? (labels[status] ?? status) : "--";
}

export function getVehicleSourceLabel(source?: string | null) {
  const labels: Record<string, string> = {
    BYOC: "Xe cá nhân",
    RENTAL: "Xe thuê",
  };
  return source ? (labels[source] ?? source) : "--";
}

export function getParticipantRoleLabel(role?: string | null) {
  const labels: Record<string, string> = {
    CUSTOMER: "Customer",
    PROVIDER: "Provider racer",
    STAFF: "Staff",
  };
  return role ? (labels[role] ?? role) : "--";
}

export function registrationNote(registration?: ContestRegistration | null) {
  const note = registration?.metadata?.note;
  return typeof note === "string" && note.trim() ? note.trim() : "";
}

export function checkedInCafeName(
  registration: Pick<ContestRegistration, "checked_in_cafe_id">,
  cafes: Pick<ParticipatingCafe, "id" | "name">[],
) {
  if (!registration.checked_in_cafe_id) return "";
  return cafes.find((cafe) => cafe.id === registration.checked_in_cafe_id)?.name ?? "Chi nhánh không xác định";
}

export function getRegistrationCounts(registrations: ContestRegistration[], capacity?: number) {
  const counts = registrations.reduce(
    (acc, registration) => {
      acc.total += 1;
      if (registration.status === "PENDING") acc.pending += 1;
      if (registration.status === "CONFIRMED") acc.confirmed += 1;
      if (registration.status === "CHECKED_IN") acc.checkedIn += 1;
      if (registration.status === "CANCELLED") acc.cancelled += 1;
      if (registration.vehicle_source === "BYOC") acc.byoc += 1;
      if (registration.vehicle_source === "RENTAL") acc.rental += 1;
      if (registration.status !== "CANCELLED") acc.active += 1;
      return acc;
    },
    {
      total: 0,
      active: 0,
      pending: 0,
      confirmed: 0,
      checkedIn: 0,
      cancelled: 0,
      byoc: 0,
      rental: 0,
      remaining: Math.max((capacity ?? 0) - registrations.filter((item) => item.status !== "CANCELLED").length, 0),
    },
  );
  counts.remaining = Math.max((capacity ?? counts.active) - counts.active, 0);
  return counts;
}

export interface RegistrationFilterState {
  search: string;
  status: "ALL" | "PENDING" | "CONFIRMED" | "CHECKED_IN" | "CANCELLED";
  vehicleSource: "ALL" | "BYOC" | "RENTAL";
  cafeId: "ALL" | string;
}

export function filterContestRegistrations(
  registrations: ContestRegistration[],
  filters: RegistrationFilterState,
) {
  const search = filters.search.trim().toLowerCase();
  return registrations.filter((registration) => {
    if (filters.status !== "ALL" && registration.status !== filters.status) return false;
    if (filters.vehicleSource !== "ALL" && registration.vehicle_source !== filters.vehicleSource) return false;
    if (filters.cafeId !== "ALL" && registration.checked_in_cafe_id !== filters.cafeId) return false;
    if (!search) return true;

    const fields = [
      registrationName(registration),
      registrationEmail(registration),
      registration.check_in_code,
      registration.vehicle_source,
      registration.participant_role_snapshot,
      registrationNote(registration),
    ];
    return fields.some((field) => field.toLowerCase().includes(search));
  });
}

export function getRoundLabel(round?: ContestRound | null) {
  if (!round) return "Vòng đấu";
  const rawName = getRoundName(round);
  if (rawName) return rawName;
  const roundNo = getRoundNo(round);
  const roundType = getRoundType(round);
  if (roundType === "FINAL") return "Chung kết";
  if (roundNo === 1) return "Vòng loại";
  if (roundNo === 2) return "Bán kết";
  return `Vòng ${roundNo || "--"}`;
}

export function getRoundId(round: ContestRound) {
  return round.id;
}

export function getRoundNo(round: ContestRound) {
  return round.round_no ?? round.roundNo ?? 0;
}

export function getRoundName(round: ContestRound) {
  return round.name ?? "";
}

export function getRoundType(round: ContestRound) {
  return round.round_type ?? round.roundType ?? "";
}

export function getRoundScheduledAt(round?: ContestRound | null) {
  return round?.scheduled_at ?? round?.scheduledAt ?? null;
}

export function registrationName(registration?: ContestRegistration) {
  return registration?.user?.fullName || registration?.user?.email || "Chờ tay đua";
}

export function registrationEmail(registration?: ContestRegistration) {
  return registration?.user?.email || "";
}

export function mapRegistrations(registrations: ContestRegistration[]) {
  return new Map(registrations.map((registration) => [registration.id, registration]));
}

export function enrichBracketMatches(matches: BracketMatch[], registrations: ContestRegistration[]) {
  const registrationMap = mapRegistrations(registrations);
  return matches
    .map((match) => ({
      ...match,
      competitorA: match.competitorARegistrationId
        ? registrationMap.get(match.competitorARegistrationId)
        : undefined,
      competitorB: match.competitorBRegistrationId
        ? registrationMap.get(match.competitorBRegistrationId)
        : undefined,
      winner: match.winnerRegistrationId ? registrationMap.get(match.winnerRegistrationId) : undefined,
    }))
    .sort((a, b) => a.matchNo - b.matchNo);
}

export function groupMatchesByRound(matches: BracketMatch[], rounds: ContestRound[]) {
  const roundMap = new Map(rounds.map((round) => [getRoundId(round), round]));
  const grouped = new Map<string, { round: ContestRound | null; matches: BracketMatch[] }>();

  for (const match of matches) {
    const roundId = match.contestRoundId;
    const round = roundMap.get(roundId) ?? null;
    const key = roundId || "unknown";
    const current = grouped.get(key) ?? { round, matches: [] };
    current.matches.push(match);
    grouped.set(key, current);
  }

  return Array.from(grouped.values()).sort((a, b) => {
    const aNo = a.round ? getRoundNo(a.round) : 999;
    const bNo = b.round ? getRoundNo(b.round) : 999;
    return aNo - bNo;
  });
}
