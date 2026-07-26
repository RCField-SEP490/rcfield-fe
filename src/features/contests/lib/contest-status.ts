import type {
  CustomerJourneyStatus,
  ContestEntryFeePaymentStatus,
  ContestItem,
  ContestMatchType,
  ContestParticipantStatus,
  ContestMatchStatus,
  ContestRegistrationStatus,
} from "../types"

export function getEffectiveContestStatus(
  contest: Pick<
    ContestItem,
    | "status"
    | "registration_opens_at"
    | "registration_closes_at"
    | "starts_at"
    | "ends_at"
  >,
  now = new Date(),
): ContestItem["status"] {
  if (contest.status === "DRAFT" || contest.status === "CANCELLED") {
    return contest.status
  }

  return getContestTimeWindowPhase(contest, now) ?? contest.status
}

export type ContestRegistrationAvailability =
  | "AVAILABLE"
  | "NOT_OPEN_YET"
  | "CLOSED"
  | "RUNNING"
  | "COMPLETED"
  | "CANCELLED"
  | "DRAFT"

export function getContestRegistrationAvailability(
  contest: Pick<
    ContestItem,
    | "status"
    | "registration_opens_at"
    | "registration_closes_at"
    | "starts_at"
    | "ends_at"
  >,
  now = new Date(),
): ContestRegistrationAvailability {
  if (contest.status === "DRAFT") return "DRAFT"
  if (contest.status === "CANCELLED") return "CANCELLED"

  const phase = getContestTimeWindowPhase(contest, now)
  if (phase === "COMPLETED" || phase === "RUNNING" || phase === "CLOSED") {
    return phase
  }

  const registrationOpensAt = parseDate(contest.registration_opens_at)
  if (registrationOpensAt && registrationOpensAt.getTime() > now.getTime()) {
    return "NOT_OPEN_YET"
  }

  return contest.status === "OPEN" ? "AVAILABLE" : "DRAFT"
}

export function getRegistrationAvailabilityLabel(
  availability: ContestRegistrationAvailability,
) {
  switch (availability) {
    case "AVAILABLE":
      return "Đang mở đăng ký"
    case "NOT_OPEN_YET":
      return "Sắp mở đăng ký"
    case "CLOSED":
      return "Đã đóng đăng ký"
    case "RUNNING":
      return "Đang diễn ra"
    case "COMPLETED":
      return "Đã hoàn thành"
    case "CANCELLED":
      return "Đã hủy"
    default:
      return "Bản nháp"
  }
}

export function getContestCtaLabel(
  availability: ContestRegistrationAvailability,
  status: ContestItem["status"],
): string {
  if (availability === "AVAILABLE") return "Xem chi tiết và đăng ký"
  if (availability === "NOT_OPEN_YET") return "Xem lịch mở đăng ký"
  if (status === "RUNNING") return "Xem bracket live"
  if (status === "COMPLETED") return "Xem leaderboard"
  return "Xem chi tiết"
}

export function getContestFormatLabel(format?: string | null): string {
  switch (format) {
    case "TIME_TRIAL":
      return "Đua tính giờ"
    case "KNOCKOUT":
      return "Đấu loại trực tiếp"
    case "QUALIFYING_FINAL":
      return "Vòng loại + Chung kết (Grand Prix)"
    default:
      return format || "--"
  }
}

export function getContestStatusClass(status: ContestItem["status"]) {
  switch (status) {
    case "OPEN":
      return "bg-emerald-50 text-emerald-700 border-emerald-200"
    case "CLOSED":
    case "RUNNING":
      return "bg-amber-50 text-amber-700 border-amber-200"
    case "COMPLETED":
      return "bg-slate-100 text-slate-700 border-slate-200"
    case "CANCELLED":
      return "bg-red-50 text-red-700 border-red-200"
    default:
      return "bg-[#f6f3f2] text-[#5d5f5f] border-[#e5e2e1]"
  }
}

export function getContestStatusLabel(status: ContestItem["status"]): string {
  switch (status) {
    case "DRAFT":
      return "Bản nháp"
    case "OPEN":
      return "Đang mở đăng ký"
    case "CLOSED":
      return "Đã đóng đăng ký"
    case "RUNNING":
      return "Đang diễn ra"
    case "COMPLETED":
      return "Đã hoàn thành"
    case "CANCELLED":
      return "Đã hủy"
    default:
      return status
  }
}

export function getRegistrationStatusClass(status: ContestRegistrationStatus) {
  switch (status) {
    case "CONFIRMED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200"
    case "CHECKED_IN":
      return "bg-blue-50 text-blue-700 border-blue-200"
    case "CANCELLED":
      return "bg-red-50 text-red-700 border-red-200"
    default:
      return "bg-amber-50 text-amber-700 border-amber-200"
  }
}

export function getRegistrationStatusLabel(status: ContestRegistrationStatus): string {
  switch (status) {
    case "PENDING":
      return "Chờ duyệt"
    case "CONFIRMED":
      return "Đã xác nhận"
    case "CHECKED_IN":
      return "Đã điểm danh"
    case "CANCELLED":
      return "Đã hủy"
    default:
      return status
  }
}

export function getPaymentStatusClass(status: ContestEntryFeePaymentStatus) {
  switch (status) {
    case "MARKED_PAID":
    case "WAIVED":
    case "NOT_REQUIRED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200"
    case "PENDING_REVIEW":
      return "bg-blue-50 text-blue-700 border-blue-200"
    case "PENDING_PAYMENT":
      return "bg-amber-50 text-amber-700 border-amber-200"
    default:
      return "bg-[#f6f3f2] text-[#5d5f5f] border-[#e5e2e1]"
  }
}

export function getPaymentStatusLabel(status: ContestEntryFeePaymentStatus): string {
  switch (status) {
    case "PENDING_PAYMENT":
      return "Chờ thanh toán"
    case "PENDING_REVIEW":
      return "Đang chờ duyệt thanh toán"
    case "MARKED_PAID":
      return "Đã thanh toán"
    case "WAIVED":
      return "Được miễn phí"
    case "NOT_REQUIRED":
      return "Miễn lệ phí"
    default:
      return status
  }
}

export function getMatchStatusClass(status: ContestMatchStatus) {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200"
    case "RUNNING":
      return "bg-blue-50 text-blue-700 border-blue-200"
    case "READY":
      return "bg-amber-50 text-amber-700 border-amber-200"
    case "CANCELLED":
      return "bg-red-50 text-red-700 border-red-200"
    default:
      return "bg-[#f6f3f2] text-[#5d5f5f] border-[#e5e2e1]"
  }
}

export function getMatchStatusLabel(status: ContestMatchStatus): string {
  switch (status) {
    case "DRAFT":
      return "Bản nháp"
    case "READY":
      return "Sẵn sàng"
    case "RUNNING":
      return "Đang đua"
    case "COMPLETED":
      return "Đã hoàn thành"
    case "CANCELLED":
      return "Đã hủy"
    default:
      return status
  }
}

export function getMatchTypeLabel(type: ContestMatchType): string {
  switch (type) {
    case "HEAD_TO_HEAD":
      return "Đối kháng"
    case "MULTI_DRIVER":
      return "Nhiều người chơi"
    case "TIME_ATTACK":
      return "Tính giờ"
    case "FINAL":
      return "Chung kết"
    default:
      return type
  }
}

export function getParticipantStatusLabel(
  status: ContestParticipantStatus,
): string {
  switch (status) {
    case "READY":
      return "Sẵn sàng"
    case "STARTED":
      return "Đã bắt đầu"
    case "FINISHED":
      return "Đã hoàn thành"
    case "DNS":
      return "Không xuất phát"
    case "DNF":
      return "Không hoàn thành"
    case "DQ":
      return "Bị loại"
    default:
      return status
  }
}

export function getJourneyStatusClass(status: CustomerJourneyStatus | null) {
  switch (status) {
    case "CHECKED_IN_WAITING_BRACKET":
    case "ADVANCED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200"
    case "IN_BRACKET":
    case "APPROVED_WAITING_CHECKIN":
      return "bg-blue-50 text-blue-700 border-blue-200"
    case "ELIMINATED":
    case "CANCELLED":
      return "bg-red-50 text-red-700 border-red-200"
    case "FINISHED":
      return "bg-slate-100 text-slate-700 border-slate-200"
    case "PENDING_APPROVAL":
      return "bg-amber-50 text-amber-700 border-amber-200"
    default:
      return "bg-[#f6f3f2] text-[#5d5f5f] border-[#e5e2e1]"
  }
}

export function getJourneyStatusLabel(status: CustomerJourneyStatus | null) {
  switch (status) {
    case "PENDING_APPROVAL":
      return "Chờ duyệt"
    case "APPROVED_WAITING_CHECKIN":
      return "Đã duyệt, chờ điểm danh"
    case "CHECKED_IN_WAITING_BRACKET":
      return "Đã điểm danh, chờ xếp nhánh"
    case "IN_BRACKET":
      return "Đang thi đấu"
    case "ADVANCED":
      return "Đã vào vòng tiếp"
    case "ELIMINATED":
      return "Đã bị loại"
    case "FINISHED":
      return "Đã hoàn thành"
    case "CANCELLED":
      return "Đã hủy"
    default:
      return "Đang cập nhật"
  }
}

function parseDate(value: string | null | undefined) {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

type ContestTimeWindowPhase = "COMPLETED" | "RUNNING" | "CLOSED" | "OPEN"

function getContestTimeWindowPhase(
  contest: Pick<
    ContestItem,
    | "registration_opens_at"
    | "registration_closes_at"
    | "starts_at"
    | "ends_at"
  >,
  now: Date,
): ContestTimeWindowPhase | null {
  const endsAt = parseDate(contest.ends_at)
  if (endsAt && endsAt.getTime() <= now.getTime()) {
    return "COMPLETED"
  }

  const startsAt = parseDate(contest.starts_at)
  if (startsAt && startsAt.getTime() <= now.getTime()) {
    return "RUNNING"
  }

  const registrationClosesAt = parseDate(contest.registration_closes_at)
  if (registrationClosesAt && registrationClosesAt.getTime() <= now.getTime()) {
    return "CLOSED"
  }

  const registrationOpensAt = parseDate(contest.registration_opens_at)
  if (registrationOpensAt && registrationOpensAt.getTime() <= now.getTime()) {
    return "OPEN"
  }

  return null
}
