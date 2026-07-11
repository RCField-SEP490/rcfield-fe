import { describe, expect, it } from "vitest"
import { getAuditGroup, getEligibleRuntimeRegistrations, groupMatchesByRound } from "./contest-runtime"

describe("contest runtime helpers", () => {
  it("filters eligible registrations for runtime", () => {
    const registrations = [
      { id: "1", status: "PENDING" },
      { id: "2", status: "CONFIRMED" },
      { id: "3", status: "CHECKED_IN" },
    ] as const

    expect(getEligibleRuntimeRegistrations(registrations as never)).toHaveLength(2)
  })

  it("groups matches by round number", () => {
    const matches = [
      { id: "a", round_no: 2 },
      { id: "b", round_no: 1 },
      { id: "c", round_no: 2 },
    ] as const

    const groups = groupMatchesByRound(matches as never)

    expect(groups).toEqual([
      { roundNo: 2, matches: [matches[0], matches[2]] },
      { roundNo: 1, matches: [matches[1]] },
    ])
  })

  it("maps audit event group by prefix", () => {
    expect(getAuditGroup({ eventType: "match.results_submitted" } as never)).toBe("match")
    expect(getAuditGroup({ eventType: "registration.checked_in" } as never)).toBe("registration")
    expect(getAuditGroup({ eventType: "contest.leaderboard_published" } as never)).toBe("contest")
  })
})
