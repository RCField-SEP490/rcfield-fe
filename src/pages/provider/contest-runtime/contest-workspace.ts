export const contestWorkspaceSections = [
  { key: "overview", label: "Tổng quan" },
  { key: "registrations", label: "Người chơi / Đăng ký" },
  { key: "operations", label: "Check-in / Vận hành" },
  { key: "bracket", label: "Nhánh đấu" },
  { key: "leaderboard", label: "Bảng xếp hạng" },
  { key: "audit", label: "Nhật ký" },
  { key: "discipline", label: "Kỷ luật / Nhân sự" },
] as const

export type ContestWorkspaceSectionKey =
  (typeof contestWorkspaceSections)[number]["key"]

export const defaultContestWorkspaceSection: ContestWorkspaceSectionKey =
  "overview"

export function getContestWorkspacePath(
  contestId: string,
  section: ContestWorkspaceSectionKey,
) {
  return `/provider/contests/${contestId}/${section}`
}

export function parseContestWorkspaceContext(pathname: string) {
  const parts = pathname.split("/").filter(Boolean)
  if (parts[0] !== "provider" || parts[1] !== "contests") return null

  const contestId = parts[2]
  if (!contestId || contestId === "new") return null

  const rawSection = parts[3]
  const section =
    rawSection &&
    contestWorkspaceSections.some((item) => item.key === rawSection)
      ? (rawSection as ContestWorkspaceSectionKey)
      : null

  return {
    contestId,
    section,
  }
}
