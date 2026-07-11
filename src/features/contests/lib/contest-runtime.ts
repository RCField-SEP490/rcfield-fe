import type {
  ContestAuditLogItem,
  ContestItem,
  ContestLeaderboardPayload,
  ContestMatch,
  ContestRegistration,
} from "../types"

export function getEligibleRuntimeRegistrations(registrations: ContestRegistration[]) {
  return registrations.filter((registration) =>
    registration.status === "CONFIRMED" || registration.status === "CHECKED_IN",
  )
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
