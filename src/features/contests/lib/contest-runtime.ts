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

export function formatDurationMs(value?: number | null) {
  if (value === null || value === undefined) return "--"
  return `${(value / 1000).toFixed(3)}s`
}

export function formatMatchLabel(match: ContestMatch) {
  return match.name?.trim() || `Round ${match.round_no} · Match ${match.match_no}`
}

export function getRegistrationDisplayName(registration?: ContestRegistration | null) {
  return (
    registration?.participant?.fullName?.trim() ||
    registration?.participant?.email?.trim() ||
    registration?.checkInCode?.trim() ||
    (registration?.id ? `Registration ${registration.id.slice(0, 8)}` : "Người chơi chưa xác định")
  )
}

export function getRegistrationSubtitle(registration?: ContestRegistration | null) {
  return registration?.participant?.email?.trim() || registration?.checkInCode?.trim() || null
}

export function getMatchParticipantName(participant?: ContestMatchParticipant | null) {
  return (
    participant?.registration?.participant_name?.trim() ||
    participant?.registration?.participant_email?.trim() ||
    `Registration ${participant?.registration_id.slice(0, 8) ?? "--"}`
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
  if (log.eventType.startsWith("registration.")) return "registration"
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
