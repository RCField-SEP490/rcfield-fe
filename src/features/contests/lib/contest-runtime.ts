import type {
  ContestAuditLogItem,
  ContestItem,
  ContestLeaderboardPayload,
  ContestMatch,
  ContestMatchParticipant,
  ContestRegistration,
} from "../types"

export function getEligibleRuntimeRegistrations(registrations: ContestRegistration[]) {
  return registrations.filter((registration) => registration.status === "CHECKED_IN")
}

export function groupMatchesByRound(matches: ContestMatch[]) {
  return matches.reduce<Array<{ roundNo: number; matches: ContestMatch[] }>>((groups, match) => {
    const group = groups.find((item) => item.roundNo === match.round_no)
    if (group) {
      group.matches.push(match)
      return groups
    }
    groups.push({ roundNo: match.round_no, matches: [match] })
    return groups
  }, [])
}

export function formatContestDateTime(value?: string | null) {
  if (!value) return "--"
  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatDurationSeconds(value?: number | null) {
  if (value === null || value === undefined) return "--"
  return `${value.toFixed(3)}s`
}

export function formatMatchLabel(match: ContestMatch) {
  return match.name?.trim() || `Vòng ${match.round_no} · Lượt đấu ${match.match_no}`
}

export function getRegistrationDisplayName(registration?: ContestRegistration | null) {
  return (
    registration?.participant?.fullName?.trim() ||
    registration?.participant?.email?.trim() ||
    registration?.checkInCode?.trim() ||
    (registration?.id ? `Mã đăng ký ${registration.id.slice(0, 8)}` : "Người chơi chưa xác định")
  )
}

export function getRegistrationSubtitle(registration?: ContestRegistration | null) {
  return registration?.participant?.email?.trim() || registration?.checkInCode?.trim() || null
}

export function getMatchParticipantName(participant?: ContestMatchParticipant | null) {
  return (
    participant?.registration?.participant_name?.trim() ||
    participant?.registration?.participant_email?.trim() ||
    `Mã đăng ký ${participant?.registration_id.slice(0, 8) ?? "--"}`
  )
}

export function getMatchParticipantSubtitle(participant?: ContestMatchParticipant | null) {
  return participant?.registration?.participant_email?.trim() || participant?.registration?.check_in_code?.trim() || null
}

export function getOpponentsForRegistration(match: ContestMatch | null | undefined, registrationId: string) {
  if (!match) return []
  return match.participants.filter((participant) => participant.registration_id !== registrationId)
}

export function getPublishedLeaderboard(contest?: ContestItem | null) {
  return (contest?.config?.published_leaderboard ?? null) as ContestLeaderboardPayload | null
}

export function getAuditGroup(log: ContestAuditLogItem) {
  if (log.eventType.startsWith("match.")) return "match"
  // booking.* = vòng đời xe thuê của đăng ký → gom vào nhóm Đăng ký.
  if (
    log.eventType.startsWith("registration.") ||
    log.eventType.startsWith("booking.")
  )
    return "registration"
  // race_records.* (sync leaderboard) và contest.* → nhóm Giải đấu.
  return "contest"
}

export function getErrorMessage(error: unknown) {
  const maybe = error as {
    response?: { data?: { message?: string; code?: string } }
    message?: string
  }
  return {
    message: maybe.response?.data?.message ?? maybe.message ?? "Vui lòng thử lại.",
    code: maybe.response?.data?.code,
  }
}

export type ContestMatchPhase = "QUALIFYING" | "FINAL"

export function getContestRuntimeFormat(
  contest?: Pick<ContestItem, "config" | "contest_format"> | null,
) {
  return String(
    contest?.config?.runtime_format ??
      contest?.config?.format ??
      contest?.contest_format?.code ??
      "",
  )
}

export function isQualifyingFinalFormat(format?: string | null) {
  return format === "QUALIFYING_FINAL"
}

export function getMatchPhase(match: ContestMatch): ContestMatchPhase {
  return match.metadata?.phase === "FINAL" ? "FINAL" : "QUALIFYING"
}

export function splitMatchesByPhase(matches: ContestMatch[]) {
  const qualifying: ContestMatch[] = []
  const final: ContestMatch[] = []
  for (const match of matches) {
    if (getMatchPhase(match) === "FINAL") {
      final.push(match)
    } else {
      qualifying.push(match)
    }
  }
  return { qualifying, final }
}

export function areAllMatchesCompleted(matches: ContestMatch[]) {
  return (
    matches.length > 0 &&
    matches.every((match) => match.status === "COMPLETED")
  )
}

export type QualifyingStanding = {
  registrationId: string
  participant: ContestMatchParticipant
  bestLapSeconds: number | null
  totalTimeSeconds: number | null
  matchId: string
}

export function getQualifyingStandings(
  matches: ContestMatch[],
): QualifyingStanding[] {
  const bestByRegistration = new Map<string, QualifyingStanding>()
  for (const match of matches) {
    for (const participant of match.participants) {
      const current = bestByRegistration.get(participant.registration_id)
      const bestLap = participant.best_lap_seconds
      if (!current) {
        bestByRegistration.set(participant.registration_id, {
          registrationId: participant.registration_id,
          participant,
          bestLapSeconds: bestLap,
          totalTimeSeconds: participant.total_time_seconds,
          matchId: match.id,
        })
        continue
      }
      const isBetter =
        bestLap !== null &&
        (current.bestLapSeconds === null || bestLap < current.bestLapSeconds)
      if (isBetter) {
        bestByRegistration.set(participant.registration_id, {
          registrationId: participant.registration_id,
          participant,
          bestLapSeconds: bestLap,
          totalTimeSeconds: participant.total_time_seconds,
          matchId: match.id,
        })
      }
    }
  }
  return [...bestByRegistration.values()].sort((a, b) => {
    if (a.bestLapSeconds === null && b.bestLapSeconds === null) return 0
    if (a.bestLapSeconds === null) return 1
    if (b.bestLapSeconds === null) return -1
    return a.bestLapSeconds - b.bestLapSeconds
  })
}

export type ByocDeclaration = {
  vehicle_name: string | null
  vehicle_brand: string | null
  vehicle_class: string | null
  notes: string | null
  photos: string[]
}

/**
 * Bản khai xe cá nhân mà VĐV nộp lúc đăng ký.
 *
 * Ảnh là căn cứ duy nhất để ban tổ chức nói xe đạt hay không đạt, nên luôn trả
 * về mảng — đăng ký cũ tạo trước khi có phần tải ảnh sẽ ra mảng rỗng thay vì
 * undefined, chỗ hiển thị khỏi phải phòng thủ thêm.
 */
export function getByocDeclaration(
  registration: ContestRegistration,
): ByocDeclaration | null {
  const raw = registration.metadata?.byoc_declaration
  if (!raw || typeof raw !== "object") return null
  const source = raw as Record<string, unknown>
  const asText = (value: unknown) =>
    typeof value === "string" && value.trim() ? value.trim() : null

  return {
    vehicle_name: asText(source.vehicle_name),
    vehicle_brand: asText(source.vehicle_brand),
    vehicle_class: asText(source.vehicle_class),
    notes: asText(source.notes),
    photos: Array.isArray(source.photos)
      ? source.photos.filter(
          (item): item is string => typeof item === "string" && item.length > 0,
        )
      : [],
  }
}
